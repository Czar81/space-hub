import { Server } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ExecutionArgs, GraphQLError, getOperationAST, parse, validate } from "graphql";
import { subscriptionRoot } from "@/graphql";
import { createContext } from "@/graphql/context";
import { formatGraphqlError, schema } from "@/graphql/schema";
import {
  ConnectionLimits,
  createConnectionLimiter,
  getClientIp,
} from "@/graphql/connection-limiter";

/** Path shared with the HTTP endpoint: `ws://host/api/graphql`. */
export const GRAPHQL_WS_PATH = "/api/graphql";

/** Messages bigger than this are rejected by `ws` before reaching GraphQL. */
const MAX_PAYLOAD_BYTES = 64 * 1024;

/** Open WebSocket connections allowed per client IP and in total. */
export const DEFAULT_CONNECTION_LIMITS: ConnectionLimits = { perIp: 10, total: 1000 };

/** WebSocket close code for "policy violation", used when a connection limit is reached. */
const POLICY_VIOLATION = 1008;

/** Optional payload of the `connection_init` message. */
interface ConnectionParams {
  /** Same value as the HTTP header: `Bearer <token>`. */
  authorization?: unknown;
  [key: string]: unknown;
}

/**
 * Parses and validates an incoming operation and only accepts subscriptions.
 * Queries and mutations must go through HTTP, where the rate limiter and the usual middlewares apply.
 *
 * @param query Operation document sent by the client.
 * @param operationName Operation to run when the document has several.
 * @returns The parsed document, or the errors to send back.
 */
export const prepareSubscription = (query: string, operationName?: string | null) => {
  let document: ReturnType<typeof parse>;

  try {
    document = parse(query);
  } catch (error) {
    return { errors: [error as GraphQLError] };
  }

  const validationErrors = validate(schema, document);
  if (validationErrors.length > 0) return { errors: validationErrors };

  const operation = getOperationAST(document, operationName);
  if (!operation || operation.operation !== "subscription") {
    return {
      errors: [
        new GraphQLError(
          "Only subscriptions are allowed over WebSocket, send queries and mutations to POST /api/graphql"
        ),
      ],
    };
  }

  return { document };
};

/**
 * Starts the `graphql-ws` server on top of the HTTP server, on the same path as the HTTP endpoint.
 * The token can be sent as `connectionParams.authorization` (`Bearer <token>`), giving resolvers the
 * same context as an HTTP request.
 *
 * Connections over `limits` (per IP or in total) are closed right away with code 1008.
 *
 * @param httpServer HTTP server returned by `app.listen`.
 * @param limits Maximum open connections per IP and in total.
 * @returns A disposable that closes every subscription (useful on shutdown and in tests).
 */
export const attachSubscriptionServer = (
  httpServer: Server,
  limits: ConnectionLimits = DEFAULT_CONNECTION_LIMITS
) => {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GRAPHQL_WS_PATH,
    maxPayload: MAX_PAYLOAD_BYTES,
  });

  const limiter = createConnectionLimiter(limits);

  // Registered before `useServer`, so a rejected socket is closed before graphql-ws handles it
  wsServer.on("connection", (socket, request) => {
    const ip = getClientIp(request);

    if (!limiter.tryAcquire(ip)) {
      socket.close(POLICY_VIOLATION, "Too many connections");
      return;
    }

    socket.once("close", () => limiter.release(ip));
  });

  return useServer<ConnectionParams>(
    {
      schema,
      onSubscribe: (ctx, message) => {
        const { query, operationName, variables } = message.payload;
        const prepared = prepareSubscription(query, operationName);

        // graphql-ws needs real GraphQLError instances here, they are formatted in `onError`
        if (prepared.errors) return prepared.errors;

        const authorization = ctx.connectionParams?.authorization;

        return {
          schema,
          document: prepared.document,
          operationName,
          variableValues: variables,
          rootValue: subscriptionRoot,
          contextValue: createContext({
            authorization: typeof authorization === "string" ? authorization : undefined,
          }),
        } satisfies ExecutionArgs;
      },
      onError: (_ctx, _message, errors) => errors.map((e) => formatGraphqlError(e)) as never,
      onNext: (_ctx, _message, _args, result) =>
        result.errors
          ? ({ ...result, errors: result.errors.map((e) => formatGraphqlError(e)) } as never)
          : undefined,
    },
    wsServer
  );
};

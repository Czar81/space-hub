import { graphqlHTTP } from "express-graphql";
import { rootValue } from "@/graphql";
import { createContext } from "@/graphql/context";
import { formatGraphqlError, schema } from "@/graphql/schema";

/**
 * POST/GET /api/graphql - queries and mutations, plus the GraphiQL playground.
 * Subscriptions are served over WebSocket on the same path (see `subscriptions.server.ts`),
 * because `express-graphql` only speaks HTTP.
 * Errors keep the shape of `AppError` (message, code and status in `extensions`).
 */
export const graphqlHandler = graphqlHTTP((req) => ({
  schema,
  rootValue,
  graphiql: { headerEditorEnabled: true },
  context: createContext(req.headers),
  customFormatErrorFn: formatGraphqlError,
}));

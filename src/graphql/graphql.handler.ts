import fs from "fs";
import path from "path";
import { buildSchema } from "graphql";
import { graphqlHTTP } from "express-graphql";
import { rootValue } from "@/graphql";
import { createContext } from "@/graphql/context";
import { AppError } from "@/core/utils/app-error";

/** Schema is loaded from `schema.graphql` (copied to `dist/` by the build script). */
const typeDefs = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8");
const schema = buildSchema(typeDefs);

/** Maps an HTTP status code to the `extensions.code` returned in GraphQL errors. */
const getGraphqlErrorCode = (statusCode: number) => {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
};

/**
 * POST/GET /api/graphql - GraphQL endpoint with the GraphiQL playground.
 * Errors keep the shape of `AppError` (message, code and status in `extensions`).
 */
export const graphqlHandler = graphqlHTTP((req) => ({
  schema,
  rootValue,
  graphiql: { headerEditorEnabled: true },
  context: createContext(req.headers),
  customFormatErrorFn: (error) => {
    const originalError = error.originalError;
    const appError = originalError instanceof AppError ? originalError : null;
    const statusCode = appError?.statusCode ?? (originalError ? 500 : 400);
    const message =
      appError?.message ?? (statusCode === 500 ? "Internal server error" : error.message);

    return {
      message,
      locations: error.locations,
      path: error.path,
      extensions: {
        code: getGraphqlErrorCode(statusCode),
        statusCode,
        ...(appError?.details ? { details: appError.details } : {}),
      },
    };
  },
}));

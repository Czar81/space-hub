import fs from "fs";
import path from "path";
import { buildSchema } from "graphql";
import { graphqlHTTP } from "express-graphql";
import { rootValue } from "@/graphql";
import { createContext } from "@/graphql/context";

const typeDefs = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8");
const schema = buildSchema(typeDefs);

export const graphqlHandler = graphqlHTTP((req) => ({
  schema,
  rootValue,
  graphiql: { headerEditorEnabled: true },
  context: createContext(req.headers),
}));
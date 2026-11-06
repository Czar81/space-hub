import app from "@/app";
import { env } from "@/core/config/env.config";

/** HTTP entry point, starts the server on the configured port. */
app.listen(env.PORT, () => {
  console.log(`SpaceHub API running on port ${env.PORT}`);
  console.log(`API docs: http://localhost:${env.PORT}/api/docs`);
  console.log(`GraphQL playground: http://localhost:${env.PORT}/api/graphql`);
});

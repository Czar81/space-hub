import app from "@/app";
import { env } from "@/core/config/env.config";
import { attachSubscriptionServer } from "@/graphql/subscriptions.server";

/** HTTP entry point. The GraphQL subscriptions (WebSocket) server shares the same port. */
const server = app.listen(env.PORT, () => {
  console.log(`SpaceHub API running on port ${env.PORT}`);
  console.log(`API docs: http://localhost:${env.PORT}/api/docs`);
  console.log(`GraphQL playground: http://localhost:${env.PORT}/api/graphql`);
  console.log(`GraphQL subscriptions: ws://localhost:${env.PORT}/api/graphql`);
});

attachSubscriptionServer(server);

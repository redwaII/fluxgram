import { buildApp } from './app.js';
import { connectMongo } from './config/database.js';
import { env } from './config/env.js';
import { setupSocketGateway } from './modules/websocket/socket.gateway.js';

async function main() {
  await connectMongo();
  const fastify = await buildApp();
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
  await setupSocketGateway(fastify.server);
  fastify.log.info(`HTTP + WS on port ${env.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

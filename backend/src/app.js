import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { registerJwt } from './plugins/jwt.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { AppError } from './common/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const fastify = Fastify({ logger: env.NODE_ENV !== 'test' });

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await registerJwt(fastify);

  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await fastify.register(fastifyStatic, {
    root: path.resolve(process.cwd(), env.UPLOAD_DIR),
    prefix: '/uploads/',
    decorateReply: false,
  });

  fastify.get('/health', async () => ({ ok: true }));

  fastify.register(
    async (api) => {
      api.register(authRoutes, { prefix: '/auth' });
      api.register(chatRoutes, { prefix: '/' });
      api.register(uploadRoutes, { prefix: '/' });
    },
    { prefix: '/api' }
  );

  fastify.setErrorHandler((err, request, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: err.message,
        details: err.details,
      });
    }
    if (err.validation) {
      return reply.code(400).send({ error: 'Validation failed', details: err.validation });
    }
    if (err.name === 'ValidationError' && err.errors) {
      return reply.code(400).send({ error: 'Validation failed', details: err.errors });
    }
    if (err.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
      return reply.code(409).send({ error: `Уже занято: ${field}` });
    }
    if (
      err.name === 'MongoServerSelectionError' ||
      err.name === 'MongoNetworkError' ||
      err.message?.includes('ECONNREFUSED') && err.message?.includes('27017')
    ) {
      return reply.code(503).send({
        error: 'База данных недоступна. Запустите MongoDB (например docker compose up -d) и проверьте MONGODB_URI в .env',
      });
    }
    fastify.log.error(err);
    const body = { error: 'Internal Server Error' };
    if (env.NODE_ENV === 'development') {
      body.detail = err.message;
    }
    return reply.code(500).send(body);
  });

  return fastify;
}

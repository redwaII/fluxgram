import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

export async function registerJwt(fastify) {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  fastify.decorate('authenticate', async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

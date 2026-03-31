import { authService } from './auth.service.js';
import { authController } from './auth.controller.js';

export async function authRoutes(fastify) {
  const svc = authService(fastify);
  const ctrl = authController(svc);

  fastify.post('/register', (req, reply) => ctrl.register(req, reply));
  fastify.post('/login', (req, reply) => ctrl.login(req, reply));
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    (req, reply) => ctrl.me(req, reply)
  );
}

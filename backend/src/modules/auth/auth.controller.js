import { z } from 'zod';
import { parseBody } from '../../common/validate.js';
import { AppError } from '../../common/errors.js';

const registerSchema = z.object({
  email: z.string().email().max(255),
  username: z.string().min(2).max(32),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export function authController(authSvc) {
  return {
    async register(request, reply) {
      const body = parseBody(registerSchema, request.body);
      const result = await authSvc.register(body);
      return reply.code(201).send(result);
    },

    async login(request, reply) {
      const body = parseBody(loginSchema, request.body);
      const result = await authSvc.login(body);
      return reply.send(result);
    },

    async me(request, reply) {
      const userId = request.user?.sub;
      if (!userId) throw new AppError(401, 'Unauthorized');
      const user = await authSvc.me(userId);
      return reply.send(user);
    },
  };
}

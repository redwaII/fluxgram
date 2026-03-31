import { chatService } from './chat.service.js';
import { chatController } from './chat.controller.js';

export async function chatRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate);

  const svc = chatService();
  const ctrl = chatController(svc);

  fastify.get('/chats', (req, reply) => ctrl.list(req, reply));
  fastify.post('/chats/direct', (req, reply) => ctrl.openDirect(req, reply));
  fastify.post('/chats/group', (req, reply) => ctrl.createGroup(req, reply));
  fastify.get('/chats/:chatId/messages', (req, reply) => ctrl.messages(req, reply));
  fastify.get('/chats/:chatId/search', (req, reply) => ctrl.searchMessages(req, reply));
  fastify.get('/users/search', (req, reply) => ctrl.searchUsers(req, reply));
}

import { z } from 'zod';
import { parseBody } from '../../common/validate.js';
import { AppError } from '../../common/errors.js';

const createGroupSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  participantIds: z.array(z.string()).min(1).max(50),
});

const directSchema = z.object({
  userId: z.string().min(1),
});

export function chatController(chatSvc) {
  return {
    async list(request, reply) {
      const userId = request.user.sub;
      const chats = await chatSvc.listChats(userId);
      return reply.send({ chats });
    },

    async openDirect(request, reply) {
      const userId = request.user.sub;
      const body = parseBody(directSchema, request.body);
      const chat = await chatSvc.openOrCreateDirect(userId, body.userId);
      return reply.send({ chat });
    },

    async createGroup(request, reply) {
      const userId = request.user.sub;
      const body = parseBody(createGroupSchema, request.body);
      const chat = await chatSvc.createGroup(userId, body);
      return reply.code(201).send({ chat });
    },

    async messages(request, reply) {
      const userId = request.user.sub;
      const { chatId } = request.params;
      const { before, limit } = request.query;
      const messages = await chatSvc.getMessages(userId, chatId, { before, limit });
      return reply.send({ messages });
    },

    async searchMessages(request, reply) {
      const userId = request.user.sub;
      const { chatId } = request.params;
      const q = request.query.q;
      if (!q) throw new AppError(400, 'Missing q');
      const messages = await chatSvc.searchInChat(userId, chatId, q);
      return reply.send({ messages });
    },

    async searchUsers(request, reply) {
      const userId = request.user.sub;
      const q = request.query.q;
      if (!q) throw new AppError(400, 'Missing q');
      const users = await chatSvc.searchUsers(userId, q);
      return reply.send({ users });
    },
  };
}

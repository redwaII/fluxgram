import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../../config/env.js';
import { getRedis, redisRefreshPresence, redisSetOffline, redisSetOnline } from '../../config/redis.js';
import { Message } from '../../models/Message.js';
import { chatRepository } from '../chat/chat.repository.js';

export async function setupSocketGateway(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  try {
    const pubClient = getRedis().duplicate();
    const subClient = getRedis().duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  } catch (e) {
    console.warn('[socket] Redis adapter skipped, using in-memory:', e.message);
  }

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, env.JWT_SECRET);
      const userId = payload.sub;
      if (!userId) return next(new Error('Unauthorized'));
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    await redisSetOnline(userId);
    socket.join(`user:${userId}`);

    io.emit('presence', { userId, online: true });

    const presenceInterval = setInterval(() => {
      redisRefreshPresence(userId).catch(() => {});
    }, 60000);

    socket.on('chat:join', async (chatId, cb) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          cb?.({ ok: false, error: 'Invalid chat' });
          return;
        }
        const chat = await chatRepository.getChatIfMember(chatId, userId);
        if (!chat) {
          cb?.({ ok: false, error: 'Forbidden' });
          return;
        }
        socket.join(`chat:${chatId}`);
        cb?.({ ok: true });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('typing:start', ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('typing', { chatId, userId, typing: true });
    });

    socket.on('typing:stop', ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('typing', { chatId, userId, typing: false });
    });

    socket.on('message:send', async (payload, cb) => {
      try {
        const { chatId, text, attachments } = payload || {};
        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
          cb?.({ ok: false, error: 'Invalid chat' });
          return;
        }
        const chat = await chatRepository.getChatIfMember(chatId, userId);
        if (!chat) {
          cb?.({ ok: false, error: 'Forbidden' });
          return;
        }
        const t = (text || '').slice(0, 16000);
        const att = Array.isArray(attachments) ? attachments.slice(0, 10) : [];
        if (!t && att.length === 0) {
          cb?.({ ok: false, error: 'Empty message' });
          return;
        }

        const msg = await chatRepository.insertMessage({
          chatId,
          senderId: userId,
          text: t,
          attachments: att,
        });
        await chatRepository.updateChatPreview(chatId, previewFromMessage(t, att));

        const populated = await Message.findById(msg._id).populate('sender', 'username avatarUrl').lean();

        const snd = populated.sender;
        const out = {
          id: populated._id.toString(),
          chatId: populated.chat.toString(),
          text: populated.text || '',
          attachments: populated.attachments || [],
          createdAt: populated.createdAt,
          sender: snd
            ? {
                id: snd._id.toString(),
                username: snd.username,
                avatarUrl: snd.avatarUrl || '',
              }
            : { id: userId, username: '', avatarUrl: '' },
        };

        io.to(`chat:${chatId}`).emit('message:new', out);
        io.emit('chat:preview', {
          chatId,
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: out.text || (att.length ? '📎 File' : ''),
        });

        cb?.({ ok: true, message: out });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('disconnect', async () => {
      clearInterval(presenceInterval);
      await redisSetOffline(userId);
      io.emit('presence', { userId, online: false });
    });
  });

  return io;
}

function previewFromMessage(text, att) {
  if (text?.trim()) return text.slice(0, 120);
  if (att.length) return '📎 File';
  return '';
}

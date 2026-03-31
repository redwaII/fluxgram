import mongoose from 'mongoose';
import { AppError } from '../../common/errors.js';
import { chatRepository } from './chat.repository.js';
import { redisIsOnline } from '../../config/redis.js';

function mapUser(u) {
  if (!u) return null;
  const id = u._id?.toString?.() ?? String(u);
  if (typeof u === 'string' || u instanceof mongoose.Types.ObjectId) {
    return { id: String(u), username: '', avatarUrl: '', lastSeen: null };
  }
  return {
    id,
    username: u.username,
    email: u.email,
    avatarUrl: u.avatarUrl || '',
    lastSeen: u.lastSeen,
  };
}

function mapChat(chat, currentUserId, onlineMap = {}) {
  const participants = (chat.participants || []).map(mapUser).filter(Boolean);
  const other =
    chat.type === 'direct'
      ? participants.find((p) => p.id !== currentUserId) || participants[0]
      : null;
  const title =
    chat.type === 'group'
      ? chat.name || 'Group'
      : other?.username || 'Chat';
  return {
    id: chat._id.toString(),
    type: chat.type,
    name: chat.name || '',
    title,
    lastMessageAt: chat.lastMessageAt,
    lastMessagePreview: chat.lastMessagePreview || '',
    participants: participants.map((p) => ({
      ...p,
      isOnline: onlineMap[p.id] ?? false,
    })),
  };
}

function mapMessage(m) {
  const sender = m.sender;
  return {
    id: m._id.toString(),
    chatId: m.chat?.toString?.() ?? String(m.chat),
    text: m.text || '',
    attachments: m.attachments || [],
    createdAt: m.createdAt,
    sender: sender && typeof sender === 'object' ? mapUser(sender) : { id: String(sender) },
  };
}

export function chatService() {
  return {
    async listChats(userId) {
      const chats = await chatRepository.listChatsForUser(userId);
      const onlineChecks = new Set();
      for (const c of chats) {
        for (const p of c.participants || []) {
          const pid = p._id?.toString();
          if (pid && pid !== userId) onlineChecks.add(pid);
        }
      }
      const onlineMap = {};
      await Promise.all(
        [...onlineChecks].map(async (pid) => {
          onlineMap[pid] = await redisIsOnline(pid);
        })
      );
      return chats.map((c) => mapChat(c, userId, onlineMap));
    },

    async openOrCreateDirect(userId, otherUserId) {
      if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
        throw new AppError(400, 'Invalid user id');
      }
      if (otherUserId === userId) throw new AppError(400, 'Cannot chat with yourself');
      const chat = await chatRepository.ensureDirectChat(userId, otherUserId);
      const populated = await chatRepository.getChatIfMember(chat._id, userId);
      const onlineMap = {
        [otherUserId]: await redisIsOnline(otherUserId),
      };
      return mapChat(populated, userId, onlineMap);
    },

    async createGroup(userId, { name, participantIds }) {
      const ids = (participantIds || []).filter((id) => id && id !== userId);
      const chat = await chatRepository.createGroup({
        name: name?.trim() || 'Group',
        creatorId: userId,
        participantIds: ids,
      });
      const populated = await chatRepository.getChatIfMember(chat._id, userId);
      return mapChat(populated, userId, {});
    },

    async getMessages(userId, chatId, { before, limit }) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) throw new AppError(400, 'Invalid chat id');
      const chat = await chatRepository.getChatIfMember(chatId, userId);
      if (!chat) throw new AppError(404, 'Chat not found');
      const items = await chatRepository.listMessages({
        chatId,
        beforeId: before,
        limit: limit ? Number(limit) : 50,
      });
      return items.map(mapMessage);
    },

    async searchInChat(userId, chatId, q) {
      if (!q?.trim()) throw new AppError(400, 'Query required');
      const chat = await chatRepository.getChatIfMember(chatId, userId);
      if (!chat) throw new AppError(404, 'Chat not found');
      const items = await chatRepository.searchMessages(chatId, q.trim());
      return items.map(mapMessage);
    },

    async searchUsers(userId, q) {
      if (!q?.trim()) throw new AppError(400, 'Query required');
      const users = await chatRepository.findUsersByQuery(q.trim(), userId);
      const out = [];
      for (const u of users) {
        const id = u._id.toString();
        out.push({
          ...mapUser(u),
          isOnline: await redisIsOnline(id),
        });
      }
      return out;
    },
  };
}

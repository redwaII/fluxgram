import mongoose from 'mongoose';
import { Chat } from '../../models/Chat.js';
import { Message } from '../../models/Message.js';
import { User } from '../../models/User.js';

function directKeyFor(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `d:${x}:${y}`;
}

export const chatRepository = {
  directKeyFor,

  async findDirectChat(userA, userB) {
    const key = directKeyFor(userA, userB);
    return Chat.findOne({ type: 'direct', directKey: key });
  },

  async ensureDirectChat(userA, userB) {
    const key = directKeyFor(userA, userB);
    let chat = await Chat.findOne({ type: 'direct', directKey: key });
    if (chat) return chat;
    chat = await Chat.create({
      type: 'direct',
      participants: [userA, userB],
      directKey: key,
    });
    return chat;
  },

  async createGroup({ name, creatorId, participantIds }) {
    const ids = [...new Set([creatorId, ...participantIds].map(String))].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    return Chat.create({
      type: 'group',
      name: name || 'Group',
      participants: ids,
    });
  },

  async listChatsForUser(userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    return Chat.find({ participants: uid })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username email avatarUrl lastSeen')
      .lean();
  },

  async getChatIfMember(chatId, userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    return Chat.findOne({ _id: chatId, participants: uid }).populate(
      'participants',
      'username email avatarUrl lastSeen'
    );
  },

  async updateChatPreview(chatId, preview) {
    return Chat.findByIdAndUpdate(
      chatId,
      { lastMessageAt: new Date(), lastMessagePreview: preview },
      { new: true }
    );
  },

  async addParticipantsToGroup(chatId, userIds) {
    const ids = userIds.map((id) => new mongoose.Types.ObjectId(id));
    return Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: { $each: ids } } },
      { new: true }
    ).populate('participants', 'username email avatarUrl lastSeen');
  },

  async insertMessage({ chatId, senderId, text, attachments }) {
    return Message.create({
      chat: chatId,
      sender: senderId,
      text: text || '',
      attachments: attachments || [],
    });
  },

  async listMessages({ chatId, beforeId, limit = 50 }) {
    const q = { chat: chatId };
    if (beforeId) {
      const cursor = await Message.findById(beforeId).select('createdAt');
      if (cursor) q.createdAt = { $lt: cursor.createdAt };
    }
    const items = await Message.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .populate('sender', 'username avatarUrl')
      .lean();
    return items.reverse();
  },

  async searchMessages(chatId, query, limit = 30) {
    return Message.find({
      chat: chatId,
      text: new RegExp(escapeRegex(query), 'i'),
    })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .populate('sender', 'username avatarUrl')
      .lean();
  },

  async findUsersByQuery(search, excludeId, limit = 20) {
    const ex = new mongoose.Types.ObjectId(excludeId);
    return User.find({
      _id: { $ne: ex },
      $or: [
        { username: new RegExp(escapeRegex(search), 'i') },
        { email: new RegExp(escapeRegex(search), 'i') },
      ],
    })
      .select('username email avatarUrl lastSeen')
      .limit(limit)
      .lean();
  },
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

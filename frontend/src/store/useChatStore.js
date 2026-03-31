import { create } from 'zustand';
import { api } from '../lib/api.js';

export const useChatStore = create((set, get) => ({
  chats: [],
  messagesByChat: {},
  hasMoreByChat: {},
  loadingChats: false,
  loadingMessages: {},
  activeChatId: null,
  typingByChat: {},

  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),

  fetchChats: async () => {
    set({ loadingChats: true });
    try {
      const { chats } = await api('/api/chats');
      set({ chats, loadingChats: false });
    } catch {
      set({ loadingChats: false });
    }
  },

  openDirect: async (userId) => {
    const { chat } = await api('/api/chats/direct', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    const { chats } = get();
    const idx = chats.findIndex((c) => c.id === chat.id);
    const next = idx >= 0 ? [...chats] : [chat, ...chats];
    if (idx >= 0) next[idx] = chat;
    set({ chats: next, activeChatId: chat.id });
    return chat;
  },

  createGroup: async (name, participantIds) => {
    const { chat } = await api('/api/chats/group', {
      method: 'POST',
      body: JSON.stringify({ name, participantIds }),
    });
    set((s) => ({ chats: [chat, ...s.chats], activeChatId: chat.id }));
    return chat;
  },

  fetchMessages: async (chatId, { before } = {}) => {
    set((s) => ({ loadingMessages: { ...s.loadingMessages, [chatId]: true } }));
    try {
      const q = before ? `?before=${before}&limit=40` : '?limit=40';
      const { messages } = await api(`/api/chats/${chatId}/messages${q}`);
      set((s) => {
        const prev = s.messagesByChat[chatId] || [];
        const merged = before ? [...messages, ...prev] : messages;
        return {
          messagesByChat: { ...s.messagesByChat, [chatId]: merged },
          hasMoreByChat: { ...s.hasMoreByChat, [chatId]: messages.length >= 40 },
          loadingMessages: { ...s.loadingMessages, [chatId]: false },
        };
      });
    } catch {
      set((s) => ({
        loadingMessages: { ...s.loadingMessages, [chatId]: false },
      }));
    }
  },

  prependMessages: (chatId, older) =>
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: [...older, ...(s.messagesByChat[chatId] || [])],
      },
    })),

  addMessage: (chatId, msg) =>
    set((s) => {
      const list = s.messagesByChat[chatId] || [];
      if (list.some((m) => m.id === msg.id)) return s;
      return {
        messagesByChat: { ...s.messagesByChat, [chatId]: [...list, msg] },
      };
    }),

  updatePreview: (chatId, preview, at) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId
          ? { ...c, lastMessagePreview: preview, lastMessageAt: at || c.lastMessageAt }
          : c
      ),
    })),

  reorderChat: (chatId) =>
    set((s) => {
      const c = s.chats.find((x) => x.id === chatId);
      if (!c) return s;
      const rest = s.chats.filter((x) => x.id !== chatId);
      return { chats: [c, ...rest] };
    }),

  setTyping: (chatId, userId, typing) =>
    set((s) => {
      const cur = { ...(s.typingByChat[chatId] || {}) };
      if (typing) cur[userId] = true;
      else delete cur[userId];
      return { typingByChat: { ...s.typingByChat, [chatId]: cur } };
    }),

  searchUsers: async (q) => {
    if (!q.trim()) return [];
    const { users } = await api(`/api/users/search?q=${encodeURIComponent(q)}`);
    return users;
  },

  searchMessages: async (chatId, q) => {
    const { messages } = await api(
      `/api/chats/${chatId}/search?q=${encodeURIComponent(q)}`
    );
    return messages;
  },
}));

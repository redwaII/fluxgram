import { create } from 'zustand';
import { api } from '../lib/api.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  bootstrap: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null, loading: false });
      return;
    }
    try {
      const user = await api('/api/auth/me');
      connectSocket(token);
      set({ user, token, loading: false, error: null });
    } catch {
      localStorage.removeItem('token');
      disconnectSocket();
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    connectSocket(data.token);
    set({ user: data.user, token: data.token });
  },

  register: async (email, username, password) => {
    set({ error: null });
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    localStorage.setItem('token', data.token);
    connectSocket(data.token);
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));

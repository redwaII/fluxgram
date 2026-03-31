import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useChatStore } from '../store/useChatStore.js';
import { getSocket } from '../lib/socket.js';
import { api, uploadAvatar } from '../lib/api.js';
import { ChatList } from './ChatList.jsx';
import { MessagePane } from './MessagePane.jsx';
import { NewChatModal } from './NewChatModal.jsx';
import { Avatar } from './Avatar.jsx';

export function MessengerLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const chats = useChatStore((s) => s.chats);
  const fetchChats = useChatStore((s) => s.fetchChats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const messagesByChat = useChatStore((s) => s.messagesByChat);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const loadingMessages = useChatStore((s) => s.loadingMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updatePreview = useChatStore((s) => s.updatePreview);
  const reorderChat = useChatStore((s) => s.reorderChat);
  const setTyping = useChatStore((s) => s.setTyping);
  const openDirect = useChatStore((s) => s.openDirect);
  const searchUsers = useChatStore((s) => s.searchUsers);
  const loadingChats = useChatStore((s) => s.loadingChats);
  const hasMoreByChat = useChatStore((s) => s.hasMoreByChat);
  const typingByChat = useChatStore((s) => s.typingByChat);
  const prependMessages = useChatStore((s) => s.prependMessages);

  const [modal, setModal] = useState(false);
  const loadingMoreRef = useRef(false);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const msgLoading =
    Boolean(loadingMessages[activeChatId]) && !(messagesByChat[activeChatId]?.length);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return undefined;

    const onMessage = (msg) => {
      addMessage(msg.chatId, msg);
      updatePreview(msg.chatId, msg.text || (msg.attachments?.length ? '📎' : ''), msg.createdAt);
      reorderChat(msg.chatId);
      if (
        document.hidden &&
        msg.sender?.id !== user?.id &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const title =
          chats.find((c) => c.id === msg.chatId)?.title || 'Fluxgram';
        new Notification(title, { body: msg.text || 'Новое сообщение', silent: true });
      }
    };

    const onPreview = ({ chatId, lastMessageAt, lastMessagePreview }) => {
      updatePreview(chatId, lastMessagePreview, lastMessageAt);
      reorderChat(chatId);
    };

    const onTyping = ({ chatId, userId, typing }) => {
      setTyping(chatId, userId, typing);
    };

    const onPresence = () => {
      fetchChats();
    };

    s.on('message:new', onMessage);
    s.on('chat:preview', onPreview);
    s.on('typing', onTyping);
    s.on('presence', onPresence);

    return () => {
      s.off('message:new', onMessage);
      s.off('chat:preview', onPreview);
      s.off('typing', onTyping);
      s.off('presence', onPresence);
    };
  }, [addMessage, updatePreview, reorderChat, setTyping, fetchChats, user?.id, chats]);

  useEffect(() => {
    if (!activeChatId) return undefined;
    const s = getSocket();
    if (!s) return undefined;
    s.emit('chat:join', activeChatId, () => {});
    fetchMessages(activeChatId);
    return () => {
      s.emit('chat:leave', activeChatId);
    };
  }, [activeChatId, fetchMessages]);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const onSelectChat = useCallback(
    (id) => {
      setActiveChatId(id);
    },
    [setActiveChatId]
  );

  const onBack = useCallback(() => {
    setActiveChatId(null);
  }, [setActiveChatId]);

  const onLoadMore = useCallback(async () => {
    if (!activeChatId || hasMoreByChat[activeChatId] === false || loadingMoreRef.current) return;
    const list = messagesByChat[activeChatId];
    if (!list?.length) return;
    loadingMoreRef.current = true;
    const before = list[0].id;
    try {
      const { messages } = await api(
        `/api/chats/${activeChatId}/messages?before=${before}&limit=40`
      );
      if (messages.length) prependMessages(activeChatId, messages);
      useChatStore.setState((st) => ({
        hasMoreByChat: {
          ...st.hasMoreByChat,
          [activeChatId]: messages.length >= 40,
        },
      }));
    } finally {
      loadingMoreRef.current = false;
    }
  }, [activeChatId, hasMoreByChat, messagesByChat, prependMessages]);

  async function onAvatarPick(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const { avatarUrl } = await uploadAvatar(f);
      setUser({ ...user, avatarUrl });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <aside className="flex w-full shrink-0 items-center justify-between gap-2 border-b border-tg-border bg-tg-panel px-3 py-2 md:w-14 md:flex-col md:border-b-0 md:border-r md:py-4">
        <label className="cursor-pointer">
          <Avatar user={user} size={40} />
          <input type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
        </label>
        <span className="min-w-0 flex-1 truncate text-sm font-medium md:hidden">{user?.username}</span>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-tg-muted hover:bg-tg-hover md:mt-auto md:px-1 md:text-xs"
          onClick={logout}
        >
          Выход
        </button>
      </aside>

      <div
        className={`h-full min-h-0 shrink-0 border-tg-border md:flex md:w-[min(100%,360px)] md:shrink-0 md:border-r ${
          activeChatId ? 'hidden md:flex' : 'flex flex-1'
        } flex-col`}
      >
        <ChatList
          chats={chats}
          activeId={activeChatId}
          onSelect={onSelectChat}
          loading={loadingChats}
          currentUserId={user?.id}
          onNewChat={() => setModal(true)}
          onSearch={() => {}}
        />
      </div>

      <div
        className={`min-h-0 min-w-0 flex-1 flex-col bg-tg-bg ${
          activeChatId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeChat ? (
          <MessagePane
            chat={activeChat}
            messages={messagesByChat[activeChatId] || []}
            currentUserId={user?.id}
            loading={msgLoading}
            hasMore={hasMoreByChat[activeChatId] !== false}
            onLoadMore={onLoadMore}
            typingUsers={typingByChat[activeChatId]}
            onBack={onBack}
            showBack
          />
        ) : (
          <div className="hidden h-full flex-1 items-center justify-center text-tg-muted md:flex">
            Выберите чат
          </div>
        )}
      </div>

      <NewChatModal
        open={modal}
        onClose={() => setModal(false)}
        searchUsers={searchUsers}
        onPickUser={(u) => openDirect(u.id)}
      />
    </div>
  );
}

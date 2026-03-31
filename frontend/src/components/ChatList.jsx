import { Avatar } from './Avatar.jsx';
import { ChatRowSkeleton } from './Skeleton.jsx';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function ChatList({
  chats,
  activeId,
  onSelect,
  loading,
  currentUserId,
  onNewChat,
  onSearch,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-tg-border bg-tg-panel md:w-[360px] md:min-w-[280px] md:max-w-[420px]">
      <header className="flex shrink-0 items-center gap-2 border-b border-tg-border px-3 py-3">
        <input
          type="search"
          placeholder="Поиск пользователей…"
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-tg-bg px-3 py-2 text-sm outline-none placeholder:text-tg-muted focus:border-tg-accent"
          onChange={(e) => onSearch(e.target.value)}
        />
        <button
          type="button"
          onClick={onNewChat}
          className="shrink-0 rounded-xl bg-tg-accent px-3 py-2 text-sm font-medium text-white hover:bg-tg-accentHover"
        >
          +
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto msg-scroll">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => <ChatRowSkeleton key={i} />)}
        {!loading &&
          chats.map((c) => {
            const peer =
              c.type === 'direct'
                ? c.participants?.find((p) => p.id !== currentUserId) || c.participants?.[0]
                : null;
            const online = c.type === 'direct' && peer?.isOnline;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={`flex w-full gap-3 px-3 py-3 text-left transition hover:bg-tg-hover ${
                  c.id === activeId ? 'bg-tg-hover' : ''
                }`}
              >
                <Avatar user={peer ? { ...peer, isOnline: online } : { username: c.title }} />
                <div className="min-w-0 flex-1 border-b border-tg-border/30 pb-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{c.title}</span>
                    <span className="shrink-0 text-xs text-tg-muted">
                      {formatTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-tg-muted">{c.lastMessagePreview || ' '}</p>
                </div>
              </button>
            );
          })}
        {!loading && chats.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-tg-muted">Нет чатов. Начните диалог.</p>
        )}
      </div>
    </div>
  );
}

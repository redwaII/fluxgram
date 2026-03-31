import { useEffect, useRef, useState, useCallback } from 'react';
import { Avatar } from './Avatar.jsx';
import { MessageSkeleton } from './Skeleton.jsx';
import { assetUrl, uploadFile } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';

export function MessagePane({
  chat,
  messages,
  currentUserId,
  loading,
  hasMore,
  onLoadMore,
  typingUsers,
  onBack,
  showBack,
}) {
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimer = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!loading && messages?.length) scrollToBottom();
  }, [chat?.id, loading, messages?.length, scrollToBottom]);

  const emitTyping = (typing) => {
    const s = getSocket();
    if (!s || !chat?.id) return;
    if (typing) s.emit('typing:start', { chatId: chat.id });
    else s.emit('typing:stop', { chatId: chat.id });
  };

  function onInputChange(v) {
    setText(v);
    emitTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 2000);
  }

  async function sendMessage(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t && !sending) return;
    const s = getSocket();
    if (!s || !chat?.id) return;
    setSending(true);
    emitTyping(false);
    s.emit('message:send', { chatId: chat.id, text: t, attachments: [] }, () => {
      setSending(false);
    });
    setText('');
  }

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !chat?.id) return;
    try {
      const { url, mimeType, originalName } = await uploadFile(file);
      const s = getSocket();
      s.emit(
        'message:send',
        {
          chatId: chat.id,
          text: '',
          attachments: [{ url, mimeType, originalName }],
        },
        () => {}
      );
    } catch {
      /* toast optional */
    }
  }

  function onScroll() {
    const el = listRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop < 80) onLoadMore?.();
  }

  const peer =
    chat?.type === 'direct'
      ? chat.participants?.find((p) => p.id !== currentUserId)
      : null;
  const typingNames = Object.keys(typingUsers || {})
    .filter((id) => id !== currentUserId)
    .map((id) => chat?.participants?.find((p) => p.id === id)?.username || '…')
    .filter(Boolean);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-tg-bg">
      <header className="flex shrink-0 items-center gap-3 border-b border-tg-border bg-tg-panel px-3 py-2">
        {showBack && (
          <button
            type="button"
            className="rounded-lg p-2 text-tg-muted hover:bg-tg-hover md:hidden"
            onClick={onBack}
            aria-label="Назад"
          >
            ←
          </button>
        )}
        <Avatar user={peer || { username: chat?.title }} size={40} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{chat?.title || 'Чат'}</h2>
          {peer && (
            <p className="text-xs text-tg-muted">
              {peer.isOnline ? 'в сети' : 'не в сети'}
            </p>
          )}
        </div>
      </header>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="msg-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3"
      >
        {loading && <MessageSkeleton />}
        {!loading &&
          messages?.map((m) => {
            const mine = m.sender?.id === currentUserId;
            return (
              <div
                key={m.id}
                className={`mb-2 flex animate-fadeIn ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    mine
                      ? 'rounded-br-md bg-tg-bubbleOut text-white'
                      : 'rounded-bl-md bg-tg-bubbleIn text-tg-text'
                  }`}
                >
                  {!mine && chat?.type === 'group' && (
                    <p className="mb-1 text-xs font-medium text-tg-accent">{m.sender?.username}</p>
                  )}
                  {m.attachments?.map((a, i) => (
                    <div key={i} className="mb-1">
                      {a.mimeType?.startsWith('image/') ? (
                        <img
                          src={assetUrl(a.url)}
                          alt=""
                          className="max-h-48 max-w-full rounded-lg"
                        />
                      ) : (
                        <a
                          href={assetUrl(a.url)}
                          className="underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a.originalName || 'Файл'}
                        </a>
                      )}
                    </div>
                  ))}
                  {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                  <p
                    className={`mt-1 text-[10px] opacity-70 ${
                      mine ? 'text-right text-white/80' : 'text-tg-muted'
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {typingNames.length > 0 && (
        <p className="px-4 pb-1 text-xs italic text-tg-muted">
          {typingNames.join(', ')} печатает…
        </p>
      )}

      <form
        onSubmit={sendMessage}
        className="flex shrink-0 items-end gap-2 border-t border-tg-border bg-tg-panel p-2"
      >
        <label className="cursor-pointer rounded-xl bg-tg-hover p-3 text-lg hover:bg-tg-border">
          📎
          <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        </label>
        <textarea
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-tg-hover bg-tg-bg px-4 py-3 text-sm outline-none focus:border-tg-accent"
          placeholder="Сообщение…"
          value={text}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-2xl bg-tg-accent px-5 py-3 text-sm font-medium text-white hover:bg-tg-accentHover disabled:opacity-40"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

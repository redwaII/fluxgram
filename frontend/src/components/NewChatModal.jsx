import { useState } from 'react';
import { Avatar } from './Avatar.jsx';

export function NewChatModal({ open, onClose, onPickUser, searchUsers }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  async function runSearch(v) {
    setQ(v);
    if (!v.trim()) {
      setResults([]);
      return;
    }
    setBusy(true);
    try {
      const u = await searchUsers(v);
      setResults(u);
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 md:items-center">
      <div
        className="max-h-[80vh] w-full max-w-md animate-fadeIn overflow-hidden rounded-2xl bg-tg-panel shadow-2xl"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-tg-border px-4 py-3">
          <h3 className="font-semibold">Новый чат</h3>
          <button type="button" className="text-tg-muted hover:text-tg-text" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-3">
          <input
            autoFocus
            className="w-full rounded-xl border border-tg-hover bg-tg-bg px-4 py-3 text-sm outline-none focus:border-tg-accent"
            placeholder="Имя или email…"
            value={q}
            onChange={(e) => runSearch(e.target.value)}
          />
        </div>
        <ul className="max-h-64 overflow-y-auto msg-scroll px-2 pb-4">
          {busy && <li className="px-3 py-2 text-sm text-tg-muted">Поиск…</li>}
          {!busy &&
            results.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-tg-hover"
                  onClick={() => {
                    onPickUser(u);
                    onClose();
                    setQ('');
                    setResults([]);
                  }}
                >
                  <Avatar user={u} size={40} />
                  <div>
                    <p className="font-medium">{u.username}</p>
                    <p className="text-xs text-tg-muted">{u.email}</p>
                  </div>
                </button>
              </li>
            ))}
          {!busy && q && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-tg-muted">Никого не найдено</li>
          )}
        </ul>
      </div>
    </div>
  );
}

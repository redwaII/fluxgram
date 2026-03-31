import { assetUrl } from '../lib/api.js';

export function Avatar({ user, size = 48, className = '' }) {
  const s = `${size}px`;
  const url = user?.avatarUrl ? assetUrl(user.avatarUrl) : '';
  const letter = (user?.username || user?.email || '?').charAt(0).toUpperCase();
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-tg-hover text-sm font-medium text-tg-muted ${className}`}
      style={{ width: s, height: s }}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        letter
      )}
      {user?.isOnline && (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-tg-panel bg-tg-online"
          title="в сети"
        />
      )}
    </div>
  );
}

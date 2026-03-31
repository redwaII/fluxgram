import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

export function AuthScreen({ mode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-tg-accent border-t-transparent" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, username, password);
      navigate('/', { replace: true });
    } catch (er) {
      setErr(er.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm animate-fadeIn rounded-2xl border border-tg-hover/50 bg-tg-panel p-8 shadow-xl">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">Fluxgram</h1>
        <p className="mb-6 text-center text-sm text-tg-muted">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className="rounded-xl border border-tg-hover bg-tg-bg px-4 py-3 text-sm outline-none transition focus:border-tg-accent"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode === 'register' && (
            <input
              className="rounded-xl border border-tg-hover bg-tg-bg px-4 py-3 text-sm outline-none transition focus:border-tg-accent"
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={2}
              required
            />
          )}
          <input
            className="rounded-xl border border-tg-hover bg-tg-bg px-4 py-3 text-sm outline-none transition focus:border-tg-accent"
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === 'register' ? 8 : 1}
            required
          />
          {err && <p className="text-center text-sm text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-xl bg-tg-accent py-3 text-sm font-medium text-white transition hover:bg-tg-accentHover disabled:opacity-50"
          >
            {busy ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-tg-muted">
          {mode === 'login' ? (
            <>
              Нет аккаунта?{' '}
              <Link className="text-tg-accent hover:underline" to="/register">
                Регистрация
              </Link>
            </>
          ) : (
            <>
              Уже есть аккаунт?{' '}
              <Link className="text-tg-accent hover:underline" to="/login">
                Вход
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

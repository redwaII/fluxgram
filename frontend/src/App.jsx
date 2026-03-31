import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore.js';
import { AuthScreen } from './components/AuthScreen.jsx';
import { MessengerLayout } from './components/MessengerLayout.jsx';

function PrivateRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-tg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-tg-accent border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <div className="h-full min-h-[100dvh]">
      <Routes>
        <Route path="/login" element={<AuthScreen mode="login" />} />
        <Route path="/register" element={<AuthScreen mode="register" />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MessengerLayout />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

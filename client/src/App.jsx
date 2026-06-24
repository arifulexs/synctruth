import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useSocket } from './hooks/useSocket';
import { api } from './utils/api';

import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import InvitePopup from './components/InvitePopup';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import PlayPage from './pages/PlayPage';
import RoomPage from './pages/RoomPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import MemoriesPage from './pages/MemoriesPage';

// Sound toggle button (global, outside bottom nav)
function SoundToggle() {
  const { soundEnabled, toggleSound } = useStore();
  const location = useLocation();
  if (location.pathname.startsWith('/room/')) return null;
  return (
    <button className="sound-btn" onClick={toggleSound} title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}>
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  );
}

// Auth guard
function RequireAuth({ children }) {
  const { user, isLoading } = useStore();
  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '16px',
          background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
          animation: 'pulse 2s ease infinite',
        }}>🔮</div>
        <div className="loader"><span/><span/><span/></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

// Socket initializer (only when authed)
function SocketInit() {
  useSocket();
  return null;
}

function AppInner() {
  const { setUser, setToken, setIsLoading, setNotifications } = useStore();

  // Bootstrap auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('st_token');
    const userStr = localStorage.getItem('st_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setToken(token);
        setUser(user);

        // Refresh user data from server
        api.auth.me(token).then(freshUser => {
          const updated = { ...user, ...freshUser };
          setUser(updated);
          localStorage.setItem('st_user', JSON.stringify(updated));
          if (freshUser.notifications) setNotifications(freshUser.notifications);
        }).catch(() => {
          // Token invalid — clear
          localStorage.removeItem('st_token');
          localStorage.removeItem('st_user');
          setUser(null);
          setToken(null);
        });
      } catch {
        localStorage.removeItem('st_token');
        localStorage.removeItem('st_user');
      }
    }
    setIsLoading(false);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<RequireAuth><SocketInit /><HomePage /></RequireAuth>} />
        <Route path="/play" element={<RequireAuth><PlayPage /></RequireAuth>} />
        <Route path="/room/:code" element={<RequireAuth><RoomPage /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/memories" element={<RequireAuth><MemoriesPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <Toast />
      <InvitePopup />
      <SoundToggle />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

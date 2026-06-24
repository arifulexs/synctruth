import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import Button from '../components/Button';

const AVATAR_EMOJIS = [
  '🦊','🐺','🐉','🦋','🌙','⚡','🔮','🎭','🌊','🦄',
  '🎸','🌸','🔥','💎','🌿','👾','🎪','🦅','🌙','✨',
];

function EmojiAvatar({ selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
      {AVATAR_EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          style={{
            fontSize: '28px', width: '48px', height: '48px',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: selected === e ? 'rgba(124,58,237,0.25)' : 'var(--bg-glass)',
            border: `2px solid ${selected === e ? 'var(--accent-violet)' : 'var(--border)'}`,
            transition: 'var(--transition)',
            transform: selected === e ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { setUser, setToken, showToast } = useStore();
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e?.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const data = mode === 'register'
        ? await api.auth.register({ username: username.trim(), password, avatar })
        : await api.auth.login({ username: username.trim(), password });

      localStorage.setItem('st_token', data.token);
      localStorage.setItem('st_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome${mode === 'register' ? ', ' + data.user.username + '! 🎉' : ' back! ✨'}`, 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative orbs */}
      <div className="glow-orb violet" style={{ width: 300, height: 300, top: -100, right: -80 }} />
      <div className="glow-orb pink" style={{ width: 200, height: 200, bottom: 50, left: -60 }} />

      <div className="page-enter" style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '20px',
            background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
          }}>
            🔮
          </div>
          <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
            <span className="gradient-text">SyncTruth</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Discover your friends through simultaneous answers
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--bg-elevated)',
          borderRadius: '12px', padding: '4px', marginBottom: 24,
          border: '1px solid var(--border)',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                fontWeight: 600, fontSize: '14px',
                background: mode === m ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-secondary)',
                transition: 'var(--transition)',
                textTransform: 'capitalize',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
                Choose your avatar
              </label>
              <EmojiAvatar selected={avatar} onSelect={setAvatar} />
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. stardust_42"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              maxLength={20}
            />
            {mode === 'register' && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                2–20 chars, letters/numbers/_ allowed
              </p>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Min 4 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', padding: '10px 14px',
              color: '#EF4444', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="full" loading={loading} style={{ marginTop: 4 }}>
            {mode === 'register' ? '✨ Create Account' : '🔮 Sign In'}
          </Button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)',
          marginTop: 24, lineHeight: 1.6,
        }}>
          No email needed. Just pick a username and start playing.
        </p>
      </div>
    </div>
  );
}

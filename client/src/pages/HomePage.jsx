import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

const TIPS = [
  '💡 Both players must answer before anyone sees the results',
  '🔮 Answers are revealed side-by-side with a flip animation',
  '🔥 Chat unlocks after every reveal — discuss away!',
  '📌 Pin your favorite answer rounds to your memory wall',
  '✨ Create custom questions to surprise your friend',
  '🎭 Try the "Deep Questions" category for real conversations',
];

function StatCard({ label, value, gradient }) {
  return (
    <div style={{
      flex: 1, background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', borderRadius: '14px',
      padding: '16px', textAlign: 'center', minWidth: 0,
    }}>
      <p style={{
        fontSize: '24px', fontWeight: 800,
        fontFamily: 'var(--font-display)',
        background: gradient, WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

export default function HomePage() {
  const { user, socket, connected } = useStore();
  const navigate = useNavigate();
  const [tipIdx, setTipIdx] = useState(0);
  const [friendsOnline, setFriendsOnline] = useState([]);
  const [recentPins, setRecentPins] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('friend:online', (f) => setFriendsOnline(p => [...p.filter(x => x.userId !== f.userId), f]));
    socket.on('friend:offline', ({ userId }) => setFriendsOnline(p => p.filter(x => x.userId !== userId)));
    return () => { socket.off('friend:online'); socket.off('friend:offline'); };
  }, [socket]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page page-enter" style={{ padding: '0 0 0 0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)',
        padding: '52px 20px 28px',
        borderBottom: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="glow-orb violet" style={{ width: 200, height: 200, top: -80, right: -60, opacity: 0.12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
          <Avatar name={user?.username} src={user?.avatar} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{greeting} 👋</p>
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', truncate: true }}>
              {user?.username}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--accent-green)' : 'var(--text-dim)',
            }} />
            <span style={{ fontSize: '11px', color: connected ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {connected ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Quick Actions */}
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Quick Start
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => navigate('/play')}
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))',
                border: '1px solid var(--border-accent)', borderRadius: '16px',
                padding: '20px 16px', textAlign: 'left', cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✨</div>
              <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '3px' }}>New Room</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Create & invite a friend</p>
            </button>

            <button
              onClick={() => navigate('/play?join=1')}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '20px 16px', textAlign: 'left',
                cursor: 'pointer', transition: 'var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔑</div>
              <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '3px' }}>Join Room</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enter a room code</p>
            </button>
          </div>
        </div>

        {/* Tip carousel */}
        <div style={{
          background: 'rgba(124,58,237,0.08)', border: '1px solid var(--border-accent)',
          borderRadius: '14px', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '18px' }}>💫</span>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', transition: 'opacity 0.5s' }}>
            {TIPS[tipIdx]}
          </p>
        </div>

        {/* Stats */}
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your Stats
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <StatCard
              label="Friends" value={user?.friends?.length || 0}
              gradient="linear-gradient(135deg, #7C3AED, #EC4899)"
            />
            <StatCard
              label="Pinned Rounds" value={user?.pinnedAnswers?.length || 0}
              gradient="linear-gradient(135deg, #F59E0B, #EF4444)"
            />
            <StatCard
              label="Questions" value={user?.customQuestions?.length || 0}
              gradient="linear-gradient(135deg, #10B981, #06B6D4)"
            />
          </div>
        </div>

        {/* Friends online */}
        {friendsOnline.length > 0 && (
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Friends Online
            </h3>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {friendsOnline.map(f => (
                <div key={f.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <Avatar name={f.username} size={48} online={true} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigate to memories */}
        <button
          onClick={() => navigate('/memories')}
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            transition: 'var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{
            width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(245,158,11,0.2))',
            border: '1px solid rgba(236,72,153,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          }}>📌</div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '2px' }}>Friendship Timeline</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              View pinned moments & export memory cards
            </p>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
        </button>
      </div>
    </div>
  );
}

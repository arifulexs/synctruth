import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function NotificationsPage() {
  const { notifications, markNotifRead, clearNotifications, socket, showToast } = useStore();
  const navigate = useNavigate();

  function handleNotifClick(notif) {
    markNotifRead(notif.id);
    socket?.emit('notification:read', { notifId: notif.id });

    if (notif.type === 'room_invite') {
      navigate(`/room/${notif.roomCode}`);
    }
  }

  function handleClearAll() {
    clearNotifications();
    socket?.emit('notifications:clear', () => {});
    showToast('Notifications cleared', 'info');
  }

  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt);

  const typeConfig = {
    room_invite: { emoji: '🎮', label: 'Room Invite', color: 'var(--accent-violet)' },
    friend_added: { emoji: '👥', label: 'New Friend', color: 'var(--accent-green)' },
    default:      { emoji: '🔔', label: 'Notification', color: 'var(--accent-cyan)' },
  };

  return (
    <div className="page page-enter" style={{ padding: '52px 0 0' }}>
      {/* Header */}
      <div style={{
        padding: '0 20px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            🔔 Alerts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {notifications.filter(n => !n.read).length} unread
          </p>
        </div>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}
            style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Clear all
          </Button>
        )}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🔕</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>
              No notifications yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
              When a friend invites you to a room, you'll see it here.
            </p>
          </div>
        ) : (
          sorted.map(notif => {
            const cfg = typeConfig[notif.type] || typeConfig.default;
            return (
              <button
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  background: notif.read ? 'var(--bg-elevated)' : 'rgba(124,58,237,0.08)',
                  border: `1px solid ${notif.read ? 'var(--border)' : 'var(--border-accent)'}`,
                  borderRadius: '14px', padding: '14px 16px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                  background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                }}>
                  {cfg.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {!notif.read && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--accent-violet)', flexShrink: 0,
                      }} />
                    )}
                  </div>

                  {notif.type === 'room_invite' && (
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <strong>{notif.from}</strong> invited you to room{' '}
                      <span style={{ color: 'var(--accent-purple)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        {notif.roomCode}
                      </span>
                    </p>
                  )}

                  {notif.type === 'friend_added' && (
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <strong>{notif.from}</strong> added you as a friend!
                    </p>
                  )}

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                    {timeAgo(notif.createdAt)}
                    {notif.type === 'room_invite' && !notif.read && (
                      <span style={{ marginLeft: '8px', color: 'var(--accent-purple)', fontWeight: 600 }}>
                        Tap to join →
                      </span>
                    )}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

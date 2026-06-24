import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Button from './Button';
import Avatar from './Avatar';

export default function InvitePopup() {
  const invitePopup = useStore(s => s.invitePopup);
  const setInvitePopup = useStore(s => s.setInvitePopup);
  const markNotifRead = useStore(s => s.markNotifRead);
  const navigate = useNavigate();

  if (!invitePopup) return null;

  const { roomCode, from, notifId } = invitePopup;

  function accept() {
    setInvitePopup(null);
    if (notifId) markNotifRead(notifId);
    navigate(`/room/${roomCode}`);
  }

  function decline() {
    setInvitePopup(null);
    if (notifId) markNotifRead(notifId);
  }

  return (
    <div className="notif-popup" style={{ animation: 'pageIn 0.3s ease' }}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-accent)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--shadow-glow)',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar name={from} size={44} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {from} invited you! 🎉
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Room <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{roomCode}</span> is waiting
            </p>
          </div>
          <button
            onClick={decline}
            style={{ color: 'var(--text-muted)', padding: '4px', fontSize: '18px', lineHeight: 1 }}
          >×</button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={decline} style={{ flex: 1 }}>
            Ignore
          </Button>
          <Button variant="primary" size="sm" onClick={accept} style={{ flex: 2 }}>
            Join Room ✨
          </Button>
        </div>
      </div>
    </div>
  );
}

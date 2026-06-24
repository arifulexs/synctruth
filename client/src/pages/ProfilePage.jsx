import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

const AVATAR_EMOJIS = [
  '🦊','🐺','🐉','🦋','🌙','⚡','🔮','🎭','🌊','🦄',
  '🎸','🌸','🔥','💎','🌿','👾','🎪','🦅','🌈','✨',
  '🎯','🌺','🦁','🐬','🎪','🏔️','🌙','⭐','🎨','🎵',
];

function Section({ title, children }) {
  return (
    <div>
      <h3 style={{
        fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px',
      }}>{title}</h3>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser, token, logout, showToast, soundEnabled, toggleSound } = useStore();
  const navigate = useNavigate();

  const [editingAvatar, setEditingAvatar] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(user?.avatar || '🦊');
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [newQuestion, setNewQuestion] = useState('');
  const [addingQ, setAddingQ] = useState(false);
  const [showQForm, setShowQForm] = useState(false);

  async function saveAvatar() {
    setSavingAvatar(true);
    try {
      await api.auth.updateAvatar(selectedEmoji, token);
      const updatedUser = { ...user, avatar: selectedEmoji };
      localStorage.setItem('st_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditingAvatar(false);
      showToast('Avatar updated! ✨', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingAvatar(false);
    }
  }

  async function addCustomQuestion() {
    if (!newQuestion.trim() || newQuestion.trim().length < 5) {
      return showToast('Question must be at least 5 characters', 'error');
    }
    setAddingQ(true);
    try {
      const data = await api.rooms.addCustomQuestion(newQuestion.trim(), token);
      const updatedUser = {
        ...user,
        customQuestions: [data.question, ...(user.customQuestions || [])],
      };
      localStorage.setItem('st_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setNewQuestion('');
      setShowQForm(false);
      showToast('Question saved! 📝', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAddingQ(false);
    }
  }

  function handleLogout() {
    if (!confirm('Sign out of SyncTruth?')) return;
    logout();
    navigate('/auth');
  }

  return (
    <div className="page page-enter" style={{ padding: '52px 0 0' }}>
      {/* Profile header */}
      <div style={{
        padding: '28px 20px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="glow-orb pink" style={{ width: 180, height: 180, top: -60, right: -50, opacity: 0.1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={user?.username} src={user?.avatar} size={72} />
            <button
              onClick={() => setEditingAvatar(true)}
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--grad-primary)', border: '2px solid var(--bg-base)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', cursor: 'pointer',
              }}
            >✏️</button>
          </div>

          <div>
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
              {user?.username}
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="chip">
                👥 {user?.friends?.length || 0} friends
              </span>
              <span className="chip">
                📌 {user?.pinnedAnswers?.length || 0} pinned
              </span>
              <span className="chip">
                📝 {user?.customQuestions?.length || 0} questions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar picker modal */}
      {editingAvatar && (
        <div className="modal-backdrop" onClick={() => setEditingAvatar(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '6px' }}>
              Choose Avatar
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Pick an emoji that represents you
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
              {AVATAR_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setSelectedEmoji(e)}
                  style={{
                    fontSize: '30px', width: '52px', height: '52px',
                    borderRadius: '14px',
                    background: selectedEmoji === e ? 'rgba(124,58,237,0.25)' : 'var(--bg-glass)',
                    border: `2px solid ${selectedEmoji === e ? 'var(--accent-violet)' : 'var(--border)'}`,
                    transition: 'var(--spring)',
                    transform: selectedEmoji === e ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setEditingAvatar(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button variant="primary" loading={savingAvatar} onClick={saveAvatar} style={{ flex: 2 }}>
                Save Avatar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Custom Questions */}
        <Section title="My Custom Questions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!showQForm ? (
              <button
                onClick={() => setShowQForm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'var(--bg-glass)', border: '1.5px dashed var(--border)',
                  borderRadius: '12px', padding: '14px 16px',
                  cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: '20px' }}>➕</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Add a custom question</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder="Ask something interesting… e.g. 'What song would play if your life were a movie?'"
                  rows={3}
                  maxLength={300}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={() => { setShowQForm(false); setNewQuestion(''); }} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" loading={addingQ} onClick={addCustomQuestion} style={{ flex: 2 }}>
                    Save Question
                  </Button>
                </div>
              </div>
            )}

            {(user?.customQuestions || []).slice(0, 10).map(q => (
              <div
                key={q.id}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '12px 14px',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>💬</span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>
                  {q.text}
                </p>
              </div>
            ))}

            {!user?.customQuestions?.length && !showQForm && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '4px 0' }}>
                No custom questions yet. Create ones to use in your rooms!
              </p>
            )}
          </div>
        </Section>

        {/* App Settings */}
        <Section title="Settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Sound */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{soundEnabled ? '🔊' : '🔇'}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>Sound Effects</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Plays on reveal, messages, etc.</p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                style={{
                  width: 44, height: 26, borderRadius: '99px',
                  background: soundEnabled ? 'var(--accent-violet)' : 'var(--bg-overlay)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.3s',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: soundEnabled ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', transition: 'left 0.3s',
                  display: 'block',
                }} />
              </button>
            </div>

            {/* Privacy note */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px' }}>Privacy</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Room data is deleted when everyone leaves. End-to-end encrypted answers.
                </p>
              </div>
            </div>

            {/* Memories link */}
            <button
              onClick={() => navigate('/memories')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                width: '100%', textAlign: 'left', transition: 'var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: '20px' }}>📌</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '14px' }}>Friendship Timeline</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {user?.pinnedAnswers?.length || 0} pinned rounds
                </p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>›</span>
            </button>
          </div>
        </Section>

        {/* Sign out */}
        <Button variant="danger" size="full" onClick={handleLogout}>
          Sign Out
        </Button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
          SyncTruth v1.0 • Made with 💜
        </p>
      </div>
    </div>
  );
}

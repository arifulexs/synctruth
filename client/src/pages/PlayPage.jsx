import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import Button from '../components/Button';
import Avatar from '../components/Avatar';

const CATEGORY_EMOJIS = {
  friendship: '🤝', deep: '🌊', fun: '🎲', preferences: '✨',
  wouldyourather: '⚡', hypothetical: '🔮', culture: '🌍',
  future: '🚀', relationship: '💛', adult: '🔞',
};

export default function PlayPage() {
  const { socket, user, token, showToast } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('join') ? 'join' : 'create');
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('friendship');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const inputRef = useRef();

  // Friend search for invite
  const [friendQuery, setFriendQuery] = useState('');
  const [friendResults, setFriendResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.rooms.categories().then(d => setCategories(d.categories || [])).catch(() => {});
    if (tab === 'join' && inputRef.current) inputRef.current.focus();
  }, [tab]);

  async function createRoom() {
    if (!socket) return showToast('Not connected. Please wait…', 'error');
    if (selectedCat === 'adult' && !adultConfirmed) {
      return showToast('Please confirm you are 18+ for adult content', 'error');
    }
    setLoading(true);
    socket.emit('room:create', { categoryId: selectedCat }, (res) => {
      setLoading(false);
      if (res?.error) return showToast(res.error, 'error');
      navigate(`/room/${res.room.code}`);
    });
  }

  async function joinRoom(code) {
    const c = (code || roomCode).trim().toUpperCase();
    if (!c || c.length < 4) return showToast('Enter a valid room code', 'error');
    if (!socket) return showToast('Not connected', 'error');
    setLoading(true);
    socket.emit('room:join', { code: c }, (res) => {
      setLoading(false);
      if (res?.error) return showToast(res.error, 'error');
      navigate(`/room/${c}`);
    });
  }

  function searchFriends(q) {
    setFriendQuery(q);
    if (!q || q.length < 2 || !socket) return setFriendResults([]);
    setSearching(true);
    socket.emit('friend:search', { query: q }, (res) => {
      setSearching(false);
      setFriendResults(res?.users || []);
    });
  }

  function addFriend(userId) {
    if (!socket) return;
    socket.emit('friend:add', { targetId: userId }, (res) => {
      if (res?.error) return showToast(res.error, 'error');
      showToast('Friend added! 🎉', 'success');
      setFriendResults(prev => prev.filter(u => u.id !== userId));
    });
  }

  return (
    <div className="page page-enter" style={{ padding: '52px 0 0' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
          🎮 Let's Play
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Create a room or join a friend's
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {['create', 'join', 'friends'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '14px 0', fontWeight: 600, fontSize: '14px',
              color: tab === t ? 'var(--accent-purple)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent-violet)' : 'transparent'}`,
              transition: 'var(--transition)',
              textTransform: 'capitalize',
            }}
          >
            {t === 'create' ? '✨ Create' : t === 'join' ? '🔑 Join' : '👥 Friends'}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* CREATE TAB */}
        {tab === 'create' && (
          <>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Choose a category
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', borderRadius: '14px',
                      background: selectedCat === cat.id
                        ? `rgba(124,58,237,0.15)` : 'var(--bg-elevated)',
                      border: `1.5px solid ${selectedCat === cat.id ? 'var(--accent-violet)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'var(--transition)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                      background: `${cat.color}20`, border: `1px solid ${cat.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px',
                    }}>
                      {cat.emoji}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px' }}>{cat.name}</span>
                        {cat.ageRestricted && (
                          <span style={{
                            fontSize: '10px', padding: '2px 6px', borderRadius: '99px',
                            background: 'rgba(239,68,68,0.15)', color: '#EF4444',
                            border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700,
                          }}>18+</span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cat.description}</span>
                    </div>
                    {selectedCat === cat.id && (
                      <span style={{ color: 'var(--accent-violet)', fontSize: '20px', flexShrink: 0 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedCat === 'adult' && !adultConfirmed && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '12px', padding: '14px 16px',
              }}>
                <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '10px', fontWeight: 500 }}>
                  ⚠️ Adult category contains mature content. Confirm you're 18+.
                </p>
                <Button size="sm" variant="danger" onClick={() => setAdultConfirmed(true)}>
                  I am 18+ — Confirm
                </Button>
              </div>
            )}

            <Button variant="primary" size="full" loading={loading} onClick={createRoom}>
              ✨ Create Room
            </Button>
          </>
        )}

        {/* JOIN TAB */}
        {tab === 'join' && (
          <>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 500 }}>
                Room Code
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g. XKQB7F"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
                maxLength={6}
                style={{
                  fontSize: '28px', fontFamily: 'var(--font-display)',
                  textAlign: 'center', letterSpacing: '0.15em',
                  height: '72px', fontWeight: 700,
                }}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <Button variant="primary" size="full" loading={loading} onClick={() => joinRoom()}>
              🔑 Join Room
            </Button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Or ask your friend to invite you from their room 👆
              </p>
            </div>
          </>
        )}

        {/* FRIENDS TAB */}
        {tab === 'friends' && (
          <>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 500 }}>
                Find Players
              </label>
              <input
                type="text"
                placeholder="Search by username…"
                value={friendQuery}
                onChange={e => searchFriends(e.target.value)}
              />
            </div>

            {searching && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <div className="loader"><span/><span/><span/></div>
              </div>
            )}

            {friendResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {friendResults.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '12px 14px',
                  }}>
                    <Avatar name={u.username} size={40} online={u.online} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '15px' }}>{u.username}</p>
                      <p style={{ fontSize: '12px', color: u.online ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {u.online ? '● Online' : '○ Offline'}
                      </p>
                    </div>
                    {user?.friends?.includes(u.id) ? (
                      <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>✓ Friends</span>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => addFriend(u.id)}>
                        + Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {friendQuery.length >= 2 && !searching && friendResults.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '24px 0' }}>
                No users found for "{friendQuery}"
              </p>
            )}

            {/* Friends list */}
            {user?.friends?.length > 0 && !friendQuery && (
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Your Friends
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {user.friends.length} friend{user.friends.length !== 1 ? 's' : ''} added
                </p>
              </div>
            )}

            {!user?.friends?.length && !friendQuery && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Search for friends by username to get started!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

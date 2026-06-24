import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import { playSound } from '../hooks/useSocket';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

const REACTION_EMOJIS = ['❤️','😂','😮','🔥','👀','💯','🤔','😭'];

// ─── Sub-components ──────────────────────────────────────────

function WaitingPhase({ room, user, socket, onLeave }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useStore();

  function copyCode() {
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => showToast('Code: ' + room.code, 'info'));
  }

  function inviteFriend() {
    const link = `${window.location.origin}/room/${room.code}`;
    if (navigator.share) {
      navigator.share({ title: 'Join me on SyncTruth!', text: `Use code ${room.code}`, url: link });
    } else {
      navigator.clipboard.writeText(link).then(() => showToast('Invite link copied!', 'success'));
    }
  }

  const players = room.players || [];
  const isHost = room.creatorId === user?.id;

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ position: 'relative' }}>
        <div className="glow-orb violet" style={{ width: 200, height: 200, top: -60, left: -80, opacity: 0.15 }} />
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>🔮</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '6px' }}>
          Waiting for your friend…
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Share the code below to invite them
        </p>
      </div>

      {/* Room code */}
      <button
        onClick={copyCode}
        style={{
          background: 'var(--grad-card)', border: '2px solid var(--border-accent)',
          borderRadius: '20px', padding: '20px 36px', cursor: 'pointer',
          transition: 'var(--spring)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.12em', marginBottom: '4px' }}>
          ROOM CODE
        </p>
        <p style={{
          fontSize: '40px', fontFamily: 'var(--font-display)', fontWeight: 800,
          letterSpacing: '0.15em', background: 'var(--grad-primary)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {room.code}
        </p>
        <p style={{ fontSize: '12px', color: copied ? 'var(--accent-green)' : 'var(--text-muted)', marginTop: '6px' }}>
          {copied ? '✓ Copied!' : 'Tap to copy'}
        </p>
      </button>

      {/* Players */}
      <div style={{ width: '100%' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Players ({players.length}/2)
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {players.map(pid => (
            <div key={pid} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '14px 18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              minWidth: '100px',
            }}>
              <Avatar name={room.playerNames?.[pid]} src={room.playerAvatars?.[pid]} size={48} online={true} />
              <p style={{ fontWeight: 600, fontSize: '14px' }}>{room.playerNames?.[pid]}</p>
              <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>● Ready</span>
            </div>
          ))}
          {players.length < 2 && (
            <div style={{
              background: 'var(--bg-elevated)', border: '2px dashed var(--border)',
              borderRadius: '14px', padding: '14px 18px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              minWidth: '100px', opacity: 0.5,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', border: '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
              }}>?</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Waiting…</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <Button variant="secondary" onClick={inviteFriend} style={{ flex: 1 }}>
          📤 Share Link
        </Button>
        <Button variant="ghost" onClick={onLeave} style={{ flex: 1, color: 'var(--accent-red)' }}>
          Leave
        </Button>
      </div>
    </div>
  );
}

function QuestionPhase({ room, user, socket, onSubmit, myAnswer, setMyAnswer }) {
  const [submitted, setSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef();
  const { showToast } = useStore();

  function handleSubmit() {
    if (!myAnswer.trim()) return showToast('Write something first!', 'error');
    if (submitted) return;
    setSubmitted(true);
    onSubmit(myAnswer);
    playSound('submit');
  }

  const otherPlayer = room.players?.find(p => p !== user?.id);
  const theyAnswered = room.answeredCount > (submitted ? 1 : 0);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 'calc(100dvh - 60px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '99px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
        }}>
          Round {room.roundNumber}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {room.categoryId}
        </span>
      </div>

      {/* Question card */}
      <div className="question-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
        <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.35, fontFamily: 'var(--font-display)', position: 'relative', zIndex: 1 }}>
          {room.currentQuestion?.text}
        </p>
      </div>

      {/* Player statuses */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {room.players?.map(pid => {
          const isMe = pid === user?.id;
          const hasAnswered = isMe ? submitted : !!room.answers?.[pid] || theyAnswered;
          return (
            <div key={pid} style={{
              flex: 1, background: hasAnswered ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
              border: `1px solid ${hasAnswered ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              borderRadius: '12px', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'var(--transition)',
            }}>
              <Avatar name={room.playerNames?.[pid]} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isMe ? 'You' : room.playerNames?.[pid]}
                </p>
                <p style={{ fontSize: '11px', color: hasAnswered ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                  {hasAnswered ? '✓ Answered' : '... Thinking'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer area */}
      {!submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={myAnswer}
              onChange={e => { setMyAnswer(e.target.value); setCharCount(e.target.value.length); }}
              placeholder="Type your answer… it stays hidden until both submit"
              rows={4}
              maxLength={500}
              style={{ paddingBottom: '28px', lineHeight: 1.5 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) handleSubmit();
              }}
            />
            <span style={{
              position: 'absolute', bottom: '8px', right: '12px',
              fontSize: '11px', color: charCount > 400 ? 'var(--accent-amber)' : 'var(--text-dim)',
            }}>
              {charCount}/500
            </span>
          </div>
          <Button variant="primary" size="full" onClick={handleSubmit}>
            🔒 Submit Answer
          </Button>
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            ⌘+Enter to submit quickly
          </p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(124,58,237,0.08)', border: '1px solid var(--border-accent)',
          borderRadius: '14px', padding: '20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
          <p style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>
            {theyAnswered ? 'Revealing answers…' : 'Waiting for the other player…'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Your answer is sealed
          </p>
          <div style={{ marginTop: '12px' }} className="loader">
            <span /><span /><span />
          </div>
        </div>
      )}
    </div>
  );
}

function RevealPhase({ room, user, onNextQuestion, onPinRound, isHost }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  const myId = user?.id;
  const theirId = room.players?.find(p => p !== myId);
  const myAnswer = room.answers?.[myId];
  const theirAnswer = room.answers?.[theirId];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Question */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Round {room.roundNumber}
        </p>
        <p style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
          {room.currentQuestion?.text}
        </p>
      </div>

      {/* Answers — card flip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[
          { pid: myId, label: 'You', answer: myAnswer, color: 'var(--accent-violet)', isMe: true },
          { pid: theirId, label: room.playerNames?.[theirId], answer: theirAnswer, color: '#EC4899', isMe: false },
        ].map(({ pid, label, answer, color, isMe }) => (
          <div
            key={pid}
            className="flip-card"
            style={{ height: 'auto', minHeight: '120px' }}
          >
            <div className={`flip-card-inner ${revealed ? 'flipped' : ''}`} style={{ minHeight: '120px' }}>
              {/* Front (hidden) */}
              <div className="flip-card-front" style={{
                background: 'var(--bg-elevated)', borderRadius: '16px',
                border: '1px solid var(--border)', minHeight: '120px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔒</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Revealing…</p>
                </div>
              </div>
              {/* Back (revealed) */}
              <div className="flip-card-back" style={{
                background: isMe ? 'rgba(124,58,237,0.08)' : 'rgba(236,72,153,0.08)',
                border: `1px solid ${isMe ? 'rgba(124,58,237,0.3)' : 'rgba(236,72,153,0.3)'}`,
                borderRadius: '16px', padding: '16px', minHeight: '120px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Avatar name={label} size={32} />
                  <p style={{ fontWeight: 700, fontSize: '14px', color }}>{label}</p>
                </div>
                <p style={{ fontSize: '16px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {answer || '(no answer)'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="secondary" size="sm" onClick={onPinRound} style={{ flex: 1 }}>
          📌 Pin This
        </Button>
        {isHost && (
          <Button variant="primary" size="sm" onClick={onNextQuestion} style={{ flex: 1 }}>
            Next Question →
          </Button>
        )}
        {!isHost && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: 'var(--text-muted)',
          }}>
            Waiting for host…
          </div>
        )}
      </div>

      {/* Chat hint */}
      <div style={{
        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '12px', padding: '12px 14px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--accent-green)' }}>
          💬 Chat is unlocking…
        </p>
      </div>
    </div>
  );
}

function ChatPhase({ room, user, socket, onNextQuestion, isHost }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const chatEndRef = useRef();
  const typingTimer = useRef();
  const { showToast } = useStore();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chat]);

  useEffect(() => {
    if (!socket) return;
    socket.on('typing:start', ({ userId }) => {
      if (userId !== user?.id) setTheirTyping(true);
    });
    socket.on('typing:stop', ({ userId }) => {
      if (userId !== user?.id) setTheirTyping(false);
    });
    return () => { socket.off('typing:start'); socket.off('typing:stop'); };
  }, [socket]);

  function handleTyping(e) {
    setMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing:start', { code: room.code });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing:stop', { code: room.code });
    }, 1500);
  }

  function sendMessage() {
    if (!message.trim()) return;
    socket?.emit('chat:message', { code: room.code, text: message.trim(), replyTo: replyTo?.id }, (res) => {
      if (res?.error) showToast(res.error, 'error');
    });
    setMessage('');
    setReplyTo(null);
    setIsTyping(false);
    clearTimeout(typingTimer.current);
    socket?.emit('typing:stop', { code: room.code });
    playSound('message');
  }

  function react(messageId, emoji) {
    socket?.emit('chat:react', { code: room.code, messageId, emoji });
  }

  function pinMessage(msg) {
    socket?.emit('chat:pin_message', { code: room.code, messageId: msg.id });
    showToast('Message pinned!', 'success');
  }

  const otherPlayerId = room.players?.find(p => p !== user?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 60px)' }}>
      {/* Question recap */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Round {room.roundNumber}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic' }}>
          "{room.currentQuestion?.text}"
        </p>

        {/* Compact answer recap */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {[
            { pid: user?.id, color: 'var(--accent-violet)' },
            { pid: otherPlayerId, color: '#EC4899' },
          ].filter(x => x.pid).map(({ pid, color }) => (
            <div key={pid} style={{
              flex: 1, background: 'var(--bg-glass)', borderRadius: '8px',
              padding: '8px 10px', border: '1px solid var(--border)',
              borderLeft: `3px solid ${color}`,
            }}>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                {pid === user?.id ? 'You' : room.playerNames?.[pid]}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {room.answers?.[pid] || '…'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {room.chat?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <p>Chat is open! What do you think about each other's answers?</p>
          </div>
        )}

        {room.chat?.map(msg => {
          const isMe = msg.userId === user?.id;
          const replyMsg = msg.replyTo ? room.chat.find(m => m.id === msg.replyTo) : null;

          return (
            <div key={msg.id} className={`chat-message ${isMe ? 'mine' : ''}`}>
              {!isMe && <Avatar name={msg.username} src={msg.avatar} size={32} style={{ flexShrink: 0 }} />}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '78%', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {replyMsg && (
                  <div style={{
                    background: 'var(--bg-glass)', borderRadius: '8px', padding: '6px 10px',
                    borderLeft: '2px solid var(--accent-violet)',
                    fontSize: '11px', color: 'var(--text-muted)',
                    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    ↩ {replyMsg.text}
                  </div>
                )}

                <div
                  className={`chat-bubble ${isMe ? 'mine' : 'theirs'}`}
                  onDoubleClick={() => setReplyTo(msg)}
                  style={{ cursor: 'pointer', userSelect: 'text' }}
                >
                  {msg.text}
                </div>

                {/* Reactions */}
                {Object.keys(msg.reactions || {}).length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => react(msg.id, emoji)}
                        style={{
                          background: users.includes(user?.id) ? 'rgba(124,58,237,0.2)' : 'var(--bg-elevated)',
                          border: `1px solid ${users.includes(user?.id) ? 'var(--border-accent)' : 'var(--border)'}`,
                          borderRadius: '99px', padding: '2px 8px', fontSize: '13px',
                          display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                        }}
                      >
                        {emoji} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Emoji strip (hover-like on tap) */}
                <div style={{ display: 'flex', gap: '2px', opacity: 0.6 }}>
                  {REACTION_EMOJIS.slice(0, 4).map(e => (
                    <button key={e} onClick={() => react(msg.id, e)}
                      style={{ fontSize: '14px', padding: '2px 3px', borderRadius: '6px', background: 'none' }}
                    >{e}</button>
                  ))}
                  <button
                    onClick={() => setReplyTo(msg)}
                    style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '6px', background: 'none', color: 'var(--text-muted)' }}
                  >↩</button>
                  <button
                    onClick={() => pinMessage(msg)}
                    style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '6px', background: 'none', color: 'var(--text-muted)' }}
                  >📌</button>
                </div>
              </div>
            </div>
          );
        })}

        {theirTyping && (
          <div className="chat-message">
            <Avatar name={room.playerNames?.[otherPlayerId]} size={32} />
            <div className="chat-bubble theirs" style={{ padding: '10px 16px' }}>
              <div className="loader"><span/><span/><span/></div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Reply banner */}
      {replyTo && (
        <div style={{
          background: 'rgba(124,58,237,0.1)', borderTop: '1px solid var(--border-accent)',
          padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>
            ↩ Replying to: "{replyTo.text.slice(0, 60)}{replyTo.text.length > 60 ? '…' : ''}"
          </span>
          <button onClick={() => setReplyTo(null)} style={{ color: 'var(--text-muted)', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)', flexShrink: 0,
        display: 'flex', gap: '8px', alignItems: 'flex-end',
      }}>
        <textarea
          value={message}
          onChange={handleTyping}
          placeholder="Say something…"
          rows={1}
          style={{
            flex: 1, resize: 'none', maxHeight: '100px', lineHeight: 1.4, padding: '10px 14px',
            borderRadius: '22px', background: 'var(--bg-elevated)', fontSize: '15px',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: message.trim() ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'var(--spring)', fontSize: '20px',
          }}
        >
          {message.trim() ? '➤' : '•'}
        </button>
      </div>

      {/* Next question button */}
      {isHost && (
        <div style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom,0px))', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <Button variant="primary" size="full" onClick={onNextQuestion}>
            ✨ Next Question
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Room Page ───────────────────────────────────────────

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, token, socket, showToast } = useStore();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myAnswer, setMyAnswer] = useState('');
  const [error, setError] = useState('');

  // Join room on mount
  useEffect(() => {
    if (!socket || !code) return;

    socket.emit('room:join', { code: code.toUpperCase() }, (res) => {
      setLoading(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setRoom(res.room);
      playSound('join');
    });

    // Room events
    socket.on('room:ready', ({ playerNames }) => {
      setRoom(prev => prev ? { ...prev, playerNames } : prev);
      showToast('Both players are here! 🎉', 'success');
      playSound('join');
    });

    socket.on('room:player_joined', ({ userId, username, avatar }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.includes(userId) ? prev.players : [...prev.players, userId],
          playerNames: { ...prev.playerNames, [userId]: username },
          playerAvatars: { ...(prev.playerAvatars || {}), [userId]: avatar },
        };
      });
      showToast(`${username} joined! 🎉`, 'success');
      playSound('join');
    });

    socket.on('room:player_left', ({ userId, username }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const players = prev.players.filter(p => p !== userId);
        return { ...prev, players };
      });
      showToast(`${username} left the room`, 'info');
    });

    socket.on('room:player_disconnected', ({ username }) => {
      showToast(`${username} disconnected`, 'info');
    });

    socket.on('room:deleted', ({ message }) => {
      showToast(message, 'error');
      setTimeout(() => navigate('/'), 2000);
    });

    socket.on('question:new', ({ question, roundNumber, phase }) => {
      setRoom(prev => prev ? { ...prev, currentQuestion: question, roundNumber, phase, answers: {}, answeredCount: 0, chat: [] } : prev);
      setMyAnswer('');
    });

    socket.on('answer:submitted', ({ userId, username }) => {
      setRoom(prev => prev ? {
        ...prev,
        answers: { ...prev.answers, [userId]: '***' },
        answeredCount: (prev.answeredCount || 0) + 1,
      } : prev);
    });

    socket.on('answer:count', ({ answered, total }) => {
      setRoom(prev => prev ? { ...prev, answeredCount: answered } : prev);
    });

    socket.on('answers:reveal', ({ answers, playerNames, question, phase }) => {
      setRoom(prev => prev ? { ...prev, answers, phase, currentQuestion: question } : prev);
      playSound('reveal');
    });

    socket.on('chat:unlocked', ({ phase }) => {
      setRoom(prev => prev ? { ...prev, phase } : prev);
    });

    socket.on('chat:message', (msg) => {
      setRoom(prev => {
        if (!prev) return prev;
        // Avoid duplicates
        if (prev.chat?.find(m => m.id === msg.id)) return prev;
        return { ...prev, chat: [...(prev.chat || []), msg] };
      });
      if (msg.userId !== user?.id) playSound('message');
    });

    socket.on('chat:reactions_update', ({ messageId, reactions }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          chat: prev.chat.map(m => m.id === messageId ? { ...m, reactions } : m),
        };
      });
    });

    return () => {
      [
        'room:ready', 'room:player_joined', 'room:player_left', 'room:player_disconnected',
        'room:deleted', 'question:new', 'answer:submitted', 'answer:count',
        'answers:reveal', 'chat:unlocked', 'chat:message', 'chat:reactions_update',
      ].forEach(e => socket.off(e));
    };
  }, [socket, code]);

  function handleSubmitAnswer(answer) {
    socket?.emit('answer:submit', { code, answer }, (res) => {
      if (res?.error) showToast(res.error, 'error');
    });
  }

  function handleNextQuestion() {
    socket?.emit('question:next', { code }, (res) => {
      if (res?.error) showToast(res.error, 'error');
    });
  }

  async function handlePinRound() {
    if (!room?.currentQuestion) return;
    const myId = user?.id;
    const theirId = room.players?.find(p => p !== myId);
    try {
      await api.rooms.pin({
        question: room.currentQuestion.text,
        myAnswer: room.answers?.[myId],
        theirAnswer: room.answers?.[theirId],
        theirName: room.playerNames?.[theirId],
        categoryId: room.categoryId,
        roomCode: room.code,
      }, token);
      showToast('Round pinned to your timeline! 📌', 'success');
    } catch {
      showToast('Could not pin', 'error');
    }
  }

  function handleLeave() {
    socket?.emit('room:leave', { code });
    navigate('/');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div className="loader"><span/><span/><span/></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Joining room…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px' }}>😬</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>Can't join room</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <Button variant="primary" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const isHost = room?.creatorId === user?.id;
  const phase = room?.phase || 'waiting';

  // Room Header
  const header = (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px',
      borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
      position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
    }}>
      <button onClick={handleLeave} style={{ color: 'var(--text-secondary)', padding: '4px 8px', marginRight: '8px', fontSize: '22px' }}>
        ‹
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '15px' }}>Room {room?.code}</p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {room?.players?.map(p => room.playerNames?.[p]).filter(Boolean).join(' vs ')}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '99px', border: '1px solid var(--border)' }}>
          {room?.categoryId}
        </span>
        {isHost && (
          <button
            onClick={() => { if (confirm('Delete this room?')) { socket?.emit('room:delete', { code }); navigate('/'); } }}
            style={{ color: 'var(--text-muted)', padding: '6px', fontSize: '16px' }}
          >🗑</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {header}

      <div style={{ flex: 1, overflowY: phase === 'chat' ? 'hidden' : 'auto' }}>
        {phase === 'waiting' && (
          <WaitingPhase room={room} user={user} socket={socket} onLeave={handleLeave} />
        )}
        {phase === 'question' && (
          <QuestionPhase
            room={room} user={user} socket={socket}
            onSubmit={handleSubmitAnswer}
            myAnswer={myAnswer} setMyAnswer={setMyAnswer}
          />
        )}
        {phase === 'revealed' && (
          <RevealPhase
            room={room} user={user}
            onNextQuestion={handleNextQuestion}
            onPinRound={handlePinRound}
            isHost={isHost}
          />
        )}
        {phase === 'chat' && (
          <ChatPhase
            room={room} user={user} socket={socket}
            onNextQuestion={handleNextQuestion}
            isHost={isHost}
          />
        )}
      </div>

      {/* Host controls: Start first question */}
      {phase === 'waiting' && isHost && room?.players?.length === 2 && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <Button variant="primary" size="full" onClick={handleNextQuestion}>
            🚀 Start Game
          </Button>
        </div>
      )}
    </div>
  );
}

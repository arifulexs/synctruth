import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store/useStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function useSocket() {
  const { token, setSocket, setConnected, setNotifications, setInvitePopup, showToast, addNotification } = useStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    // Notifications
    socket.on('notifications:update', (notifs) => {
      setNotifications(notifs);
    });

    // Invite popup — friend invited us to a room
    socket.on('room:invite_popup', ({ roomCode, from, notifId }) => {
      setInvitePopup({ roomCode, from, notifId });
      addNotification({ id: notifId, type: 'room_invite', roomCode, from, createdAt: Date.now(), read: false });
      // Play sound
      playSound('invite');
    });

    socket.on('friend:added', (friend) => {
      showToast(`${friend.username} is now your friend! 🎉`, 'success');
    });

    return () => {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return socketRef.current;
}

// ── Sound Effects ──────────────────────────────────────────
const audioCache = {};

function createBeep(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playSound(type) {
  const { soundEnabled } = useStore.getState();
  if (!soundEnabled) return;

  try {
    switch (type) {
      case 'submit':
        createBeep(523, 0.1, 'sine', 0.15);
        setTimeout(() => createBeep(659, 0.1, 'sine', 0.15), 100);
        break;
      case 'reveal':
        createBeep(392, 0.1, 'sine', 0.2);
        setTimeout(() => createBeep(523, 0.1, 'sine', 0.2), 100);
        setTimeout(() => createBeep(659, 0.15, 'sine', 0.2), 200);
        setTimeout(() => createBeep(784, 0.2, 'sine', 0.25), 350);
        break;
      case 'message':
        createBeep(880, 0.06, 'sine', 0.1);
        break;
      case 'invite':
        createBeep(440, 0.1, 'sine', 0.2);
        setTimeout(() => createBeep(554, 0.1, 'sine', 0.2), 120);
        setTimeout(() => createBeep(659, 0.15, 'sine', 0.2), 240);
        break;
      case 'join':
        createBeep(523, 0.08, 'sine', 0.15);
        setTimeout(() => createBeep(784, 0.15, 'sine', 0.15), 100);
        break;
      case 'error':
        createBeep(220, 0.15, 'sawtooth', 0.1);
        break;
    }
  } catch {}
}

import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────
  user: null,
  token: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsLoading: (v) => set({ isLoading: v }),

  logout: () => {
    localStorage.removeItem('st_token');
    localStorage.removeItem('st_user');
    set({ user: null, token: null, room: null, notifications: [] });
  },

  // ── Socket ────────────────────────────────────
  socket: null,
  connected: false,
  setSocket: (socket) => set({ socket }),
  setConnected: (v) => set({ connected: v }),

  // ── Room ──────────────────────────────────────
  room: null,
  setRoom: (room) => set({ room }),
  updateRoom: (patch) => set(s => ({ room: s.room ? { ...s.room, ...patch } : null })),

  // ── Notifications ─────────────────────────────
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notif) => set(s => ({ notifications: [notif, ...s.notifications] })),
  markNotifRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  clearNotifications: () => set({ notifications: [] }),

  // ── Sound ─────────────────────────────────────
  soundEnabled: true,
  toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),

  // ── Toast ─────────────────────────────────────
  toasts: [],
  showToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // ── Invite Popup ──────────────────────────────
  invitePopup: null,
  setInvitePopup: (popup) => set({ invitePopup: popup }),
}));

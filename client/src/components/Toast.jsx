import React from 'react';
import { useStore } from '../store/useStore';

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);
  const removeToast = useStore(s => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onClick={() => removeToast(t.id)}
          style={{ animation: 'pageIn 0.25s ease' }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

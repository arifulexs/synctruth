import React from 'react';

const GRADIENTS = [
  'linear-gradient(135deg, #7C3AED, #EC4899)',
  'linear-gradient(135deg, #06B6D4, #7C3AED)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
  'linear-gradient(135deg, #EC4899, #F59E0B)',
  'linear-gradient(135deg, #8B5CF6, #06B6D4)',
];

function getGradient(name = '') {
  const idx = name.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx] || GRADIENTS[0];
}

export default function Avatar({ src, name = '', size = 40, online, style }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  const gradient = getGradient(name);
  const fontSize = Math.max(10, size * 0.38);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}>
      <div
        className="avatar"
        style={{
          width: size, height: size,
          background: src ? undefined : gradient,
          fontSize: `${fontSize}px`,
          color: 'white',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {src ? (
          <img
            src={src} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : initials}
      </div>
      {online !== undefined && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28,
          borderRadius: '50%',
          background: online ? 'var(--accent-green)' : 'var(--text-dim)',
          border: '2px solid var(--bg-base)',
        }} />
      )}
    </div>
  );
}

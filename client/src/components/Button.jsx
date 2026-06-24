import React from 'react';

const styles = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', borderRadius: '12px', fontWeight: 600,
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer',
    whiteSpace: 'nowrap', userSelect: 'none',
  },
  primary: {
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
  },
  secondary: {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
    border: '1px solid rgba(239,68,68,0.3)',
  },
  success: {
    background: 'rgba(16,185,129,0.15)',
    color: '#10B981',
    border: '1px solid rgba(16,185,129,0.3)',
  },
  sizes: {
    sm: { padding: '8px 16px', fontSize: '13px', height: '34px', borderRadius: '8px' },
    md: { padding: '12px 22px', fontSize: '15px', height: '44px' },
    lg: { padding: '14px 28px', fontSize: '16px', height: '52px', borderRadius: '14px' },
    full: { padding: '14px 28px', fontSize: '16px', height: '52px', width: '100%', borderRadius: '14px' },
    icon: { padding: '10px', width: '40px', height: '40px', borderRadius: '10px' },
  },
};

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled, loading, onClick, className, style, type = 'button',
  ...props
}) {
  const [pressed, setPressed] = React.useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles.base,
        ...styles[variant],
        ...styles.sizes[size],
        opacity: (disabled || loading) ? 0.5 : 1,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        ...style,
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      {...props}
    >
      {loading ? (
        <span className="loader">
          <span /><span /><span />
        </span>
      ) : children}
    </button>
  );
}

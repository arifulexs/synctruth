import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import Button from '../components/Button';
import Avatar from '../components/Avatar';

const CAT_COLORS = {
  friendship: '#6C63FF', deep: '#0EA5E9', fun: '#F59E0B',
  preferences: '#EC4899', wouldyourather: '#8B5CF6',
  hypothetical: '#10B981', culture: '#F97316',
  future: '#3B82F6', relationship: '#EAB308', adult: '#EF4444',
};

function timeStr(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MemoryCardView({ pin, onClose }) {
  const canvasRef = useRef();
  const { user } = useStore();

  async function exportCard() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 560;
      const ctx = canvas.getContext('2d');

      // Background
      const grad = ctx.createLinearGradient(0, 0, 800, 560);
      grad.addColorStop(0, '#0D0D18');
      grad.addColorStop(1, '#1A1A2E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 560);

      // Accent bar
      const accent = ctx.createLinearGradient(0, 0, 800, 0);
      accent.addColorStop(0, '#7C3AED');
      accent.addColorStop(1, '#EC4899');
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 800, 4);

      // Logo
      ctx.fillStyle = '#A09DC0';
      ctx.font = '600 14px sans-serif';
      ctx.fillText('SyncTruth', 40, 36);

      ctx.fillStyle = '#3D3B5C';
      ctx.font = '13px sans-serif';
      ctx.fillText(timeStr(pin.pinnedAt), 640, 36);

      // Question
      ctx.fillStyle = '#F1F0FF';
      ctx.font = `700 22px sans-serif`;
      const maxWidth = 720;
      const qText = pin.question;

      // Word-wrap question
      const words = qText.split(' ');
      let line = '';
      let y = 90;
      for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line.trim(), 40, y);
          line = word + ' ';
          y += 32;
        } else line = test;
      }
      ctx.fillText(line.trim(), 40, y);

      // Divider
      ctx.strokeStyle = '#2D2B47';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, y + 24); ctx.lineTo(760, y + 24); ctx.stroke();

      const answerTop = y + 52;

      // My answer
      ctx.fillStyle = 'rgba(124,58,237,0.15)';
      roundRect(ctx, 40, answerTop, 352, 160, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(124,58,237,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#A09DC0';
      ctx.font = '600 12px sans-serif';
      ctx.fillText(user?.username || 'You', 60, answerTop + 24);
      ctx.fillStyle = '#F1F0FF';
      ctx.font = '15px sans-serif';
      wrapText(ctx, pin.myAnswer || '(no answer)', 60, answerTop + 48, 312, 22);

      // Their answer
      ctx.fillStyle = 'rgba(236,72,153,0.15)';
      roundRect(ctx, 408, answerTop, 352, 160, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(236,72,153,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#A09DC0';
      ctx.font = '600 12px sans-serif';
      ctx.fillText(pin.theirName || 'Friend', 428, answerTop + 24);
      ctx.fillStyle = '#F1F0FF';
      ctx.font = '15px sans-serif';
      wrapText(ctx, pin.theirAnswer || '(no answer)', 428, answerTop + 48, 312, 22);

      // Footer
      ctx.fillStyle = '#3D3B5C';
      ctx.font = '12px sans-serif';
      ctx.fillText('synctruth.app', 40, 530);
      ctx.fillText(`#${pin.categoryId}`, 680, 530);

      // Download
      const link = document.createElement('a');
      link.download = `synctruth-memory-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = (text || '').split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineH;
        if (cy > y + 100) { ctx.fillText('…', x, cy); break; }
      } else line = test;
    }
    if (line) ctx.fillText(line.trim(), x, cy);
  }

  const catColor = CAT_COLORS[pin.categoryId] || '#7C3AED';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Memory card preview */}
        <div style={{
          background: 'linear-gradient(135deg, #0D0D18, #1A1A2E)',
          borderRadius: '16px', padding: '24px', marginBottom: '20px',
          border: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
        }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SYNCTRUTH</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{timeStr(pin.pinnedAt)}</span>
          </div>

          <p style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.35, marginBottom: '20px', color: 'var(--text-primary)' }}>
            {pin.question}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'You', answer: pin.myAnswer, color: '#7C3AED' },
              { label: pin.theirName, answer: pin.theirAnswer, color: '#EC4899' },
            ].map(({ label, answer, color }) => (
              <div key={label} style={{
                background: `${color}15`, border: `1px solid ${color}35`,
                borderRadius: '10px', padding: '12px',
              }}>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{answer || '(no answer)'}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', color, background: `${catColor}20`,
              border: `1px solid ${catColor}30`, padding: '3px 8px',
              borderRadius: '99px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              #{pin.categoryId}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>synctruth.app</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Close</Button>
          <Button variant="primary" onClick={exportCard} style={{ flex: 2 }}>
            📥 Export as Image
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MemoriesPage() {
  const { user, token } = useStore();
  const navigate = useNavigate();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.rooms.pins(token)
      .then(d => setPins(d.pins || []))
      .catch(() => setPins(user?.pinnedAnswers || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(pins.map(p => p.categoryId).filter(Boolean))];

  const filtered = filter === 'all' ? pins : pins.filter(p => p.categoryId === filter);

  return (
    <div className="page page-enter" style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="glow-orb pink" style={{ width: 200, height: 200, top: -80, right: -60, opacity: 0.1 }} />
        <button onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)', marginBottom: '12px', display: 'block', fontSize: '14px' }}>
          ← Back
        </button>
        <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-display)', marginBottom: '4px', position: 'relative', zIndex: 1 }}>
          📌 Friendship Timeline
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', position: 'relative', zIndex: 1 }}>
          {pins.length} pinned round{pins.length !== 1 ? 's' : ''} with your friends
        </p>
      </div>

      {/* Category filter */}
      {pins.length > 0 && (
        <div style={{ padding: '16px 20px 0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`category-pill ${filter === cat ? 'selected' : ''}`}
              >
                {cat === 'all' ? '✨ All' : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div className="loader"><span/><span/><span/></div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>📭</div>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {pins.length === 0 ? 'No pinned rounds yet' : 'Nothing in this category'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              {pins.length === 0
                ? 'Pin a round during a game to save it here. The 📌 button appears after answers are revealed.'
                : 'Try selecting a different category filter.'}
            </p>
          </div>
        ) : (
          filtered.map(pin => {
            const catColor = CAT_COLORS[pin.categoryId] || '#7C3AED';
            return (
              <div
                key={pin.id}
                className="memory-card"
                onClick={() => setSelectedPin(pin)}
                style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.borderColor = 'var(--border-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: catColor,
                    background: `${catColor}18`, border: `1px solid ${catColor}30`,
                    padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {pin.categoryId}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{timeStr(pin.pinnedAt)}</span>
                </div>

                <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '14px', lineHeight: 1.4, fontFamily: 'var(--font-display)' }}>
                  {pin.question}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{
                    background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                    borderRadius: '10px', padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      You
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {pin.myAnswer || '(no answer)'}
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)',
                    borderRadius: '10px', padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {pin.theirName}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {pin.theirAnswer || '(no answer)'}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px', textAlign: 'right' }}>
                  Tap to view & export →
                </p>
              </div>
            );
          })
        )}
      </div>

      {selectedPin && <MemoryCardView pin={selectedPin} onClose={() => setSelectedPin(null)} />}
    </div>
  );
}

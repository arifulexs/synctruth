import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

function HomeIcon({ filled }) {
  return filled
    ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12L12 3l9 9M5 10v10h4v-6h6v6h4V10"/></svg>;
}

function GameIcon({ filled }) {
  return filled
    ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}

function BellIcon({ filled }) {
  return filled
    ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
}

function ProfileIcon({ filled }) {
  return filled
    ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

export default function BottomNav() {
  const location = useLocation();
  const notifications = useStore(s => s.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Hide on certain pages
  const hideOn = ['/room/', '/auth'];
  const shouldHide = hideOn.some(p => location.pathname.startsWith(p));
  if (shouldHide) return null;

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (<>
          <HomeIcon filled={isActive} />
          <span>Home</span>
        </>)}
      </NavLink>

      <NavLink to="/play" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (<>
          <GameIcon filled={isActive} />
          <span>Play</span>
        </>)}
      </NavLink>

      <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (<>
          <BellIcon filled={isActive} />
          <span>Alerts</span>
          {unreadCount > 0 && <span className="nav-notif-dot" />}
        </>)}
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (<>
          <ProfileIcon filled={isActive} />
          <span>Me</span>
        </>)}
      </NavLink>
    </nav>
  );
}

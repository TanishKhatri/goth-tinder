import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Heart, MessageSquare, User, Settings, LogOut } from 'lucide-react';
import './Layout.css';

function Navigation() {
  const { logout } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();

  const navItems = [
    { path: '/discover', label: 'Discover', icon: Heart },
    { path: '/matches', label: 'Matches', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="main-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-brand">
        <NavLink to="/discover" className="brand-link" aria-label="Nocturne Home">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a5 5 0 0 1 5 5c0 5-5 10-5 10S7 12 7 7a5 5 0 0 1 5-5z"/>
              <path d="M12 2v20M12 2l6 6M12 2l-6 6"/>
            </svg>
          </span>
          <span className="brand-text">Nocturne</span>
        </NavLink>
      </div>
      
      <ul className="nav-list" role="menubar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <li key={item.path} role="none">
              <NavLink
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-icon" aria-hidden="true"><Icon size={20} /></span>
                <span className="nav-label">{item.label}</span>
                {isActive && <span className="nav-indicator" aria-hidden="true" />}
              </NavLink>
            </li>
          );
        })}
      </ul>
      
      <div className="nav-user">
        <div className="connection-status" aria-label={connected ? 'Connected' : 'Disconnected'}>
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} aria-hidden="true" />
        </div>
        <button className="btn btn-ghost btn-icon" onClick={logout} aria-label="Log out">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}

export default function Layout() {
  return (
    <div className="layout">
      <Navigation />
      <main className="main-content" role="main">
        <Outlet />
      </main>
    </div>
  );
}
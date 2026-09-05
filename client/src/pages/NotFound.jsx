import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-bg" aria-hidden="true">
        <div className="notfound-orb"></div>
      </div>
      <div className="notfound-container">
        <div className="notfound-content card filgrees">
          <div className="notfound-icon" aria-hidden="true">
            <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="30" cy="30" r="25" strokeDasharray="157" strokeDashoffset="157" style={{ animation: 'dash 2s ease-in-out infinite' }}>
                <animate attributeName="stroke-dashoffset" from="157" to="0" dur="2s" repeatCount="indefinite" />
                <animate attributeName="stroke-dasharray" from="0, 157" to="157, 0" dur="2s" repeatCount="indefinite" />
              </circle>
              <path d="M30 20v10M30 35v.01" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="notfound-code">404</h1>
          <h2 className="notfound-title">Path Lost in Shadows</h2>
          <p className="notfound-desc">
            The veil parts but reveals nothing. This path has faded into the mist.
          </p>
          <div className="notfound-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={18} aria-hidden="true" />
              <span>Return to Nocturne</span>
            </Link>
            <Link to="/discover" className="btn btn-secondary">
              <Search size={18} aria-hidden="true" />
              <span>Seek Again</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
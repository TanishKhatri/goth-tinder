import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, formatTime } from '../utils/api';
import { MessageSquare, X, Shield, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Matches.css';

export default function Matches() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  const fetchMatches = async () => {
    try {
      const data = await api.matches.list();
      setMatches(data.matches);
    } catch (err) {
      showToast('Failed to load matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [showToast]);

  const handleUnmatch = async (matchId, match) => {
    setActionMenu(null);
    setExpanding(matchId);
    try {
      await api.matches.unmatch(matchId);
      setMatches(prev => prev.filter(m => m._id !== matchId));
      showToast(`Unmatched from ${match.otherUser?.firstName}`, 'success');
      await refreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExpanding(null);
    }
  };

  const handleBlock = async (matchId, match) => {
    setActionMenu(null);
    setExpanding(matchId);
    try {
      await api.reports.create({ reportedId: match.otherUser._id, type: 'block' });
      setMatches(prev => prev.filter(m => m._id !== matchId));
      showToast(`Blocked ${match.otherUser?.firstName}`, 'success');
      await refreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExpanding(null);
    }
  };

  const handleReport = async (matchId, match) => {
    setActionMenu(null);
    const reason = prompt('Reason for reporting (optional):');
    if (reason === null) return;
    
    setExpanding(matchId);
    try {
      await api.reports.create({ reportedId: match.otherUser._id, type: 'report', reason });
      showToast('Report submitted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExpanding(null);
    }
  };

  const formatLastMessage = (msg) => {
    if (!msg) return 'Start a conversation';
    const preview = msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content;
    const isOwn = msg.senderId?.toString() === user?._id?.toString();
    return `${isOwn ? 'You: ' : ''}${preview}`;
  };

  const formatMatchTime = (date) => {
    if (!date) return '';
    return formatTime(date);
  };

  if (loading) {
    return (
      <div className="matches-page">
        <header className="page-header">
          <h1>Matches</h1>
          <p className="page-subtitle">Your connections in the dark</p>
        </header>
        <div className="matches-loading">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-match card">
              <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
              <div className="skeleton-match-content">
                <div className="skeleton" style={{ width: '40%', height: '20px', borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton" style={{ width: '70%', height: '14px', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <header className="page-header">
        <h1>Matches</h1>
        <p className="page-subtitle">{matches.length} connection{matches.length !== 1 ? 's' : ''} in the dark</p>
      </header>

      {matches.length === 0 ? (
        <div className="matches-empty card filgrees">
          <MessageSquare size={64} className="empty-icon" aria-hidden="true" />
          <h2>No Matches Yet</h2>
          <p>Keep swiping to find your kindred spirit. When the connection is mutual, they'll appear here.</p>
          <Link to="/discover" className="btn btn-primary">
            <MessageSquare size={18} aria-hidden="true" />
            <span>Discover Profiles</span>
          </Link>
        </div>
      ) : (
        <div className="matches-list" role="list" aria-label="Your matches">
          <AnimatePresence>
            {matches.map(match => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`match-item card ${expanding === match._id ? 'expanding' : ''}`}
                role="listitem"
              >
                <Link to={`/matches/${match._id}`} className="match-link" aria-label={`Chat with ${match.otherUser?.firstName}`}>
                  <div className="match-avatar">
                    <img 
                      src={match.otherUser?.photos?.[0] || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${match.otherUser?.firstName}&backgroundColor=0a0a0d,1a1a2e,16213e`} 
                      alt={match.otherUser?.firstName}
                      loading="lazy"
                    />
                    {match.otherUser?.isBlocked && (
                      <span className="blocked-badge" aria-label="Blocked">
                        <Shield size={14} />
                      </span>
                    )}
                  </div>
                  <div className="match-content">
                    <div className="match-header">
                      <h3 className="match-name">{match.otherUser?.firstName}</h3>
                      <time className="match-time" dateTime={match.lastMessage?.sentAt || match.matchedAt}>
                        {formatMatchTime(match.lastMessage?.sentAt || match.matchedAt)}
                      </time>
                    </div>
                    <div className="match-preview">
                      <p className="match-last-message">{formatLastMessage(match.lastMessage)}</p>
                      {match.unreadCount > 0 && (
                        <span className="unread-badge" aria-label={`${match.unreadCount} unread messages`}>
                          {match.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                
                <div className="match-actions">
                  <button
                    className="btn btn-ghost btn-icon action-btn"
                    onClick={(e) => { e.stopPropagation(); setActionMenu(match._id); }}
                    aria-label={`Options for ${match.otherUser?.firstName}`}
                    aria-expanded={actionMenu === match._id}
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {actionMenu === match._id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="action-menu"
                      role="menu"
                    >
                      <button
                        role="menuitem"
                        className="action-menu-item"
                        onClick={() => handleUnmatch(match._id, match)}
                      >
                        <X size={16} aria-hidden="true" />
                        <span>Unmatch</span>
                      </button>
                      <button
                        role="menuitem"
                        className="action-menu-item danger"
                        onClick={() => handleBlock(match._id, match)}
                      >
                        <Shield size={16} aria-hidden="true" />
                        <span>Block</span>
                      </button>
                      <button
                        role="menuitem"
                        className="action-menu-item danger"
                        onClick={() => handleReport(match._id, match)}
                      >
                        <Shield size={16} aria-hidden="true" />
                        <span>Report</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
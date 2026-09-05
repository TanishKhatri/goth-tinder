import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { api, formatTime } from '../utils/api';
import { Send, X, Shield, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Chat.css';

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const {
    on, off,
    joinMatch, leaveMatch,
    sendMessage, sendTyping, sendStopTyping, sendReadReceipt
  } = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [partner, setPartner] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const userIdRef = useRef(user?._id);
  userIdRef.current = user?._id;

  const fetchData = useCallback(async () => {
    try {
      const [matchData, messagesData] = await Promise.all([
        api.matches.list(),
        api.matches.messages(matchId)
      ]);
      const currentMatch = matchData.matches.find(m => m._id === matchId);
      if (!currentMatch) {
        showToast('Match not found', 'error');
        navigate('/matches');
        return;
      }
      setPartner(currentMatch.otherUser);
      setMessages(messagesData.messages);
      sendReadReceipt(matchId);
    } catch (err) {
      showToast('Failed to load chat', 'error');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  }, [matchId, showToast, navigate, sendReadReceipt]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    joinMatch(matchId);

    const handleReceive = (msg) => {
      if (msg.matchId?.toString() === matchId) {
        setMessages(prev => {
          if (prev.some(m => m._id?.toString() === msg._id?.toString())) return prev;
          return [...prev, msg];
        });
        if (msg.senderId?.toString() !== userIdRef.current?.toString()) {
          sendReadReceipt(matchId);
        }
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId?.toString() !== userIdRef.current?.toString()) setPartnerTyping(true);
    };

    const handleStopTyping = ({ userId }) => {
      if (userId?.toString() !== userIdRef.current?.toString()) setPartnerTyping(false);
    };

    const handleRead = () => {
      setMessages(prev => prev.map(m =>
        m.senderId?.toString() === userIdRef.current?.toString() && !m.readAt
          ? { ...m, readAt: new Date().toString() }
          : m
      ));
    };

    const cleanups = [
      on('receive_message', handleReceive),
      on('user_typing', handleTyping),
      on('user_stop_typing', handleStopTyping),
      on('messages_read', handleRead)
    ];

    return () => {
      leaveMatch(matchId);
      cleanups.forEach(fn => fn && fn());
      off('receive_message', handleReceive);
      off('user_typing', handleTyping);
      off('user_stop_typing', handleStopTyping);
      off('messages_read', handleRead);
    };
  }, [matchId, joinMatch, leaveMatch, on, off, sendReadReceipt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    sendTyping(matchId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(matchId);
    }, 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;
    
    setSending(true);
    setNewMessage('');
    sendStopTyping(matchId);
    clearTimeout(typingTimeoutRef.current);
    
    try {
      sendMessage(matchId, content);
    } catch (err) {
      showToast('Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleUnmatch = async () => {
    if (!confirm('Unmatch? This cannot be undone.')) return;
    try {
      await api.matches.unmatch(matchId);
      showToast('Unmatched', 'success');
      navigate('/matches');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBlock = async () => {
    if (!confirm('Block this user? They will not be able to contact you.')) return;
    try {
      await api.reports.create({ reportedId: partner._id, type: 'block' });
      showToast('Blocked', 'success');
      navigate('/matches');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReport = async () => {
    const reason = prompt('Reason for reporting (optional):');
    if (reason === null) return;
    try {
      await api.reports.create({ reportedId: partner._id, type: 'report', reason });
      showToast('Report submitted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="chat-page">
        <header className="chat-header">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} aria-label="Back">
            <X size={22} />
          </button>
          <div className="chat-header-info">
            <div className="chat-avatar">
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            </div>
            <div>
              <div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }} />
            </div>
          </div>
        </header>
        <div className="chat-messages">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-message">
              <div className="skeleton" style={{ width: '60%', height: '40px', borderRadius: 'var(--radius-lg)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} aria-label="Back to matches">
          <X size={22} />
        </button>
        
        <Link to={`/profile/${partner._id}`} className="chat-header-info" aria-label={`View ${partner.firstName}'s profile`}>
          <div className="chat-avatar">
            <img 
              src={partner.photos?.[0] || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${partner.firstName}&backgroundColor=0a0a0d,1a1a2e,16213e`} 
              alt={partner.firstName}
            />
            <span className={`online-indicator ${partner.lastSeen && isOnline(partner.lastSeen) ? 'online' : ''}`} 
                  aria-label={isOnline(partner.lastSeen) ? 'Online' : 'Offline'} />
          </div>
          <div>
            <h2 className="chat-partner-name">{partner.firstName}</h2>
            <p className="chat-partner-status">
              {isOnline(partner.lastSeen) ? 'Online' : partner.lastSeen ? `Last seen ${formatTime(partner.lastSeen)}` : 'Offline'}
            </p>
          </div>
        </Link>
        
        <div className="chat-header-actions">
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Chat options"
            aria-expanded={showMenu}
          >
            <MoreVertical size={22} />
          </button>
          
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="chat-menu"
              role="menu"
            >
              <button role="menuitem" className="chat-menu-item" onClick={handleUnmatch}>
                <X size={16} aria-hidden="true" />
                <span>Unmatch</span>
              </button>
              <button role="menuitem" className="chat-menu-item danger" onClick={handleBlock}>
                <Shield size={16} aria-hidden="true" />
                <span>Block</span>
              </button>
              <button role="menuitem" className="chat-menu-item danger" onClick={handleReport}>
                <Shield size={16} aria-hidden="true" />
                <span>Report</span>
              </button>
            </motion.div>
          )}
        </div>
      </header>

      <div className="chat-messages" role="log" aria-label="Messages" aria-live="polite">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`message ${msg.senderId?.toString() === user?._id?.toString() ? 'own' : ''}`}
              role="article"
              aria-label={`${msg.senderId?.toString() === user?._id?.toString() ? 'You' : partner.firstName}: ${msg.content}`}
            >
              <div className="message-bubble">
                <p className="message-text">{msg.content}</p>
                <time className="message-time" dateTime={msg.sentAt}>
                  {formatTime(msg.sentAt)}
                  {msg.senderId?.toString() === user?._id?.toString() && (
                    <span className={`read-status ${msg.readAt ? 'read' : 'sent'}`} aria-label={msg.readAt ? 'Read' : 'Sent'}>
                      {msg.readAt ? '✓✓' : '✓'}
                    </span>
                  )}
                </time>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {partnerTyping && (
          <div className="typing-indicator" aria-live="polite">
            <span className="typing-dots" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span>{partner.firstName} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <div className="input-wrapper">
          <button type="button" className="btn btn-ghost btn-icon input-btn" aria-label="Attach file">
            <Paperclip size={20} />
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            maxLength={2000}
            disabled={sending}
            aria-label="Message"
          />
          <button 
            type="button" 
            className="btn btn-ghost btn-icon input-btn" 
            aria-label="Add emoji"
          >
            <Smile size={20} />
          </button>
        </div>
        <button 
          type="submit" 
          className="btn btn-primary btn-icon send-btn" 
          disabled={!newMessage.trim() || sending}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 5 * 60 * 1000;
}
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, calculateAge, formatDistance } from '../utils/api';
import TinderCard from 'react-tinder-card';
import { Heart, X, RotateCcw, User, MapPin } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import './Discover.css';

export default function Discover() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [showMatch, setShowMatch] = useState(null);
  const lastSwipeRef = useRef(null);

  const fetchCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.users.discover({ limit: 10 });
      if (data.users.length === 0) {
        setEmpty(true);
        setCards([]);
      } else {
        setEmpty(false);
        setCards(data.users.map(u => ({ ...u, id: u._id })));
      }
    } catch (err) {
      showToast('Failed to load profiles', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSwipe = async (direction, swipedUser) => {
    if (swiping) return;
    setSwiping(true);
    lastSwipeRef.current = { direction, swipedUser };
    
    try {
      const data = await api.swipes.create({ swipedId: swipedUser.id, direction });
      if (data.match) {
        setShowMatch(swipedUser);
        showToast('It\'s a match!', 'success');
      }
      await refreshUser();
    } catch (err) {
      showToast(err.message || 'Swipe failed', 'error');
      setCards(prev => [...prev, { ...swipedUser, id: swipedUser.id }]);
    } finally {
      setSwiping(false);
    }
  };

  const handleSwipeLeft = (swipedUser) => handleSwipe('pass', swipedUser);
  const handleSwipeRight = (swipedUser) => handleSwipe('like', swipedUser);

  const handleCardLeftScreen = (swipedUser) => {
    setCards(prev => {
      const next = prev.filter(c => c.id !== swipedUser.id);
      if (next.length <= 2) fetchCards();
      return next;
    });
  };

  const handleUndo = () => {
    if (lastSwipeRef.current) {
      const { direction, swipedUser } = lastSwipeRef.current;
      setCards(prev => [swipedUser, ...prev]);
      lastSwipeRef.current = null;
      showToast('Last swipe undone', 'success');
    }
  };

  const renderCard = (card, index) => (
    <ProfileCard
      key={card.id}
      user={card}
      index={index}
      total={cards.length}
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onLeftScreen={handleCardLeftScreen}
    />
  );

  return (
    <div className="discover-page">
      <header className="page-header">
        <h1>Discover</h1>
        <p className="page-subtitle">Seek your midnight companion</p>
      </header>

      {loading ? (
        <div className="discover-loading" aria-busy="true" aria-label="Loading profiles">
          <div className="skeleton-card card">
            <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
            <div className="skeleton-card-content">
              <div className="skeleton" style={{ width: '60%', height: '24px', borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '40%', height: '16px', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} />
              <div className="skeleton" style={{ width: '80%', height: '16px', borderRadius: 'var(--radius-sm)', marginTop: '1rem' }} />
              <div className="skeleton" style={{ width: '50%', height: '16px', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} />
            </div>
          </div>
        </div>
      ) : empty ? (
        <div className="discover-empty card filgrees" role="status">
          <div className="empty-icon" aria-hidden="true">
            <User size={64} />
          </div>
          <h2>No More Shadows Nearby</h2>
          <p>You've seen everyone in your realm. Expand your distance or check back when the moon rises again.</p>
          <button className="btn btn-primary" onClick={fetchCards}>
            <RotateCcw size={18} aria-hidden="true" />
            <span>Search Again</span>
          </button>
        </div>
      ) : (
        <>
          <div className="swipe-deck" role="list" aria-label="Profiles">
            <AnimatePresence>
              {cards.slice(0, 3).map((card, index) => renderCard(card, index))}
            </AnimatePresence>
          </div>

          <div className="swipe-controls" role="group" aria-label="Swipe actions">
            <button
              className="btn btn-icon btn-swipe btn-pass"
              onClick={() => cards[0] && handleSwipeLeft(cards[0])}
              disabled={swiping || cards.length === 0}
              aria-label="Pass"
              aria-pressed="false"
            >
              <X size={28} aria-hidden="true" />
            </button>
            <button
              className="btn btn-ghost btn-icon"
              onClick={handleUndo}
              disabled={!lastSwipeRef.current || swiping}
              aria-label="Undo last swipe"
            >
              <RotateCcw size={22} aria-hidden="true" />
            </button>
            <button
              className="btn btn-icon btn-swipe btn-like"
              onClick={() => cards[0] && handleSwipeRight(cards[0])}
              disabled={swiping || cards.length === 0}
              aria-label="Like"
              aria-pressed="false"
            >
              <Heart size={28} aria-hidden="true" />
            </button>
          </div>

          <div className="swipe-hints" aria-hidden="true">
            <span>← Pass</span>
            <span>Like →</span>
          </div>
        </>
      )}

      {showMatch && (
        <MatchModal
          user={showMatch}
          onClose={() => setShowMatch(null)}
        />
      )}
    </div>
  );
}

function ProfileCard({ user, index, total, onSwipeLeft, onSwipeRight, onLeftScreen }) {
  const age = calculateAge(user.birthdate);
  const distance = formatDistance(user.distance);
  const photos = user.photos?.length ? user.photos : [`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${user.firstName}&backgroundColor=0a0a0d,1a1a2e,16213e`];
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const swipe = (direction) => {
    if (direction === 'left') onSwipeLeft(user);
    else if (direction === 'right') onSwipeRight(user);
  };

  return (
    <TinderCard
      className="swipe-card"
      preventSwipe={['up', 'down']}
      onSwipe={(dir) => swipe(dir)}
      onCardLeftScreen={() => onLeftScreen(user)}
    >
      <div className="profile-card card filgrees" data-index={index}>
        <div className="card-photos">
          <div className="photo-carousel">
            {photos.map((photo, i) => (
              <div key={i} className={`photo-slide ${i === currentPhoto ? 'active' : ''}`}>
                <img src={photo} alt={`${user.firstName}'s photo ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
          {photos.length > 1 && (
            <div className="photo-dots" role="tablist" aria-label="Photos">
              {photos.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === currentPhoto}
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setCurrentPhoto(i)}
                  className={`photo-dot ${i === currentPhoto ? 'active' : ''}`}
                />
              ))}
            </div>
          )}
          <div className="photo-counter">{currentPhoto + 1} / {photos.length}</div>
        </div>

        <div className="card-info">
          <div className="card-header">
            <div>
              <h2 className="card-name">
                {user.firstName}, {age}
              </h2>
              {user.location?.city && (
                <div className="card-location">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{user.location.city} · {distance}</span>
                </div>
              )}
            </div>
            {user.interests?.length > 0 && (
              <div className="card-badges" aria-label="Interests">
                {user.interests.slice(0, 3).map(interest => (
                  <span key={interest} className="badge">{interest}</span>
                ))}
                {user.interests.length > 3 && (
                  <span className="badge badge-gold">+{user.interests.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {user.bio && (
            <p className="card-bio">{user.bio}</p>
          )}

          {user.interests?.length > 3 && (
            <div className="card-interests">
              {user.interests.slice(3).map(interest => (
                <span key={interest} className="badge badge-amethyst">{interest}</span>
              ))}
            </div>
          )}
        </div>

        <div className="swipe-indicators">
          <div className="swipe-indicator swipe-left">
            <X size={32} aria-hidden="true" />
            <span>PASS</span>
          </div>
          <div className="swipe-indicator swipe-right">
            <Heart size={32} aria-hidden="true" />
            <span>LIKE</span>
          </div>
        </div>
      </div>
    </TinderCard>
  );
}

function MatchModal({ user, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="match-title">
      <div className="modal match-modal filgrees" onClick={e => e.stopPropagation()}>
        <div className="match-content">
          <div className="match-icon pulse" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-blood)" strokeWidth="2.5">
              <path d="M12 2a5 5 0 0 1 5 5c0 5-5 10-5 10S7 12 7 7a5 5 0 0 1 5-5z"/>
              <path d="M12 2v20M12 2l6 6M12 2l-6 6"/>
            </svg>
          </div>
          <h2 id="match-title" className="glow-text">It's a Match!</h2>
          <p className="match-desc">You and <strong>{user.firstName}</strong> liked each other</p>
          
          <div className="match-users">
            <div className="match-user">
              <img src={user.photos?.[0] || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${user.firstName}&backgroundColor=0a0a0d,1a1a2e,16213e`} alt={user.firstName} />
              <span>{user.firstName}</span>
            </div>
            <span className="match-arrow" aria-hidden="true">↔</span>
            <div className="match-user">
              <span>You</span>
            </div>
          </div>
          
          <div className="match-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Keep Swiping
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Start Chatting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
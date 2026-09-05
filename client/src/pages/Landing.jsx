import { Link } from 'react-router-dom';
import { Heart, Moon, MessageSquare, Flower2, Sparkles } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="particles" aria-hidden="true"></div>
      </div>
      
      <header className="landing-header">
        <div className="container">
          <div className="logo filgrees">
            <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2" className="logo-icon" aria-hidden="true">
              <path d="M30 5a15 15 0 0 1 15 15c0 15-15 30-15 30S15 35 15 20a15 15 0 0 1 15-15z"/>
              <path d="M30 5v50M30 5l20 20M30 5l-20 20"/>
            </svg>
            <span className="logo-text">Nocturne</span>
          </div>
        </div>
      </header>
      
      <main className="landing-main">
        <div className="container">
          <section className="hero filgrees" aria-labelledby="hero-title">
            <h1 id="hero-title" className="hero-title glow-text">
              Find Your <span className="accent">Midnight</span> Companion
            </h1>
            <p className="hero-subtitle">
              A gothic sanctuary for kindred spirits. Where shadows embrace 
              and dark hearts find their match.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                <span>Begin Your Journey</span>
                <Moon size={20} aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                <span>Return to the Night</span>
              </Link>
            </div>
            <div className="hero-stats" aria-label="Community statistics">
              <div className="stat">
                <span className="stat-value">13K+</span>
                <span className="stat-label">Night Walkers</span>
              </div>
              <div className="stat">
                <span className="stat-value">2.4K</span>
                <span className="stat-label">Matches Made</span>
              </div>
              <div className="stat">
                <span className="stat-value">∞</span>
                <span className="stat-label">Dark Conversations</span>
              </div>
            </div>
          </section>
          
          <section className="features" aria-labelledby="features-title">
            <h2 id="features-title" className="section-title">Embrace the Darkness</h2>
            <div className="features-grid">
              <article className="feature-card card filgrees">
                <div className="feature-icon" aria-hidden="true">
                  <Heart size={28} />
                </div>
                <h3 className="feature-title">Dark Matches</h3>
                <p className="feature-desc">
                  Swipe through profiles of those who share your aesthetic. 
                  Mutual interests in the macabre, the poetic, the eternal.
                </p>
              </article>
              
              <article className="feature-card card filgrees">
                <div className="feature-icon" aria-hidden="true">
                  <MessageSquare size={28} />
                </div>
                <h3 className="feature-title">Midnight Whispers</h3>
                <p className="feature-desc">
                  Real-time chat that feels like passing notes in a candlelit 
                  crypt. Messages persist through the ages.
                </p>
              </article>
              
              <article className="feature-card card filgrees">
                <div className="feature-icon" aria-hidden="true">
                  <Flower2 size={28} />
                </div>
                <h3 className="feature-title">Craft Your Persona</h3>
                <p className="feature-desc">
                  Express your dark soul through bios, interests, and photos. 
                  From Victorian goth to modern darkwave.
                </p>
              </article>
              
              <article className="feature-card card filgrees">
                <div className="feature-icon" aria-hidden="true">
                  <Sparkles size={28} />
                </div>
                <h3 className="feature-title">Safe Shadows</h3>
                <p className="feature-desc">
                  Block, report, and unmatch with ease. Your sanctuary 
                  remains yours — we protect the darkness within.
                </p>
              </article>
            </div>
          </section>
          
          <section className="cta filgrees" aria-labelledby="cta-title">
            <h2 id="cta-title" className="cta-title">The Night Awaits</h2>
            <p className="cta-desc">
              Step into the shadows. Your kindred spirit is waiting in the gloom.
            </p>
            <Link to="/signup" className="btn btn-primary btn-large">
              <span>Enter the Nocturne</span>
              <Moon size={20} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </main>
      
      <footer className="landing-footer">
        <div className="container">
          <p className="copyright">
            © 2024 Nocturne. Crafted for creatures of the night.
          </p>
          <div className="footer-links">
            <a href="#" aria-label="Privacy Policy">Privacy</a>
            <a href="#" aria-label="Terms of Service">Terms</a>
            <a href="#" aria-label="Safety Guidelines">Safety</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
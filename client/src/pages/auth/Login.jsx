import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Moon, Eye, EyeOff } from 'lucide-react';
import './AuthForms.css';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      await login(formData.email, formData.password);
      showToast('Welcome back to the night.', 'success');
      navigate('/discover');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-orb"></div>
      </div>
      <div className="auth-container">
        <div className="auth-card card filgrees">
          <div className="auth-header">
            <Link to="/" className="auth-logo" aria-label="Nocturne Home">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2a5 5 0 0 1 5 5c0 5-5 10-5 10S7 12 7 7a5 5 0 0 1 5-5z"/>
                <path d="M12 2v20M12 2l6 6M12 2l-6 6"/>
              </svg>
              <span>Nocturne</span>
            </Link>
          </div>
          
          <h1 className="auth-title">Return to the Night</h1>
          <p className="auth-subtitle">Your shadows await your presence</p>
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="raven@midnight.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && <p id="email-error" className="error-message" role="alert">{errors.email}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="error-message" role="alert">{errors.password}</p>}
            </div>
            
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" name="remember" />
                <span className="checkbox-custom" aria-hidden="true"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgotten the path?</Link>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Entering...</span>
                </>
              ) : (
                <>
                  <span>Enter Nocturne</span>
                  <Moon size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
          
          <div className="divider">
            <span className="divider-text">or</span>
          </div>
          
          <p className="auth-footer">
            New to the shadows? <Link to="/signup">Create your persona</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
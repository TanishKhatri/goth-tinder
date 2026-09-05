import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Moon, Eye, EyeOff, ChevronRight } from 'lucide-react';
import './AuthForms.css';

const GENDERS = ['man', 'woman', 'nonbinary'];

export default function Signup() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    birthdate: '',
    gender: '',
    interestedIn: []
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'At least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.firstName.trim()) newErrors.firstName = 'Name is required';
      if (!formData.birthdate) newErrors.birthdate = 'Birthdate is required';
      else {
        const age = new Date().getFullYear() - new Date(formData.birthdate).getFullYear();
        if (age < 18) newErrors.birthdate = 'Must be 18 or older';
      }
    } else if (step === 2) {
      if (!formData.gender) newErrors.gender = 'Select your gender';
      if (formData.interestedIn.length === 0) newErrors.interestedIn = 'Select at least one';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'interestedIn') {
      const values = [...formData.interestedIn];
      if (checked) values.push(value);
      else values.splice(values.indexOf(value), 1);
      setFormData(prev => ({ ...prev, interestedIn: values }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (step < 2) return setStep(step + 1);
    
    setSubmitting(true);
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim(),
        birthdate: formData.birthdate,
        gender: formData.gender,
        interestedIn: formData.interestedIn
      });
      showToast('Welcome to Nocturne. Complete your profile to begin.', 'success');
      navigate('/onboarding');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <fieldset className="form-step slide-in">
      <legend className="sr-only">Account Details</legend>
      <div className="step-header">
        <span className="step-number">1</span>
        <h2>Enter the Shadows</h2>
        <p>Your basic details to begin</p>
      </div>
      <div className="form-group">
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Raven"
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
        />
        {errors.firstName && <p id="firstName-error" className="error-message" role="alert">{errors.firstName}</p>}
      </div>
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
            autoComplete="new-password"
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
      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <div className="input-wrapper">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
          />
        </div>
        {errors.confirmPassword && <p id="confirm-error" className="error-message" role="alert">{errors.confirmPassword}</p>}
      </div>
      <div className="form-group">
        <label htmlFor="birthdate">Birthdate</label>
        <input
          id="birthdate"
          name="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={handleChange}
          max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          aria-invalid={!!errors.birthdate}
          aria-describedby={errors.birthdate ? 'birthdate-error' : undefined}
        />
        {errors.birthdate && <p id="birthdate-error" className="error-message" role="alert">{errors.birthdate}</p>}
      </div>
    </fieldset>
  );

  const renderStep2 = () => (
    <fieldset className="form-step slide-in">
      <legend className="sr-only">Identity & Preferences</legend>
      <div className="step-header">
        <span className="step-number">2</span>
        <h2>Define Your Nature</h2>
        <p>Who you are and who you seek</p>
      </div>
      <div className="form-group">
        <label>Your Gender</label>
        <div className="options-grid" role="radiogroup" aria-label="Gender">
          {GENDERS.map(g => (
            <label key={g} className={`option-card ${formData.gender === g ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gender"
                value={g}
                checked={formData.gender === g}
                onChange={handleChange}
                aria-checked={formData.gender === g}
              />
              <span className="option-label">{g.charAt(0).toUpperCase() + g.slice(1)}</span>
            </label>
          ))}
        </div>
        {errors.gender && <p className="error-message" role="alert">{errors.gender}</p>}
      </div>
      <div className="form-group">
        <label>Interested In</label>
        <div className="options-grid" role="group" aria-label="Interested in">
          {GENDERS.map(g => (
            <label key={g} className={`option-card ${formData.interestedIn.includes(g) ? 'selected' : ''}`}>
              <input
                type="checkbox"
                name="interestedIn"
                value={g}
                checked={formData.interestedIn.includes(g)}
                onChange={handleChange}
                aria-checked={formData.interestedIn.includes(g)}
              />
              <span className="option-label">{g.charAt(0).toUpperCase() + g.slice(1)}</span>
            </label>
          ))}
        </div>
        {errors.interestedIn && <p className="error-message" role="alert">{errors.interestedIn}</p>}
      </div>
    </fieldset>
  );

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
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="steps-indicator" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`} aria-hidden="true">
                <span>1</span>
              </div>
              <div className="step-line" aria-hidden="true" />
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`} aria-hidden="true">
                <span>2</span>
              </div>
            </div>
            
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            
            <div className="form-actions">
              {step === 1 && (
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <span>Continue</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              )}
              {step === 2 && (
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner" aria-hidden="true"></span>
                      <span>Conjuring...</span>
                    </>
                  ) : (
                    <>
                      <span>Join the Nocturne</span>
                      <Moon size={18} aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
          
          <p className="auth-footer">
            Already dwell in shadows? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, INTERESTS } from '../../utils/api';
import { isUploadableImage, readFileAsDataURL, newPhotoId } from '../../utils/photos';
import { ChevronLeft, ChevronRight, Check, X, Image, Trash2 } from 'lucide-react';
import './Onboarding.css';

const STEPS = ['basics', 'bio', 'interests', 'photos', 'location'];
const STEP_LABELS = {
  basics: 'Basics',
  bio: 'Bio',
  interests: 'Interests',
  photos: 'Photos',
  location: 'Location'
};

export default function Onboarding() {
  const { user, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    photos: [],
    location: { city: '', lat: null, lng: null },
    preferences: { minAge: 18, maxAge: 99, maxDistance: 50 }
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // Photo entries: { id, src, uploading }. src starts as a local preview and
  // is swapped for the Cloudinary CDN URL once the upload finishes.
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        bio: user.bio || '',
        interests: user.interests || [],
        photos: user.photos || [],
        location: user.location || { city: '', lat: null, lng: null },
        preferences: user.preferences || { minAge: 18, maxAge: 99, maxDistance: 50 }
      }));
      setPhotoPreviews((user.photos || []).map(src => ({ id: newPhotoId(), src, uploading: false })));
    }
  }, [user]);

  const validateStep = () => {
    const step = STEPS[currentStep];
    const newErrors = {};
    if (step === 'basics') {
      if (!formData.preferences.minAge || !formData.preferences.maxAge) newErrors.age = 'Select age range';
      else if (formData.preferences.minAge >= formData.preferences.maxAge) newErrors.age = 'Min age must be less than max';
    }
    if (step === 'bio' && (!formData.bio || formData.bio.trim().length < 20)) {
      newErrors.bio = 'Bio must be at least 20 characters';
    }
    if (step === 'interests' && formData.interests.length < 3) {
      newErrors.interests = 'Select at least 3 interests';
    }
    if (step === 'photos' && photoPreviews.length === 0) {
      newErrors.photos = 'Add at least one photo';
    }
    if (step === 'location' && !formData.location.city.trim()) {
      newErrors.location = 'Enter your city';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('preferences.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: type === 'checkbox' ? checked : parseInt(value) || value }
      }));
    } else if (name.startsWith('location.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({ ...prev, location: { ...prev.location, [key]: value } }));
    } else if (name === 'interests') {
      const values = [...formData.interests];
      if (checked) values.push(value);
      else values.splice(values.indexOf(value), 1);
      setFormData(prev => ({ ...prev, interests: values }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const remaining = 6 - photoPreviews.length;
    const toAdd = files.slice(0, remaining);
    
    toAdd.forEach(async (file) => {
      const check = isUploadableImage(file);
      if (!check.ok) {
        showToast(`${file.name}: ${check.reason}`, 'error');
        return;
      }
      const id = newPhotoId();
      try {
        // Show an instant local preview, then swap in the CDN URL.
        const preview = await readFileAsDataURL(file);
        setPhotoPreviews(prev => [...prev, { id, src: preview, uploading: true }]);
        setPhotoFiles(prev => [...prev, file]);
        const { url } = await api.users.uploadPhoto(preview);
        setPhotoPreviews(prev => prev.map(p => p.id === id ? { ...p, src: url, uploading: false } : p));
      } catch (err) {
        // Upload failed (or unconfigured) — keep the local preview so the
        // user is never blocked; the backend still accepts data URLs.
        setPhotoPreviews(prev => prev.map(p => p.id === id ? { ...p, uploading: false } : p));
        showToast('Photo kept locally — cloud upload failed.', 'error');
      }
    });
    e.target.value = '';
  };

  const handlePhotoRemove = (index) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const photosUploading = photoPreviews.some(p => p.uploading);

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (!validateStep()) return;
    if (photosUploading) {
      showToast('Wait for photo uploads to finish.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.users.update({
        bio: formData.bio,
        interests: formData.interests,
        photos: photoPreviews.map(p => p.src),
        location: formData.location,
        preferences: formData.preferences
      });
      await refreshUser();
      showToast('Your persona is complete. Welcome to the Nocturne.', 'success');
      navigate('/discover');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const stepContent = {
    basics: (
      <fieldset className="onboard-step slide-in">
        <legend className="sr-only">Basic Preferences</legend>
        <div className="step-header">
          <h2>Set Your Preferences</h2>
          <p>Who you'd like to meet in the shadows</p>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="minAge">Minimum Age</label>
            <select id="minAge" name="preferences.minAge" value={formData.preferences.minAge} onChange={handleChange}>
              {[...Array(62)].map((_, i) => 18 + i).map(age => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="maxAge">Maximum Age</label>
            <select id="maxAge" name="preferences.maxAge" value={formData.preferences.maxAge} onChange={handleChange}>
              {[...Array(62)].map((_, i) => 18 + i).map(age => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>
        </div>
        {errors.age && <p className="error-message" role="alert">{errors.age}</p>}
        <div className="form-group">
          <label htmlFor="maxDistance">Maximum Distance (km)</label>
          <input
            id="maxDistance"
            name="preferences.maxDistance"
            type="range"
            min="1"
            max="500"
            value={formData.preferences.maxDistance}
            onChange={handleChange}
            className="range-input"
          />
          <div className="range-value">{formData.preferences.maxDistance} km</div>
        </div>
      </fieldset>
    ),
    bio: (
      <fieldset className="onboard-step slide-in">
        <legend className="sr-only">Your Bio</legend>
        <div className="step-header">
          <h2>Tell Your Tale</h2>
          <p>Share your dark essence in words</p>
        </div>
        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={6}
            placeholder="Midnight wanderer seeking someone to share dark poetry and red wine with..."
            maxLength={500}
            aria-invalid={!!errors.bio}
            aria-describedby={errors.bio ? 'bio-error' : 'bio-count'}
          />
          <div className="char-count" id="bio-count">
            {formData.bio.length}/500
          </div>
          {errors.bio && <p id="bio-error" className="error-message" role="alert">{errors.bio}</p>}
        </div>
      </fieldset>
    ),
    interests: (
      <fieldset className="onboard-step slide-in">
        <legend className="sr-only">Your Interests</legend>
        <div className="step-header">
          <h2>Choose Your Passions</h2>
          <p>Select at least 3 that call to you</p>
        </div>
        <div className="interests-grid" role="group" aria-label="Interests">
          {INTERESTS.map(interest => (
            <label key={interest} className={`interest-chip ${formData.interests.includes(interest) ? 'selected' : ''}`}>
              <input
                type="checkbox"
                name="interests"
                value={interest}
                checked={formData.interests.includes(interest)}
                onChange={handleChange}
                aria-checked={formData.interests.includes(interest)}
              />
              <span>{interest}</span>
              {formData.interests.includes(interest) && <Check size={16} aria-hidden="true" />}
            </label>
          ))}
        </div>
        {errors.interests && <p className="error-message" role="alert">{errors.interests}</p>}
        <p className="interest-count">{formData.interests.length} selected</p>
      </fieldset>
    ),
    photos: (
      <fieldset className="onboard-step slide-in">
        <legend className="sr-only">Your Photos</legend>
        <div className="step-header">
          <h2>Show Your Face</h2>
          <p>Add 1-6 photos (drag to reorder)</p>
        </div>
        <div className="photos-dropzone" onClick={() => document.getElementById('photo-upload').click()}>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoAdd}
            className="sr-only"
            aria-label="Upload photos"
          />
          {photoPreviews.length === 0 ? (
            <div className="dropzone-empty">
              <Image size={48} aria-hidden="true" />
              <p>Click or drag photos here</p>
              <span>Max 6 photos, 5MB each</span>
            </div>
          ) : (
            <div className="photos-grid">
              {photoPreviews.map((preview, index) => (
                <div key={preview.id} className={`photo-item ${preview.uploading ? 'uploading' : ''}`}>
                  <img src={preview.src} alt={`Photo ${index + 1}`} />
                  {preview.uploading && <span className="photo-uploading" aria-label="Uploading">...</span>}
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={(e) => { e.stopPropagation(); handlePhotoRemove(index); }}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {photoPreviews.length < 6 && (
                <div className="photo-add-slot" onClick={() => document.getElementById('photo-upload').click()}>
                  <Image size={32} aria-hidden="true" />
                  <span>Add more</span>
                </div>
              )}
            </div>
          )}
        </div>
        {errors.photos && <p className="error-message" role="alert">{errors.photos}</p>}
      </fieldset>
    ),
    location: (
      <fieldset className="onboard-step slide-in">
        <legend className="sr-only">Your Location</legend>
        <div className="step-header">
          <h2>Where the Shadows Fall</h2>
          <p>Your city (location is approximate)</p>
        </div>
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="location.city"
            type="text"
            value={formData.location.city}
            onChange={handleChange}
            placeholder="New Orleans, Salem, Portland..."
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? 'location-error' : undefined}
          />
          {errors.location && <p id="location-error" className="error-message" role="alert">{errors.location}</p>}
        </div>
        <div className="location-hint">
          <p>We'll use your city center for distance calculations. Your exact location is never shared.</p>
        </div>
      </fieldset>
    )
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-progress" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Onboarding progress">
        {STEPS.map((step, index) => (
          <div key={step} className={`progress-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}>
            <div className="progress-dot" aria-hidden="true">
              {index < currentStep && <Check size={16} />}
              {index >= currentStep && <span>{index + 1}</span>}
            </div>
            <span className="progress-label">{STEP_LABELS[step]}</span>
            {index < STEPS.length - 1 && <div className={`progress-line ${index < currentStep ? 'completed' : ''}`} aria-hidden="true" />}
          </div>
        ))}
      </div>
      
      <div className="onboarding-card card filgrees">
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate>
          {stepContent[STEPS[currentStep]]}
          
          <div className="onboarding-actions">
            {currentStep > 0 && (
              <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={saving}>
                <ChevronLeft size={18} aria-hidden="true" />
                <span>Back</span>
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Saving...</span>
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <span>Begin the Journey</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
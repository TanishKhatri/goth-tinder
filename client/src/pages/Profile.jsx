import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, calculateAge, INTERESTS } from '../utils/api';
import { isUploadableImage, readFileAsDataURL, newPhotoId } from '../utils/photos';
import { Edit, X, MapPin, Heart, Star, Settings, Camera, Trash2 } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOwn = !userId || (user && userId === user._id);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    photos: [],
    preferences: { minAge: 18, maxAge: 99, maxDistance: 50 },
    location: { city: '' }
  });
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (isOwn) {
      setProfile(user);
      setFormData({
        bio: user.bio || '',
        interests: user.interests || [],
        photos: user.photos || [],
        preferences: user.preferences || { minAge: 18, maxAge: 99, maxDistance: 50 },
        location: user.location || { city: '' }
      });
      setPhotoPreviews((user.photos || []).map(src => ({ id: newPhotoId(), src, uploading: false })));
      setLoading(false);
      if (searchParams.get('edit')) setEditing(true);
    } else {
      fetchOtherProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId]);

  const fetchOtherProfile = async () => {
    setLoading(true);
    try {
      const data = await api.users.profile(userId);
      setProfile(data.user);
    } catch (err) {
      showToast('Profile not found', 'error');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
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
  };

  const photosUploading = photoPreviews.some(p => p.uploading);

  const handleSave = async () => {
    if (!formData.bio.trim()) {
      showToast('Bio is required', 'error');
      return;
    }
    if (photoPreviews.length === 0) {
      showToast('At least one photo is required', 'error');
      return;
    }
    if (photosUploading) {
      showToast('Wait for photo uploads to finish.', 'error');
      return;
    }
    if (formData.interests.length < 3) {
      showToast('Select at least 3 interests', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.users.update({
        bio: formData.bio,
        interests: formData.interests,
        photos: photoPreviews.map(p => p.src),
        preferences: formData.preferences,
        location: formData.location
      });
      await refreshUser();
      setEditing(false);
      showToast('Profile saved', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isOwn && user) {
      setFormData({
        bio: user.bio || '',
        interests: user.interests || [],
        photos: user.photos || [],
        preferences: user.preferences || { minAge: 18, maxAge: 99, maxDistance: 50 },
        location: user.location || { city: '' }
      });
      setPhotoPreviews((user.photos || []).map(src => ({ id: newPhotoId(), src, uploading: false })));
    }
    setEditing(false);
  };

  if (loading || !profile) {
    return (
      <div className="profile-page">
        <div className="skeleton-profile card" aria-busy="true" aria-label="Loading profile">
          <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
          <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '-40px auto 1rem' }} />
          <div className="skeleton" style={{ width: '40%', height: '24px', borderRadius: 'var(--radius-sm)', margin: '0 auto 1rem' }} />
          <div className="skeleton" style={{ width: '60%', height: '16px', borderRadius: 'var(--radius-sm)', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const age = profile.birthdate ? calculateAge(profile.birthdate) : null;
  const gender = isOwn ? profile.gender : null;
  const interestedIn = isOwn ? profile.interestedIn : null;

  return (
    <div className="profile-page">
      {isOwn && (
        <header className="profile-header-actions">
          <h1>Your Persona</h1>
          <div className="header-buttons">
            {!editing && (
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                <Edit size={18} aria-hidden="true" />
                <span>Edit</span>
              </button>
            )}
            {editing && (
              <>
                <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </header>
      )}

      <div className="profile-card card filgrees">
        <div className="profile-cover" style={{ backgroundImage: `url(${profile.photos?.[0] || 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=cover&backgroundColor=0a0a0d,1a1a2e,16213e'})` }} />
        
        <div className="profile-avatar">
          <img 
            src={photoPreviews[0]?.src || profile.photos?.[0] || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${profile.firstName}&backgroundColor=0a0a0d,1a1a2e,16213e`}
            alt={profile.firstName}
          />
          {editing && (
            <label className="avatar-edit-btn" htmlFor="avatar-upload">
              <Camera size={20} aria-hidden="true" />
              <input id="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoAdd} />
            </label>
          )}
        </div>

        <div className="profile-info">
          <h2 className="profile-name">
            {profile.firstName}
            {age && <span className="profile-age">, {age}</span>}
            {gender && <span className="profile-gender badge">{gender}</span>}
          </h2>
          
          {interestedIn && interestedIn.length > 0 && (
            <div className="profile-seeking">
              <Heart size={14} aria-hidden="true" />
              <span>Seeking: {interestedIn.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}</span>
            </div>
          )}
          
          {profile.location?.city && (
            <div className="profile-location">
              <MapPin size={14} aria-hidden="true" />
              <span>{profile.location.city}</span>
            </div>
          )}
        </div>

        {editing && (
          <div className="profile-edit-form">
            <div className="form-section">
              <h3>Photos</h3>
              <div className="photos-editor">
                {photoPreviews.map((preview, index) => (
                  <div key={preview.id} className={`photo-editor-item ${preview.uploading ? 'uploading' : ''}`}>
                    <img src={preview.src} alt={`Photo ${index + 1}`} />
                    {preview.uploading && <span className="photo-uploading" aria-label="Uploading">...</span>}
                    <button
                      type="button" 
                      className="photo-remove-btn"
                      onClick={() => handlePhotoRemove(index)}
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {photoPreviews.length < 6 && (
                  <label className="photo-add-slot" htmlFor="photo-upload">
                    <input id="photo-upload" type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoAdd} />
                    <Camera size={32} aria-hidden="true" />
                    <span>Add Photo</span>
                  </label>
                )}
              </div>
              <p className="form-hint">{photoPreviews.length}/6 photos</p>
            </div>

            <div className="form-section">
              <h3>Bio</h3>
              <div className="form-group">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell your story..."
                  maxLength={500}
                />
                <div className="char-count">{formData.bio.length}/500</div>
              </div>
            </div>

            <div className="form-section">
              <h3>Interests</h3>
              <div className="interests-editor">
                {INTERESTS.map(interest => (
                  <label key={interest} className={`interest-chip ${formData.interests.includes(interest) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      name="interests"
                      value={interest}
                      checked={formData.interests.includes(interest)}
                      onChange={handleChange}
                    />
                    <span>{interest}</span>
                  </label>
                ))}
              </div>
              <p className="form-hint">{formData.interests.length} selected (minimum 3)</p>
            </div>

            <div className="form-section">
              <h3>Preferences</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minAge">Min Age</label>
                  <select id="minAge" name="preferences.minAge" value={formData.preferences.minAge} onChange={handleChange}>
                    {[...Array(62)].map((_, i) => 18 + i).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="maxAge">Max Age</label>
                  <select id="maxAge" name="preferences.maxAge" value={formData.preferences.maxAge} onChange={handleChange}>
                    {[...Array(62)].map((_, i) => 18 + i).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="maxDistance">Max Distance: {formData.preferences.maxDistance} km</label>
                <input id="maxDistance" name="preferences.maxDistance" type="range" min="1" max="500" value={formData.preferences.maxDistance} onChange={handleChange} className="range-input" />
              </div>
            </div>

            <div className="form-section">
              <h3>Location</h3>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input id="city" name="location.city" type="text" value={formData.location.city} onChange={handleChange} placeholder="Your city" />
              </div>
            </div>
          </div>
        )}

        {!editing && profile.bio && (
          <div className="profile-bio">
            <h3>About</h3>
            <p>{profile.bio}</p>
          </div>
        )}

        {!editing && profile.interests?.length > 0 && (
          <div className="profile-interests">
            <h3>Interests</h3>
            <div className="interests-display">
              {profile.interests.map(interest => (
                <span key={interest} className="badge">{interest}</span>
              ))}
            </div>
          </div>
        )}

        {!editing && isOwn && (
          <div className="profile-preferences">
            <h3>Preferences</h3>
            <div className="preferences-grid">
              <div className="pref-item">
                <Star size={16} aria-hidden="true" />
                <span>Age: {profile.preferences?.minAge}–{profile.preferences?.maxAge}</span>
              </div>
              <div className="pref-item">
                <MapPin size={16} aria-hidden="true" />
                <span>Distance: {profile.preferences?.maxDistance} km</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isOwn && !editing && (
        <div className="profile-settings card filgrees">
          <h3>Account</h3>
          <Link to="/settings" className="settings-link">
            <Settings size={20} aria-hidden="true" />
            <span>Account Settings</span>
            <X size={18} className="chevron" />
          </Link>
        </div>
      )}
    </div>
  );
}
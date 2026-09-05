import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { User, Lock, Trash2, Moon, Sun, Bell, Shield } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { user, updateUser, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('account');
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!passwordData.current) errors.current = 'Current password required';
    if (!passwordData.new) errors.new = 'New password required';
    else if (passwordData.new.length < 8) errors.new = 'At least 8 characters';
    if (passwordData.new !== passwordData.confirm) errors.confirm = 'Passwords do not match';
    
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;
    
    setChangingPassword(true);
    try {
      await api.users.updatePassword({ currentPassword: passwordData.current, newPassword: passwordData.new });
      setPasswordData({ current: '', new: '', confirm: '' });
      showToast('Password changed', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      showToast('Type DELETE to confirm', 'error');
      return;
    }
    setDeleting(true);
    try {
      await api.users.delete();
      logout();
      showToast('Account deleted. Farewell.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Moon },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 }
  ];

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="page-subtitle">Configure your sanctuary</p>
      </header>

      <div className="settings-layout">
        <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                className={`settings-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-content">
          <div role="tabpanel" id="account-panel" aria-labelledby="account-tab" hidden={activeTab !== 'account'}>
            <div className="settings-section card filgrees">
              <h2>Profile Information</h2>
              <p className="section-desc">Your identity in the Nocturne</p>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>Email</label>
                  <span>{user.email}</span>
                </div>
                <div className="info-item">
                  <label>Member Since</label>
                  <span>{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="info-item">
                  <label>Gender</label>
                  <span>{user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</span>
                </div>
                <div className="info-item">
                  <label>Seeking</label>
                  <span>{user.interestedIn.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}</span>
                </div>
              </div>
              
              <Link to="/profile?edit=true" className="btn btn-secondary">
                <User size={18} aria-hidden="true" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          <div role="tabpanel" id="security-panel" aria-labelledby="security-tab" hidden={activeTab !== 'security'}>
            <div className="settings-section card filgrees">
              <h2>Change Password</h2>
              <p className="section-desc">Keep your sanctuary secure</p>
              
              <form onSubmit={handlePasswordChange} noValidate>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    name="current"
                    type="password"
                    value={passwordData.current}
                    onChange={e => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!passwordErrors.current}
                  />
                  {passwordErrors.current && <p className="error-message">{passwordErrors.current}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    name="new"
                    type="password"
                    value={passwordData.new}
                    onChange={e => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!passwordErrors.new}
                  />
                  {passwordErrors.new && <p className="error-message">{passwordErrors.new}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    name="confirm"
                    type="password"
                    value={passwordData.confirm}
                    onChange={e => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!passwordErrors.confirm}
                  />
                  {passwordErrors.confirm && <p className="error-message">{passwordErrors.confirm}</p>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                  {changingPassword ? 'Changing...' : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="settings-section card filgrees">
              <h2>Sessions</h2>
              <p className="section-desc">Manage your active sessions</p>
              <div className="setting-row">
                <div>
                  <h3>Current Session</h3>
                  <p>This device · Active now</p>
                </div>
                <button className="btn btn-ghost" disabled>Revoke Others</button>
              </div>
            </div>
          </div>

          <div role="tabpanel" id="preferences-panel" aria-labelledby="preferences-tab" hidden={activeTab !== 'preferences'}>
            <div className="settings-section card filgrees">
              <h2>Notifications</h2>
              <p className="section-desc">How you're summoned</p>
              
              <div className="toggle-list">
                <label className="toggle-item">
                  <div>
                    <h3>New Matches</h3>
                    <p>When someone likes you back</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" aria-hidden="true"></span>
                </label>
                <label className="toggle-item">
                  <div>
                    <h3>New Messages</h3>
                    <p>When you receive a message</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" aria-hidden="true"></span>
                </label>
                <label className="toggle-item">
                  <div>
                    <h3>Typing Indicators</h3>
                    <p>Show when someone is typing</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" aria-hidden="true"></span>
                </label>
              </div>
            </div>

            <div className="settings-section card filgrees">
              <h2>Appearance</h2>
              <p className="section-desc">Customize your view</p>
              
              <div className="setting-row">
                <div>
                  <h3>Theme</h3>
                  <p>Gothic (default)</p>
                </div>
                <div className="theme-options">
                  <button className={`theme-btn ${true ? 'active' : ''}`} disabled>
                    <Moon size={18} aria-hidden="true" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>
              
              <div className="setting-row">
                <div>
                  <h3>Reduced Motion</h3>
                  <p>Minimize animations</p>
                </div>
                <label className="toggle-slider-large">
                  <input type="checkbox" />
                  <span className="toggle-track" aria-hidden="true"></span>
                </label>
              </div>
            </div>
          </div>

          <div role="tabpanel" id="danger-panel" aria-labelledby="danger-tab" hidden={activeTab !== 'danger'}>
            <div className="settings-section card filgrees danger-section">
              <h2>Danger Zone</h2>
              <p className="section-desc">Irreversible actions</p>
              
              <div className="danger-item">
                <div>
                  <h3>Delete Account</h3>
                  <p>Permanently remove your profile, matches, and messages. This cannot be undone.</p>
                </div>
                <div className="danger-actions">
                  <input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    className="delete-confirm-input"
                  />
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirm !== 'DELETE'}
                  >
                    {deleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
              
              <div className="danger-item">
                <div>
                  <h3>Data Export</h3>
                  <p>Request a copy of your data</p>
                </div>
                <button className="btn btn-ghost" disabled>Request Export</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
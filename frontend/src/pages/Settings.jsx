import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Bell, Moon, Volume2, Shield, LogOut,
  Trash2, Smartphone, Mail, Key, User, Save
} from 'lucide-react';
import { API_BASE } from '../lib/api';

const Settings = () => {
  const { logout, user, token, updateUser } = useAuth();
  const { notifyInfo, notifySuccess, notifyError } = useNotification();

  const [reminders, setReminders] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    studyGoal: '',
    bio: '',
  });

  const [pwForm, setPwForm] = useState({
    current: '',
    newPw: '',
    confirm: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotif: true,
    pushNotif: true,
    darkMode: false,
    focusSounds: false,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        studyGoal: user.studyGoal || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const fetchReminders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setReminders(data.reminders);
      } catch (err) {
        console.error('Settings reminders fetch failed:', err);
      }
    };
    fetchReminders();
  }, [token]);

  const toggle = (key) => {
    const next = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: next }));
    notifyInfo(
      `${key === 'emailNotif' ? 'Email notifications' :
        key === 'pushNotif' ? 'Browser notifications' :
          key === 'darkMode' ? 'Dark mode' :
            'Focus sounds'} ${next ? 'enabled' : 'disabled'}.`
    );
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name,
          studyGoal: profileForm.studyGoal,
          bio: profileForm.bio,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        updateUser({
          name: data.user.name,
          bio: data.user.bio,
          studyGoal: data.user.studyGoal,
        });
        notifySuccess('Profile updated successfully!');
      } else {
        notifyError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      notifyError('Network error. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      notifyError('New passwords do not match.');
      return;
    }
    if (pwForm.newPw.length < 6) {
      notifyError('Password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        notifySuccess('Password changed successfully!');
        setPwForm({ current: '', newPw: '', confirm: '' });
      } else {
        notifyError(data.message || 'Password change failed.');
      }
    } catch {
      notifyError('Network error. Try again.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) logout();
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5">
        <h2 className="fw-bold mb-4 mt-3">Settings</h2>

        <div className="row g-4">
          {/* ── Left Main Column ── */}
          <div className="col-lg-8">

            {/* 1. Edit Information */}
            <div className="bg-white rounded-4 shadow-sm border overflow-hidden mb-4">
              <div className="p-4 border-bottom" style={{ background: '#f8f9ff' }}>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <User size={16} className="text-primary" /> Edit Information
                </h6>
              </div>

              <div className="p-4">
                <form onSubmit={handleProfileSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light border-0 rounded-3"
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                        EMAIL (cannot be changed)
                      </label>
                      <input
                        type="email"
                        className="form-control bg-light border-0 rounded-3 text-muted"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                        CURRENT STUDY GOAL
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light border-0 rounded-3"
                        placeholder="e.g. Master DSA and land a dev job"
                        value={profileForm.studyGoal}
                        onChange={e => setProfileForm({ ...profileForm, studyGoal: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                        BIO
                      </label>
                      <textarea
                        className="form-control bg-light border-0 rounded-3"
                        rows="3"
                        placeholder="Tell us about yourself..."
                        value={profileForm.bio}
                        onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-end">
                    <button
                      type="submit"
                      className="btn btn-primary fw-bold px-4 rounded-3 d-inline-flex align-items-center gap-2"
                      disabled={profileLoading}
                    >
                      <Save size={16} />
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* 2. Change Password */}
            <div className="bg-white rounded-4 shadow-sm border overflow-hidden mb-4">
              <div className="p-4 border-bottom" style={{ background: '#f8f9ff' }}>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <Key size={16} className="text-warning" /> Change Password
                </h6>
              </div>

              <div className="p-4">
                <form onSubmit={handlePasswordChange}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                        CURRENT PASSWORD
                      </label>
                      <input
                        type="password"
                        className="form-control bg-light border-0 rounded-3"
                        placeholder="Enter current password"
                        value={pwForm.current}
                        onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                        NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        className="form-control bg-light border-0 rounded-3"
                        placeholder="Min. 6 characters"
                        value={pwForm.newPw}
                        onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                        CONFIRM NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        className="form-control bg-light border-0 rounded-3"
                        placeholder="Re-enter new password"
                        value={pwForm.confirm}
                        onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-end">
                    <button
                      type="submit"
                      className="btn btn-warning fw-bold px-4 rounded-3"
                      disabled={pwLoading}
                    >
                      {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* 3. Notifications & Appearance */}
            <div className="bg-white rounded-4 shadow-sm border overflow-hidden mb-4">
              <div className="p-4 border-bottom" style={{ background: '#f8f9ff' }}>
                <h6 className="fw-bold mb-0">Notifications & Appearance</h6>
              </div>

              <div className="p-4 d-flex flex-column gap-4">
                {[
                  {
                    key: 'emailNotif',
                    icon: <Mail size={20} />,
                    color: 'text-primary bg-primary',
                    title: 'Email Notifications',
                    desc: 'Weekly summaries and deadline alerts sent to your email.',
                  },
                  {
                    key: 'pushNotif',
                    icon: <Smartphone size={20} />,
                    color: 'text-info bg-info',
                    title: 'Browser Notifications',
                    desc: 'Get alerted in-browser when timer ends or reminders are due.',
                  },
                  {
                    key: 'darkMode',
                    icon: <Moon size={20} />,
                    color: 'text-dark bg-dark',
                    title: 'Dark Mode',
                    desc: 'Switch to a darker theme for late-night study sessions.',
                  },
                  {
                    key: 'focusSounds',
                    icon: <Volume2 size={20} />,
                    color: 'text-success bg-success',
                    title: 'Focus Sounds',
                    desc: 'Play ambient noise (lo-fi, rain, white noise) during sessions.',
                  },
                ].map(item => (
                  <div key={item.key} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-3 align-items-center">
                      <div
                        className={`p-2 rounded-circle bg-opacity-10 ${item.color}`}
                        style={{ height: 'fit-content' }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div className="fw-bold small">{item.title}</div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{item.desc}</div>
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0 ps-0">
                      <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={() => toggle(item.key)}
                        style={{ cursor: 'pointer', width: '3em', height: '1.5em' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Danger Zone */}
            <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
              <div className="p-4 border-bottom bg-danger bg-opacity-10">
                <h6 className="fw-bold mb-0 text-danger">Danger Zone</h6>
              </div>
              <div className="p-4 d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold small">Delete Account</div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Permanently removes all your data. Cannot be undone.
                  </div>
                </div>
                <button
                  className="btn btn-outline-danger btn-sm fw-bold px-3 rounded-pill d-flex align-items-center gap-2"
                  onClick={() => notifyError('Account deletion is disabled in demo mode.')}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="col-lg-4">
            {/* Account Info */}
            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
              <h6 className="fw-bold mb-4">Account</h6>

              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle border border-primary border-opacity-25">
                  <User size={22} className="text-primary" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="fw-bold text-truncate">{user?.name}</div>
                  <div className="text-muted small text-truncate">{user?.email}</div>
                </div>
              </div>

              <div className="mb-4">
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill small">
                  ✓ Active · Free Plan
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-light w-100 py-2 fw-bold text-danger rounded-3 d-flex align-items-center justify-content-center gap-2"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>

            {/* Upgrade Card */}
            <div
              className="p-4 rounded-4 text-white text-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              <div className="fs-2 mb-2">🚀</div>
              <h6 className="fw-bold mb-2">Upgrade to Pro</h6>
              <p className="small mb-3 opacity-75">
                Unlock AI study plans, advanced analytics, unlimited sessions, and more.
              </p>
              <button className="btn btn-light btn-sm fw-bold rounded-pill px-4 text-primary">
                View Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

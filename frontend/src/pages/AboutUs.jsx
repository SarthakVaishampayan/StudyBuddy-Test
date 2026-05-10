import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { API_BASE, apiJson } from '../lib/api';
import {
  Mail, Github, Linkedin, Send, Bug, MessageSquare, Sparkles,
  Timer, BarChart3, CheckCircle2, CalendarDays, ListChecks,
  BookOpen, Link2, Shield
} from 'lucide-react';

const AboutUs = () => {
  const { user, token } = useAuth();
  const { notifyError, notifyInfo, notifySuccess } = useNotification();

  const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.0';

  const [submitting, setSubmitting] = useState(false);
  const [reminders, setReminders] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    type: 'bug',
    message: '',
  });

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (data?.success) setReminders(data.reminders || []); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name:  prev.name  || user.name  || '',
      email: prev.email || user.email || '',
    }));
  }, [user]);

  const featureList = useMemo(() => ([
    {
      icon: <Timer size={18} className="text-primary" />,
      title: 'Focus Timer',
      text: 'Use stopwatch or countdown sessions and log study time.',
    },
    {
      icon: <BarChart3 size={18} className="text-primary" />,
      title: 'Analytics',
      text: 'Track weekly activity and daily progress trends.',
    },
    {
      icon: <CheckCircle2 size={18} className="text-primary" />,
      title: 'Habits & Streaks',
      text: 'Build daily habits and maintain streak consistency.',
    },
    {
      icon: <ListChecks size={18} className="text-primary" />,
      title: 'Tasks',
      text: 'Add daily tasks and mark them complete.',
    },
    {
      icon: <CalendarDays size={18} className="text-danger" />,
      title: 'Deadlines',
      text: 'Set reminders and keep track of upcoming due dates.',
    },
    {
      icon: <BookOpen size={18} className="text-primary" />,
      title: 'Subjects & Topics',
      text: 'Create subjects and track topic completion progress.',
    },
    {
      icon: <Sparkles size={18} className="text-warning" />,
      title: 'Your Space',
      text: 'Manage marks + store important links in one place.',
    },
    {
      icon: <Shield size={18} className="text-success" />,
      title: 'Secure Access',
      text: 'Protected routes and token-based authenticated API calls.',
    },
  ]), []);

  const whatsNew = useMemo(() => ([
    {
      version: appVersion,
      date: 'Live now',
      items: [
        'Added "Your Space" page (Marks Manager + Link Manager).',
        'Improved About Us page with features & version updates section.',
      ],
    },
    {
      version: 'Next',
      date: 'Planned',
      items: [
        'EmailJS integration for About Us contact form (send directly to developer email).',
        'Link editing + search & filter inside Your Space.',
      ],
    },
  ]), [appVersion]);

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      notifyError('Please fill all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      if (!token) {
        notifyError('You must be logged in to submit this form.');
        return;
      }

      const { res, data } = await apiJson('/api/contact', {
        token,
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          type: form.type,
          message: form.message.trim(),
        },
      });

      if (!res.ok || !data?.success) {
        notifyError(data?.message || 'Failed to submit. Please try again.');
        return;
      }

      notifySuccess(data?.message || 'Submitted successfully.');
      setForm((prev) => ({ ...prev, subject: '', type: 'bug', message: '' }));
    } catch (err) {
      console.error(err);
      notifyError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* FIX: pass real reminders so notification bell works */}
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5">
        {/* HERO */}
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-4 position-relative overflow-hidden">
          <div
            className="position-absolute top-0 end-0"
            style={{
              width: 260,
              height: 260,
              background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.25), rgba(99,102,241,0) 60%)',
              transform: 'translate(30%, -30%)',
              pointerEvents: 'none',
            }}
          />
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h2 className="fw-bold mb-2 text-dark">About StudyBuddy</h2>
              <p className="text-muted mb-3" style={{ maxWidth: 720 }}>
                StudyBuddy is a student productivity dashboard designed to help you stay consistent with habits,
                track subjects & tasks, log study time, and manage your personal study resources.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <span className="badge rounded-pill px-3 py-2 bg-primary bg-opacity-10 text-primary fw-bold">
                  Live version: {appVersion}
                </span>
                <span className="badge rounded-pill px-3 py-2 bg-success bg-opacity-10 text-success fw-bold">
                  Build: Stable
                </span>
                <span className="badge rounded-pill px-3 py-2 bg-warning bg-opacity-10 text-warning fw-bold">
                  Updates: Active
                </span>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="p-3 rounded-4 border bg-light">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center"
                    style={{ width: 56, height: 56, backgroundColor: '#6366f120' }}
                  >
                    <Sparkles className="text-primary" size={22} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark">Tip</div>
                    <div className="text-muted small">
                      Use <span className="fw-bold text-dark">Your Space</span> to manage marks + important links.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-4 border bg-light">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center"
                    style={{ width: 56, height: 56, backgroundColor: '#22c55e20' }}
                  >
                    <Link2 className="text-success" size={22} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark">Quick Start</div>
                    <div className="text-muted small">
                      Add subjects → manage marks in Your Space → save links for fast access.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Developer + Features */}
        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
              <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: '11px' }}>
                Developer
              </h6>

              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-circle border d-flex align-items-center justify-content-center"
                  style={{ width: 64, height: 64, backgroundColor: '#6366f120' }}
                >
                  <span className="fw-bold text-primary" style={{ fontSize: '22px' }}>SV</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="fw-bold text-dark">Sarthak Vaishampayan</div>
                  <div className="text-muted small text-truncate">Full‑Stack MERN Developer · Creator@StudyBuddy</div>
                </div>
              </div>

              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex align-items-center gap-2">
                  <Mail size={16} className="text-secondary" />
                  <span className="text-truncate">sarthakvaishampayan22@gmail.com</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Github size={16} className="text-secondary" />
                  <a href="https://github.com/SarthakVaishampayan" target="_blank" rel="noreferrer" className="small">
                    github/sarthak-vaishampayan
                  </a>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Linkedin size={16} className="text-secondary" />
                  <a href="https://www.linkedin.com/in/sarthakvaishampayan/" target="_blank" rel="noreferrer" className="small">
                    LinkedIn/SarthakVaishampayan
                  </a>
                </div>
              </div>

              <hr className="my-4" />

              <div className="text-muted small">
                I'm Sarthak Vaishampayan, a Computer Science student at Manipal University Jaipur and the developer
                behind StudyBuddy. I enjoy building clean, scalable web applications that solve real problems. With
                experience in full-stack development and a strong foundation in algorithms and system design, I focus
                on creating practical, user-friendly solutions. I'm passionate about technology, continuous learning,
                and turning ideas into impactful digital products.
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Features</h5>
                <span className="text-muted small">Everything available inside StudyBuddy</span>
              </div>

              <div className="row g-3">
                {featureList.map((f) => (
                  <div key={f.title} className="col-md-6">
                    <div className="p-3 rounded-4 border bg-light h-100">
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="rounded-4 d-flex align-items-center justify-content-center"
                          style={{ width: 42, height: 42, backgroundColor: '#ffffff' }}
                        >
                          {f.icon}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{f.title}</div>
                          <div className="text-muted small">{f.text}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-muted small">
                Want a feature explained in detail? Use the contact form below and choose "Query".
              </div>
            </div>
          </div>
        </div>

        {/* Updates / Version */}
        <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Live Version & Updates</h5>
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2">
              v{appVersion}
            </span>
          </div>

          <div className="row g-3">
            {whatsNew.map((release) => (
              <div key={release.version} className="col-lg-6">
                <div className="p-3 rounded-4 border bg-light h-100">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold text-dark">Version: {release.version}</div>
                      <div className="text-muted small">{release.date}</div>
                    </div>
                    <span className="badge rounded-pill bg-dark bg-opacity-10 text-dark fw-bold px-3 py-2">
                      {release.version === appVersion ? 'Current' : 'Planned'}
                    </span>
                  </div>
                  <ul className="mb-0 text-muted small">
                    {release.items.map((it, idx) => (
                      <li key={idx}>{it}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-muted small">
            Versioning tip: keep it consistent (Major.Minor.Patch) so users know what changed.
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white p-4 rounded-4 shadow-sm border">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              Contact / Report Bug / Query
            </h5>
            <span className="text-muted small">We’ll reply to your email if needed</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>NAME *</label>
                <input
                  type="text"
                  className="form-control bg-light border-0 rounded-3"
                  value={form.name}
                  onChange={(e) => onChange('name', e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>EMAIL *</label>
                <input
                  type="email"
                  className="form-control bg-light border-0 rounded-3"
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="col-md-8">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>SUBJECT *</label>
                <input
                  type="text"
                  className="form-control bg-light border-0 rounded-3"
                  value={form.subject}
                  onChange={(e) => onChange('subject', e.target.value)}
                  placeholder="Short summary (e.g. Link Manager issue, Marks entry)"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>TYPE</label>
                <select
                  className="form-select bg-light border-0 rounded-3"
                  value={form.type}
                  onChange={(e) => onChange('type', e.target.value)}
                >
                  <option value="bug">Bug</option>
                  <option value="feedback">Feedback</option>
                  <option value="question">Query</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>MESSAGE *</label>
                <textarea
                  className="form-control bg-light border-0 rounded-3"
                  rows="6"
                  value={form.message}
                  onChange={(e) => onChange('message', e.target.value)}
                  placeholder="Write your issue / query / suggestion..."
                  required
                />
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2 text-muted small">
                <Bug size={14} />
                <span>Tip: Mention page name + steps to reproduce.</span>
              </div>
              <button
                type="submit"
                className="btn btn-primary fw-bold rounded-3 d-inline-flex align-items-center gap-2 px-4"
                disabled={submitting}
              >
                <Send size={16} />
                {submitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>

          <div className="mt-3 text-muted small">
            Note: Submissions are saved to the server now. Email delivery can be added later (e.g. EmailJS/Nodemailer).
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;

import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle, Circle, X, BookOpen
} from 'lucide-react';

const COLORS = [
  '#8b5cf6', '#6366f1', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const EMOJIS = ['📚', '🧮', '🔬', '🌍', '💻', '🎨', '📖', '⚗️', '📐', '🧬', '🏛️', '🎵'];

const PRIORITIES = ['High', 'Medium', 'Low'];

const priorityBadge = (p) => {
  const map = {
    High:   'bg-danger  bg-opacity-10 text-danger',
    Medium: 'bg-warning bg-opacity-10 text-warning',
    Low:    'bg-success bg-opacity-10 text-success',
  };
  return map[p] || map['Medium'];
};

const ProgressBar = ({ topics }) => {
  if (!topics.length) return (
    <div className="text-muted" style={{ fontSize: '11px' }}>No topics yet</div>
  );
  const done    = topics.filter(t => t.completed).length;
  const percent = Math.round((done / topics.length) * 100);
  return (
    <div>
      <div className="d-flex justify-content-between mb-1">
        <span className="text-muted" style={{ fontSize: '11px' }}>Progress</span>
        <span className="fw-bold" style={{ fontSize: '11px' }}>{done}/{topics.length} topics</span>
      </div>
      <div className="progress rounded-pill" style={{ height: '6px' }}>
        <div
          className="progress-bar rounded-pill"
          style={{ width: `${percent}%`, backgroundColor: '#8b5cf6' }}
        />
      </div>
    </div>
  );
};

const Subjects = () => {
  const { token } = useAuth();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();

  const [subjects, setSubjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [reminders, setReminders]     = useState([]);
  const [expandedId, setExpandedId]   = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [topicInputs, setTopicInputs] = useState({});
  const [addingTopic, setAddingTopic] = useState({});

  const [form, setForm] = useState({
    name:     '',
    emoji:    '📚',
    color:    '#8b5cf6',
    priority: 'Medium',
    notes:    '',
  });

  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [sRes, rRes] = await Promise.all([
          fetch('http://localhost:5000/api/subjects',  { headers }),
          fetch('http://localhost:5000/api/reminders', { headers }),
        ]);
        const [sData, rData] = await Promise.all([sRes.json(), rRes.json()]);
        if (sData.success) setSubjects(sData.subjects);
        if (rData.success) setReminders(rData.reminders);
      } catch (err) {
        console.error(err);
        notifyError('Failed to load subjects.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const res  = await fetch('http://localhost:5000/api/subjects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(prev => [data.subject, ...prev]);
        setForm({ name: '', emoji: '📚', color: '#8b5cf6', priority: 'Medium', notes: '' });
        setShowModal(false);
        notifySuccess(`"${data.subject.name}" added!`);
      } else {
        notifyError(data.message || 'Failed to add subject.');
      }
    } catch {
      notifyError('Network error.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All its topics will be removed.`)) return;
    try {
      const res  = await fetch(`http://localhost:5000/api/subjects/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(prev => prev.filter(s => s._id !== id));
        notifyInfo(`"${name}" deleted.`);
      }
    } catch {
      notifyError('Failed to delete subject.');
    }
  };

  const handleAddTopic = async (subjectId) => {
    const title = (topicInputs[subjectId] || '').trim();
    if (!title) return;
    try {
      const res  = await fetch(`http://localhost:5000/api/subjects/${subjectId}/topics`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title }),
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(prev => prev.map(s => s._id === subjectId ? data.subject : s));
        setTopicInputs(prev => ({ ...prev, [subjectId]: '' }));
      }
    } catch {
      notifyError('Failed to add topic.');
    }
  };

  const handleToggleTopic = async (subjectId, topicId) => {
    try {
      const res  = await fetch(`http://localhost:5000/api/subjects/${subjectId}/topics/${topicId}`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(prev => prev.map(s => s._id === subjectId ? data.subject : s));
      }
    } catch {
      notifyError('Failed to update topic.');
    }
  };

  const handleDeleteTopic = async (subjectId, topicId) => {
    try {
      const res  = await fetch(`http://localhost:5000/api/subjects/${subjectId}/topics/${topicId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(prev => prev.map(s => s._id === subjectId ? data.subject : s));
      }
    } catch {
      notifyError('Failed to delete topic.');
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
          <div>
            <h2 className="fw-bold mb-1">Subjects</h2>
            <p className="text-muted small mb-0">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <button
            className="btn btn-primary fw-bold rounded-3 d-flex align-items-center gap-2 px-4"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} /> Add Subject
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        )}

        {/* Empty state */}
        {!loading && subjects.length === 0 && (
          <div className="text-center py-5">
            <BookOpen size={56} className="text-muted mb-3 opacity-25" />
            <h5 className="fw-bold text-muted">No subjects yet</h5>
            <p className="text-muted small mb-4">Add your first subject to start tracking progress.</p>
            <button
              className="btn btn-primary rounded-3 px-4 fw-bold"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} className="me-2" /> Add Subject
            </button>
          </div>
        )}

        {/* Subject Cards Grid */}
        {!loading && subjects.length > 0 && (
          <div className="row g-4">
            {subjects.map(subject => {
              const isExpanded = expandedId === subject._id;
              const done       = subject.topics.filter(t => t.completed).length;
              const total      = subject.topics.length;
              const percent    = total ? Math.round((done / total) * 100) : 0;

              return (
                <div key={subject._id} className="col-lg-6 col-xl-4">
                  <div className="bg-white rounded-4 shadow-sm border overflow-hidden h-100">
                    {/* Color accent bar */}
                    <div style={{ height: '5px', backgroundColor: subject.color }} />

                    <div className="p-4">
                      {/* Top row */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: '46px', height: '46px',
                              backgroundColor: subject.color + '20',
                              fontSize: '22px',
                            }}
                          >
                            {subject.emoji}
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">{subject.name}</h6>
                            <span className={`badge rounded-pill px-2 py-1 small ${priorityBadge(subject.priority)}`}>
                              {subject.priority}
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-light text-danger rounded-circle border-0"
                          onClick={() => handleDelete(subject._id, subject.name)}
                          title="Delete subject"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Notes */}
                      {subject.notes && (
                        <p className="text-muted small mb-3" style={{ lineHeight: 1.4 }}>
                          {subject.notes}
                        </p>
                      )}

                      {/* Progress */}
                      <div className="mb-3">
                        <ProgressBar topics={subject.topics} />
                      </div>

                      {/* Percent badge */}
                      {total > 0 && (
                        <div className="mb-3">
                          <span
                            className="badge rounded-pill px-3 py-1 fw-bold"
                            style={{
                              backgroundColor: subject.color + '20',
                              color: subject.color,
                              fontSize: '12px',
                            }}
                          >
                            {percent}% Complete
                          </span>
                        </div>
                      )}

                      {/* Expand / Collapse topics */}
                      <button
                        className="btn btn-sm btn-light w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-bold"
                        style={{ fontSize: '13px' }}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : subject._id)
                        }
                      >
                        {isExpanded ? (
                          <><ChevronUp size={16} /> Hide Topics</>
                        ) : (
                          <><ChevronDown size={16} /> View Topics ({total})</>
                        )}
                      </button>

                      {/* Topics panel */}
                      {isExpanded && (
                        <div className="mt-3">
                          {/* Add topic input */}
                          <div className="d-flex gap-2 mb-3">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-light border-0 rounded-3"
                              placeholder="Add a topic..."
                              value={topicInputs[subject._id] || ''}
                              onChange={e =>
                                setTopicInputs(prev => ({ ...prev, [subject._id]: e.target.value }))
                              }
                              onKeyDown={e => e.key === 'Enter' && handleAddTopic(subject._id)}
                            />
                            <button
                              className="btn btn-sm btn-primary rounded-3 px-3"
                              onClick={() => handleAddTopic(subject._id)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Topic list */}
                          {subject.topics.length === 0 ? (
                            <p className="text-muted small text-center py-2 mb-0">
                              No topics yet. Add one above!
                            </p>
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {subject.topics.map(topic => (
                                <div
                                  key={topic._id}
                                  className="d-flex align-items-center gap-2 p-2 rounded-3 bg-light"
                                >
                                  <button
                                    className="btn btn-sm p-0 border-0 bg-transparent"
                                    onClick={() => handleToggleTopic(subject._id, topic._id)}
                                    title={topic.completed ? 'Mark undone' : 'Mark done'}
                                  >
                                    {topic.completed
                                      ? <CheckCircle size={18} style={{ color: subject.color }} />
                                      : <Circle size={18} className="text-muted" />
                                    }
                                  </button>
                                  <span
                                    className={`small flex-grow-1 ${topic.completed ? 'text-decoration-line-through text-muted' : 'text-dark fw-medium'}`}
                                  >
                                    {topic.title}
                                  </span>
                                  <button
                                    className="btn btn-sm p-0 border-0 bg-transparent text-muted"
                                    onClick={() => handleDeleteTopic(subject._id, topic._id)}
                                    title="Remove topic"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Subject Modal ── */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{ width: '480px', maxWidth: '95vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Add New Subject</h5>
              <button
                className="btn btn-sm btn-light rounded-circle border-0"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubject}>
              {/* Name */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                  SUBJECT NAME *
                </label>
                <input
                  type="text"
                  className="form-control bg-light border-0 rounded-3"
                  placeholder="e.g. Data Structures"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              {/* Emoji Picker */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                  EMOJI
                </label>
                <div className="d-flex flex-wrap gap-2">
                  {EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      className={`btn btn-sm rounded-3 ${form.emoji === em ? 'btn-primary' : 'btn-light'}`}
                      style={{ fontSize: '18px', width: '40px', height: '40px', padding: 0 }}
                      onClick={() => setForm({ ...form, emoji: em })}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                  COLOR
                </label>
                <div className="d-flex gap-2">
                  {COLORS.map(col => (
                    <button
                      key={col}
                      type="button"
                      className="rounded-circle border-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px', height: '32px',
                        backgroundColor: col,
                        outline: form.color === col ? `3px solid ${col}` : 'none',
                        outlineOffset: '2px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setForm({ ...form, color: col })}
                    />
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                  PRIORITY
                </label>
                <div className="d-flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 fw-bold ${
                        form.priority === p ? 'btn-primary' : 'btn-light'
                      }`}
                      onClick={() => setForm({ ...form, priority: p })}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                  NOTES (optional)
                </label>
                <textarea
                  className="form-control bg-light border-0 rounded-3"
                  rows="2"
                  placeholder="e.g. Exam on March 15, focus on Trees & Graphs"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light rounded-3 fw-bold px-4"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-3 fw-bold px-4">
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;

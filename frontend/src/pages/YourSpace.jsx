import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  ClipboardList, Plus, Trash2, X, BookOpen, Link2, ExternalLink
} from 'lucide-react';

const YourSpace = () => {
  const { token } = useAuth();
  const { notifyError, notifyInfo, notifySuccess } = useNotification();

  const [reminders, setReminders] = useState([]);

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [showMarksModal, setShowMarksModal] = useState(false);
  const [marksSubject, setMarksSubject] = useState(null);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marks, setMarks] = useState([]);

  const [markForm, setMarkForm] = useState({
    examName: '',
    score: '',
    outOf: '',
    examDate: '',
    note: '',
  });

  const [linksLoading, setLinksLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    description: '',
  });

  const subjectById = useMemo(() => {
    const map = new Map();
    subjects.forEach((s) => map.set(s._id, s));
    return map;
  }, [subjects]);

  const fetchLinks = async () => {
    try {
      setLinksLoading(true);
      const res = await fetch('http://localhost:5000/api/links', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success) setLinks(data.links || []);
      else notifyError(data?.message || 'Failed to load links.');
    } catch (err) {
      console.error(err);
      notifyError('Failed to load links.');
    } finally {
      setLinksLoading(false);
    }
  };

  const fetchPageData = async () => {
    try {
      setLoadingSubjects(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [sRes, rRes] = await Promise.all([
        fetch('http://localhost:5000/api/subjects', { headers }),
        fetch('http://localhost:5000/api/reminders', { headers }),
      ]);

      const [sData, rData] = await Promise.all([sRes.json(), rRes.json()]);

      if (sData?.success) setSubjects(sData.subjects || []);
      if (rData?.success) setReminders(rData.reminders || []);
    } catch (err) {
      console.error(err);
      notifyError('Failed to load Your Space.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchPageData();
    fetchLinks();
  }, [token]);


  const openMarks = async (subjectId) => {
    const subject = subjectById.get(subjectId);
    if (!subject) return;

    setMarksSubject(subject);
    setShowMarksModal(true);
    setMarksLoading(true);
    setMarks([]);

    try {
      const res = await fetch(`http://localhost:5000/api/marks?subjectId=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success) setMarks(data.marks || []);
      else notifyError(data?.message || 'Failed to load marks.');
    } catch (err) {
      console.error(err);
      notifyError('Failed to load marks.');
    } finally {
      setMarksLoading(false);
    }
  };

  const closeMarks = () => {
    setShowMarksModal(false);
    setMarksSubject(null);
    setMarksLoading(false);
    setMarks([]);
    setMarkForm({ examName: '', score: '', outOf: '', examDate: '', note: '' });
  };

  const addMark = async (e) => {
    e.preventDefault();
    if (!marksSubject) return;

    const examName = (markForm.examName || '').trim();
    const examDate = (markForm.examDate || '').trim();
    const score = Number(markForm.score);
    const outOf = Number(markForm.outOf);
    const note = (markForm.note || '').trim();

    if (!examName || !examDate) {
      notifyError('Exam name and date are required.');
      return;
    }
    if (!Number.isFinite(score) || !Number.isFinite(outOf) || outOf <= 0 || score < 0) {
      notifyError('Enter a valid score and total marks.');
      return;
    }
    if (score > outOf) {
      notifyError('Score cannot exceed total marks.');
      return;
    }

    try {
      setMarksLoading(true);
      const res = await fetch('http://localhost:5000/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subjectId: marksSubject._id,
          examName,
          score,
          outOf,
          examDate,
          note,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        notifySuccess('Marks entry added.');
        const listRes = await fetch(`http://localhost:5000/api/marks?subjectId=${marksSubject._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listData = await listRes.json();
        if (listData?.success) setMarks(listData.marks || []);
        setMarkForm({ examName: '', score: '', outOf: '', examDate: '', note: '' });
      } else {
        notifyError(data?.message || 'Failed to add marks.');
      }
    } catch (err) {
      console.error(err);
      notifyError('Network error.');
    } finally {
      setMarksLoading(false);
    }
  };

  const deleteMark = async (markId) => {
    if (!marksSubject) return;
    try {
      setMarksLoading(true);
      const res = await fetch(`http://localhost:5000/api/marks/${markId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        notifyInfo('Marks entry deleted.');
        setMarks((prev) => prev.filter((m) => m._id !== markId));
      } else {
        notifyError(data?.message || 'Failed to delete marks.');
      }
    } catch (err) {
      console.error(err);
      notifyError('Network error.');
    } finally {
      setMarksLoading(false);
    }
  };

  const formatMarkDate = (yyyyMmDd) => {
    if (!yyyyMmDd) return '';
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return yyyyMmDd;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };


  const addLink = async (e) => {
    e.preventDefault();
    const title = (linkForm.title || '').trim();
    const url = (linkForm.url || '').trim();
    const description = (linkForm.description || '').trim();

    if (!title || !url) {
      notifyError('Title and URL are required.');
      return;
    }

    try {
      setLinksLoading(true);
      const res = await fetch('http://localhost:5000/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, url, description }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        notifySuccess('Link saved.');
        setLinks((prev) => [data.link, ...prev]);
        setLinkForm({ title: '', url: '', description: '' });
      } else {
        notifyError(data?.message || 'Failed to save link.');
      }
    } catch (err) {
      console.error(err);
      notifyError('Network error.');
    } finally {
      setLinksLoading(false);
    }
  };

  const deleteLink = async (id) => {
    try {
      setLinksLoading(true);
      const res = await fetch(`http://localhost:5000/api/links/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        notifyInfo('Link deleted.');
        setLinks((prev) => prev.filter((l) => l._id !== id));
      } else {
        notifyError(data?.message || 'Failed to delete link.');
      }
    } catch (err) {
      console.error(err);
      notifyError('Network error.');
    } finally {
      setLinksLoading(false);
    }
  };

  const displayUrl = (u) => {
    try {
      const x = new URL(u);
      return `${x.hostname}${x.pathname !== '/' ? x.pathname : ''}`;
    } catch {
      return u;
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5">
        <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
          <div>
            <h2 className="fw-bold mb-1">Your Space</h2>
            <p className="text-muted small mb-0">Manage your personal resources (Marks & Links).</p>
          </div>
        </div>

        <div className="row g-4">
          {/* Marks */}
          <div className="col-lg-12">
            <div className="bg-white p-4 rounded-4 shadow-sm border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <ClipboardList className="text-primary" size={20} />
                  Marks Manager
                </h5>
                <span className="text-muted small">
                  {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loadingSubjects ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No subjects found. Create a subject first from the Subjects page.
                </div>
              ) : (
                <div className="row g-3">
                  {subjects.map((s) => (
                    <div key={s._id} className="col-md-6 col-xl-4">
                      <div className="p-3 border rounded-4 bg-light h-100">
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '14px' }}>
                              {s.emoji} {s.name}
                            </div>
                            <div className="text-muted small text-truncate">
                              Priority: <span className="fw-bold">{s.priority}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-primary rounded-3 fw-bold"
                            onClick={() => openMarks(s._id)}
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="col-lg-12">
            <div className="bg-white p-4 rounded-4 shadow-sm border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <Link2 className="text-success" size={20} />
                  Link Manager
                </h5>
                <span className="text-muted small">{links.length} saved</span>
              </div>

              {/* Add link */}
              <form onSubmit={addLink} className="p-3 rounded-4 border mb-3" style={{ backgroundColor: '#f8fafc' }}>
                <div className="row g-2">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                      TITLE *
                    </label>
                    <input
                      className="form-control bg-white border-0 rounded-3"
                      placeholder="e.g. Replit, LeetCode, Notes"
                      value={linkForm.title}
                      onChange={(e) => setLinkForm((p) => ({ ...p, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                      URL *
                    </label>
                    <input
                      className="form-control bg-white border-0 rounded-3"
                      placeholder="e.g. https://leetcode.com"
                      value={linkForm.url}
                      onChange={(e) => setLinkForm((p) => ({ ...p, url: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                      DESCRIPTION
                    </label>
                    <input
                      className="form-control bg-white border-0 rounded-3"
                      placeholder="Optional"
                      value={linkForm.description}
                      onChange={(e) => setLinkForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button type="submit" className="btn btn-success fw-bold rounded-3 px-4" disabled={linksLoading}>
                    <Plus size={16} className="me-2" />
                    {linksLoading ? 'Saving...' : 'Save Link'}
                  </button>
                </div>
              </form>

              {/* List links */}
              {linksLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-success" />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No links yet. Add your first important link above.
                </div>
              ) : (
                <div className="row g-3">
                  {links.map((l) => (
                    <div key={l._id} className="col-md-6 col-xl-4">
                      <div className="p-3 border rounded-4 bg-light h-100">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-bold text-dark text-truncate">{l.title}</div>
                            <div className="text-muted small text-truncate">
                              {displayUrl(l.url)}
                            </div>
                            {l.description ? (
                              <div className="text-muted small mt-1 text-truncate" title={l.description}>
                                {l.description}
                              </div>
                            ) : null}
                          </div>

                          <div className="d-flex gap-2">
                            <a
                              className="btn btn-sm btn-light border-0"
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open"
                            >
                              <ExternalLink size={16} />
                            </a>
                            <button
                              type="button"
                              className="btn btn-sm btn-light text-danger border-0"
                              onClick={() => deleteLink(l._id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Marks Modal */}
      {showMarksModal && marksSubject && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
          onClick={closeMarks}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{ width: '560px', maxWidth: '96vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1">
                  Manage Marks — {marksSubject.emoji} {marksSubject.name}
                </h5>
                <small className="text-muted">Custom exam name, score, total, date.</small>
              </div>
              <button type="button" className="btn btn-sm btn-light rounded-circle border-0" onClick={closeMarks}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={addMark} className="p-3 rounded-4 border mb-3" style={{ backgroundColor: '#f8fafc' }}>
              <div className="row g-2">
                <div className="col-md-5">
                  <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                    EXAM NAME *
                  </label>
                  <input
                    type="text"
                    className="form-control bg-white border-0 rounded-3"
                    placeholder="e.g. Midterm, Unit Test 1"
                    value={markForm.examName}
                    onChange={(e) => setMarkForm((p) => ({ ...p, examName: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                    SCORE *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-control bg-white border-0 rounded-3"
                    value={markForm.score}
                    onChange={(e) => setMarkForm((p) => ({ ...p, score: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                    OUT OF *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-control bg-white border-0 rounded-3"
                    value={markForm.outOf}
                    onChange={(e) => setMarkForm((p) => ({ ...p, outOf: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                    DATE *
                  </label>
                  <input
                    type="date"
                    className="form-control bg-white border-0 rounded-3"
                    value={markForm.examDate}
                    onChange={(e) => setMarkForm((p) => ({ ...p, examDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted" style={{ fontSize: '11px' }}>
                    NOTE (optional)
                  </label>
                  <input
                    type="text"
                    className="form-control bg-white border-0 rounded-3"
                    placeholder="Optional note"
                    value={markForm.note}
                    onChange={(e) => setMarkForm((p) => ({ ...p, note: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-3 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary fw-bold rounded-3 px-4" disabled={marksLoading}>
                  <Plus size={16} className="me-2" />
                  {marksLoading ? 'Saving...' : 'Add Entry'}
                </button>
              </div>
            </form>

            <div className="border rounded-4 overflow-hidden">
              <div className="p-3 border-bottom" style={{ background: '#f8f9ff' }}>
                <div className="fw-bold">Saved Entries</div>
              </div>

              {marksLoading ? (
                <div className="p-4 text-center">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : marks.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                  No marks entries yet. Add your first exam above.
                </div>
              ) : (
                <div className="p-3 d-flex flex-column gap-2">
                  {marks.map((m) => (
                    <div key={m._id} className="d-flex justify-content-between align-items-start p-3 bg-light rounded-4">
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-bold text-dark">
                          {m.examName}
                          <span className="text-muted fw-normal"> • {formatMarkDate(m.examDate)}</span>
                        </div>
                        <div className="text-muted small">
                          Score: <span className="fw-bold text-dark">{m.score}</span> /{' '}
                          <span className="fw-bold text-dark">{m.outOf}</span>
                        </div>
                        {m.note ? (
                          <div className="text-muted small mt-1 text-truncate" title={m.note}>
                            Note: {m.note}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-light text-danger border-0"
                        onClick={() => deleteMark(m._id)}
                        title="Delete entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 d-flex justify-content-end">
              <button type="button" className="btn btn-light fw-bold rounded-3 px-4" onClick={closeMarks}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourSpace;

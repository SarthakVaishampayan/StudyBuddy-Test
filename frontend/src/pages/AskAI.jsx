import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, Trash2, Send, Loader2, List, BookOpen, Brain, Pencil, Maximize2, Minimize2, Presentation, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_BASE } from '../lib/api';

const AskAI = () => {
  const { token, user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState('');
  const [processingTime, setProcessingTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (rateLimitTimer > 0) {
      interval = setInterval(() => setRateLimitTimer(p => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  useEffect(() => {
    let interval;
    if (isProcessing) {
      setProcessingTime(0);
      interval = setInterval(() => setProcessingTime(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const getThinkingMessage = () => {
    if (processingTime < 4) return "Reading document text...";
    if (processingTime < 9) return "Analyzing topics and context...";
    if (processingTime < 15) return "Synthesizing AI response...";
    return "Finalizing output... (Large contexts can take 20-40 seconds)";
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !activeDoc) {
          setActiveDoc(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const isPpt = file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.type === 'application/vnd.ms-powerpoint' ||
      file.name.endsWith('.ppt') || file.name.endsWith('.pptx');

    if (!isPdf && !isPpt) {
      setError('Please upload a valid PDF or PowerPoint file.');
      return;
    }

    if (isPdf && file.size > 5 * 1024 * 1024) {
      setError('PDF files must be strictly under 5MB.');
      e.target.value = null;
      return;
    }

    if (isPpt && file.size > 10 * 1024 * 1024) {
      setError('PowerPoint files must be under 10MB.');
      e.target.value = null;
      return;
    }

    setUploading(true);
    setError('');
    setResult('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/ai/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      await fetchDocuments();
      setActiveDoc(data.document);
      setResult('PDF parsed and ready! Select an action below.');

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/ai/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (activeDoc && activeDoc._id === id) {
          setActiveDoc(null);
          setResult('');
        }
        await fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (actionType) => {
    if (!activeDoc) return;

    setIsProcessing(true);
    setError('');
    setResult('');
    setQuizData(null);

    try {
      const res = await fetch(`${API_BASE}/api/ai/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ documentId: activeDoc._id, actionType })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setRateLimitTimer(60);
        throw new Error(data.message || 'Action failed');
      }

      if (actionType === 'quiz') {
        try {
          // Strip possible markdown code fences just in case
          const cleaned = data.result.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          setQuizData(parsed);
        } catch {
          // Fallback: render as markdown if JSON parsing fails
          setResult(data.result);
        }
      } else {
        setResult(data.result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!activeDoc || !query.trim()) return;

    setIsProcessing(true);
    setError('');
    setResult('');
    setQuizData(null);

    try {
      const res = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ documentId: activeDoc._id, question: query })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setRateLimitTimer(60);
        throw new Error(data.message || 'Ask failed');
      }

      setResult(data.answer);
      setQuery('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Interactive Quiz Component ─────────────────────────────────────────
  const QuizRenderer = ({ questions }) => {
    const [selected, setSelected] = React.useState({});
    const [submitted, setSubmitted] = React.useState(false);
    const [score, setScore] = React.useState(0);

    const handleSelect = (qIdx, letter) => {
      if (submitted) return;
      setSelected(prev => ({ ...prev, [qIdx]: letter }));
    };

    const handleSubmit = () => {
      let s = 0;
      questions.forEach((q, i) => { if (selected[i] === q.answer) s++; });
      setScore(s);
      setSubmitted(true);
    };

    const handleRetry = () => {
      setSelected({});
      setSubmitted(false);
      setScore(0);
    };

    const pct = submitted ? Math.round((score / questions.length) * 100) : 0;
    const scoreColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

    return (
      <div>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <Brain size={18} className="text-success" /> Quiz ({questions.length} Questions)
          </h6>
          {submitted && (
            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={handleRetry}>↩ Retry</button>
          )}
        </div>

        {submitted && (
          <div className="rounded-3 p-4 mb-4 text-center" style={{ background: `${scoreColor}18`, border: `2px solid ${scoreColor}` }}>
            <div className="fw-bold mb-1" style={{ fontSize: '2rem', color: scoreColor }}>{score}/{questions.length}</div>
            <div className="fw-medium" style={{ color: scoreColor }}>
              {pct >= 80 ? '🎉 Excellent work!' : pct >= 50 ? '👍 Good effort, keep practising!' : '📚 Review the material and try again.'}
            </div>
          </div>
        )}

        <div className="d-flex flex-column gap-4">
          {questions.map((q, qi) => {
            const userAns = selected[qi];
            const isCorrect = submitted && userAns === q.answer;
            const isWrong = submitted && userAns && userAns !== q.answer;
            return (
              <div key={qi} className="rounded-3 p-3" style={{ background: submitted ? (isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : '#f9fafb') : '#f9fafb', border: '1px solid', borderColor: submitted ? (isCorrect ? '#86efac' : isWrong ? '#fca5a5' : '#e5e7eb') : '#e5e7eb' }}>
                <p className="fw-semibold mb-3" style={{ fontSize: '15px' }}>
                  <span className="badge bg-primary me-2" style={{ fontSize: '12px' }}>Q{qi + 1}</span>
                  {q.question}
                </p>
                <div className="d-flex flex-column gap-2">
                  {q.options.map((opt) => {
                    const letter = opt.charAt(0);
                    const isSelected = userAns === letter;
                    const isAnswer = submitted && q.answer === letter;
                    let bg = 'white', border = '#dee2e6', color = '#1f2937', fw = 'normal';
                    if (isSelected && !submitted) { bg = '#eff6ff'; border = '#3b82f6'; color = '#1d4ed8'; fw = '600'; }
                    if (isAnswer) { bg = '#f0fdf4'; border = '#22c55e'; color = '#15803d'; fw = '600'; }
                    if (isSelected && !isAnswer && submitted) { bg = '#fef2f2'; border = '#ef4444'; color = '#b91c1c'; fw = '600'; }
                    return (
                      <button
                        key={letter}
                        onClick={() => handleSelect(qi, letter)}
                        className="text-start rounded-3 px-3 py-2 border w-100"
                        style={{ background: bg, borderColor: border, color, fontWeight: fw, cursor: submitted ? 'default' : 'pointer', transition: 'all 0.15s' }}
                      >
                        {opt}
                        {isAnswer && <span className="float-end">✅</span>}
                        {isSelected && !isAnswer && submitted && <span className="float-end">❌</span>}
                      </button>
                    );
                  })}
                </div>
                {submitted && isWrong && (
                  <p className="mb-0 mt-2 small" style={{ color: '#15803d' }}>✔ Correct answer: <strong>{q.answer}</strong></p>
                )}
              </div>
            );
          })}
        </div>

        {!submitted && (
          <button
            className="btn btn-success mt-4 px-4 py-2 fw-bold rounded-pill w-100"
            onClick={handleSubmit}
            disabled={Object.keys(selected).length < questions.length}
          >
            Submit Quiz
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 p-md-4 pt-md-3">
      <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-light rounded-circle shadow-sm d-lg-none"
            onClick={() => window.dispatchEvent(new Event('studybuddy:toggle-sidebar'))}
            title="Toggle sidebar"
            type="button"
          >
            <Menu size={20} />
          </button>
          <Brain size={28} className="text-primary" />
          <h2 className="fw-bold mb-0 text-dark">Ask AI</h2>
        </div>
      </div>

      <p className="text-muted mb-4 lead">
        Upload a PDF to generate notes, quizzes, summaries, or ask specific questions completely grounded in your document.
      </p>

      {error && (
        <div className="alert alert-danger rounded-3 border-0 fade show d-flex align-items-center">
          <span>{error}</span>
          {rateLimitTimer > 0 && (
            <span className="ms-auto fw-bold bg-danger text-white px-3 py-1 rounded-pill small">
              Wait {rateLimitTimer}s
            </span>
          )}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Docs & Upload */}
        <div className="col-lg-4">
          <div className="bg-white rounded-4 shadow-sm border p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FileText size={20} className="text-primary" />
              Your Documents
            </h5>

            {/* Upload Area */}
            {uploading ? (
              <div className="d-block w-100 p-4 rounded-3 border border-2 border-dashed text-center d-flex flex-column align-items-center justify-content-center mb-4" style={{ backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}>
                <Loader2 size={28} className="text-primary mb-2 spin mx-auto d-block" />
                <span className="fw-medium text-secondary">Extracting text...</span>
              </div>
            ) : (
              <div className="d-flex gap-3 mb-4">
                <label className="w-50 p-3 rounded-3 border border-2 border-dashed text-center d-flex flex-column align-items-center justify-content-center transition-all bg-light" style={{ cursor: 'pointer', borderColor: '#dee2e6' }}>
                  <FileText size={24} className="text-danger mb-2" />
                  <span className="small fw-bold text-secondary">Upload PDF</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>(Max 5MB)</span>
                  <input type="file" accept="application/pdf" className="d-none" onChange={handleFileUpload} disabled={uploading} />
                </label>

                <label className="w-50 p-3 rounded-3 border border-2 border-dashed text-center d-flex flex-column align-items-center justify-content-center bg-light" style={{ cursor: 'pointer', borderColor: '#dee2e6' }}>
                  <Presentation size={24} className="text-warning mb-2" />
                  <span className="small fw-bold text-secondary">Upload PPT</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>(Max 10MB)</span>
                  <input type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="d-none" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            )}

            {/* Doc List */}
            <div className="d-flex flex-column gap-2">
              {documents.length === 0 ? (
                <p className="text-muted text-center small mt-2">No documents uploaded yet.</p>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc._id}
                    onClick={() => { setActiveDoc(doc); setResult(''); setError(''); }}
                    className={`d-flex justify-content-between align-items-center p-3 rounded-3 border transition-all ${activeDoc?._id === doc._id ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="text-truncate" style={{ maxWidth: '80%' }}>
                      <p className={`mb-0 small fw-bold ${activeDoc?._id === doc._id ? 'text-primary' : 'text-dark'}`}>
                        {doc.fileName}
                      </p>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="btn btn-sm text-danger p-1 border-0" onClick={(e) => handleDelete(e, doc._id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Actions & Results */}
        <div className="col-lg-8">
          <div className="bg-white rounded-4 shadow-sm border p-4 h-100 d-flex flex-column">

            {!activeDoc ? (
              <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-muted">
                <FileText size={48} className="mb-3 opacity-25" />
                <h5>No Document Selected</h5>
                <p>Upload or select a document to start using AI features.</p>
              </div>
            ) : (
              <>
                <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom">
                  <div className="p-2 bg-primary bg-opacity-10 rounded text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">{activeDoc.fileName}</h5>
                    <span className="text-success small fw-medium">Active Document</span>
                  </div>
                </div>

                {/* AI Action Buttons */}
                <h6 className="fw-bold mb-3 text-secondary small text-uppercase">Presets</h6>
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <button onClick={() => handleAction('pageSummary')} className="btn btn-light border fw-medium small rounded-pill px-3 py-2 text-dark" disabled={isProcessing || rateLimitTimer > 0}>
                    <BookOpen size={16} className="me-2 text-primary" /> Summarize
                  </button>
                  <button onClick={() => handleAction('topics')} className="btn btn-light border fw-medium small rounded-pill px-3 py-2 text-dark" disabled={isProcessing || rateLimitTimer > 0}>
                    <List size={16} className="me-2 text-warning" /> Detect Topics
                  </button>
                  <button onClick={() => handleAction('topicSummary')} className="btn btn-light border fw-medium small rounded-pill px-3 py-2 text-dark" disabled={isProcessing || rateLimitTimer > 0}>
                    <List size={16} className="me-2 text-info" /> Topic Summary
                  </button>
                  <button onClick={() => handleAction('quiz')} className="btn btn-light border fw-medium small rounded-pill px-3 py-2 text-dark" disabled={isProcessing || rateLimitTimer > 0}>
                    <Brain size={16} className="me-2 text-success" /> Generate Quiz
                  </button>
                  <button onClick={() => handleAction('notes')} className="btn btn-light border fw-medium small rounded-pill px-3 py-2 text-dark" disabled={isProcessing || rateLimitTimer > 0}>
                    <Pencil size={16} className="me-2" style={{ color: '#8b5cf6' }} /> Create Notes
                  </button>
                </div>

                {/* Custom Q&A */}
                <h6 className="fw-bold mb-3 text-secondary small text-uppercase">Ask specifically</h6>
                <form onSubmit={handleAsk} className="mb-4">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control form-control-lg border-end-0 bg-light rounded-start-pill ps-4"
                      placeholder="e.g., Explain the main theory in chapter 2..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disabled={isProcessing}
                      style={{ fontSize: '15px' }}
                    />
                    <button
                      className="btn btn-primary rounded-end-pill px-4"
                      type="submit"
                      disabled={isProcessing || rateLimitTimer > 0 || !query.trim()}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>

                {/* Response Box */}
                <div className="flex-grow-1 border rounded-3 p-4 bg-light overflow-auto" style={{ minHeight: '400px', maxHeight: '75vh' }}>
                  {isProcessing ? (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                      <Loader2 size={40} className="spin mb-3 text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                      <h6 className="fw-bold text-dark mb-1">{getThinkingMessage()}</h6>
                      <p className="small mb-0 text-muted fw-medium">Elapsed time: {processingTime}s</p>
                      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
                    </div>
                  ) : quizData ? (
                    <QuizRenderer questions={quizData} />
                  ) : result ? (
                    <div className="h-100">
                      <div className="d-flex justify-content-end mb-3 sticky-top bg-light pb-2" style={{ top: '-10px', zIndex: 10 }}>
                        <button
                          className="btn btn-outline-primary fw-bold shadow-sm rounded-pill d-flex align-items-center px-3 py-2 bg-white"
                          onClick={() => setIsExpanded(true)}
                        >
                          <Maximize2 size={18} className="me-2" /> Read in Full Screen
                        </button>
                      </div>
                      <div className="text-dark markdown-body" style={{ lineHeight: '1.6' }}>
                        <ReactMarkdown>{result}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted opacity-50">
                      Results will appear here
                    </div>
                  )}
                </div>

              </>
            )}
          </div>
        </div>
      </div>

      {/* FULL SCREEN RESULT MODAL */}
      {isExpanded && result && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3 p-md-5" style={{ zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <div className="bg-white w-100 h-100 rounded-4 shadow-lg d-flex flex-column" style={{ maxWidth: '1000px' }}>
            <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top-4">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Brain size={20} className="text-primary" /> Ask AI
              </h5>
              <button className="btn btn-light border rounded-circle p-2 d-flex align-items-center" onClick={() => setIsExpanded(false)}>
                <Minimize2 size={18} />
              </button>
            </div>
            <div className="p-4 p-md-5 overflow-auto flex-grow-1 markdown-body text-dark" style={{ lineHeight: '1.7', fontSize: '16px' }}>
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AskAI;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar    from './components/Sidebar';
import Dashboard  from './pages/Dashboard';
import Analytics  from './pages/Analytics';
import Todo       from './pages/ToDo';
import Profile    from './pages/Profile';
import Settings   from './pages/Settings';
import Subjects   from './pages/Subjects';
import Login      from './pages/Login';
import Register   from './pages/Register';
import YourSpace  from './pages/YourSpace';
import AboutUs    from './pages/AboutUs';
import AskAI      from './pages/AskAI';
import GlobalCalendar from './pages/GlobalCalendar';

import { AuthProvider, useAuth }                   from './context/AuthContext';
import { TimerProvider, useTimer }                 from './context/TimerContext';
import { NotificationProvider, useNotification }   from './context/NotificationContext';
import NotificationToast                           from './components/NotificationToast';
import { API_BASE } from './lib/api';

import { Save, RotateCcw, Trash2, AlertCircle } from 'lucide-react';

const Placeholder = ({ title }) => (
  <div className="p-5 text-center">
    <h1 className="fw-bold text-dark mb-3">{title}</h1>
    <p className="text-muted lead">This feature is currently under development.</p>
    <div className="bg-white p-5 rounded-4 shadow-sm border mt-4 d-inline-block">
      <p className="mb-0 text-primary fw-bold">Coming Soon!</p>
    </div>
  </div>
);

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="d-flex min-vh-100 bg-light">
      {user && <Sidebar />}
      <main className="flex-grow-1 overflow-auto" style={{ height: '100vh' }}>
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const GlobalTimerFinishModal = () => {
  const { token } = useAuth();
  const {
    sessionEnded,
    setSessionEnded,
    getTimeStudied,
    restartSession,
    discardSession,
    mode,
    initialTime,
    elapsedTime,
  } = useTimer();
  const { notifyInfo } = useNotification();

  const formatHms = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h > 0 ? `${h}h ${m}m ${r}s` : `${m}m ${r}s`;
  };

  const handleLog = async () => {
    const studied = getTimeStudied();
    if (!studied || studied <= 0) {
      setSessionEnded(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ durationInSeconds: studied }),
      });
      if (res.ok) {
        setSessionEnded(false);
        notifyInfo(`Logged ${formatHms(studied)} to study time.`);
      } else {
        notifyInfo('Could not log session. Try again later.');
      }
    } catch (e) {
      console.error('Failed to log session:', e);
      notifyInfo('Failed to log session. Try again later.');
    }
  };

  if (!sessionEnded) return null;

  const studiedSec = getTimeStudied();
  const remainingSec = mode === 'timer' ? elapsedTime : null;
  const goalSec = mode === 'timer' ? initialTime : null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
      style={{ zIndex: 9999, backdropFilter: 'blur(6px)' }}
      onClick={() => setSessionEnded(false)}
    >
      <div
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{ width: 420, maxWidth: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <AlertCircle size={44} className="text-primary mb-2" />
          <h5 className="fw-bold mb-2">Session finished</h5>
          <p className="text-muted small mb-3">
            Time studied:{' '}
            <span className="fw-bold text-dark">{formatHms(studiedSec)}</span>
            {mode === 'timer' && (
              <>
                <br />
                Goal:{' '}
                <span className="fw-bold text-dark">{formatHms(goalSec)}</span>, Remaining:{' '}
                <span className="fw-bold text-dark">{formatHms(remainingSec)}</span>
              </>
            )}
          </p>
        </div>

        <div className="d-grid gap-2">
          <button className="btn btn-primary py-2 fw-bold rounded-3" onClick={handleLog} type="button">
            <Save className="me-2" size={18} /> Log time
          </button>
          <button className="btn btn-outline-secondary py-2 fw-bold rounded-3" onClick={restartSession} type="button">
            <RotateCcw className="me-2" size={18} /> Restart
          </button>
          <button className="btn btn-light py-2 fw-bold rounded-3 text-danger" onClick={discardSession} type="button">
            <Trash2 className="me-2" size={18} /> Discard
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <TimerProvider>
          <NotificationProvider>
            <MainLayout>
              <GlobalTimerFinishModal />
              <NotificationToast />

              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/todo" element={<ProtectedRoute><Todo /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><GlobalCalendar /></ProtectedRoute>} />
                <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
                <Route path="/space" element={<ProtectedRoute><YourSpace /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />

                <Route path="/ask-ai" element={<ProtectedRoute><AskAI /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </NotificationProvider>
        </TimerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

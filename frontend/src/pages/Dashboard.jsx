import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StudyGoalCard from '../components/StudyGoalCard';
import HabitCalendarModal from '../components/HabitCalendarModal';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { useLiveLocalDay } from '../utils/date';
import { API_BASE } from '../lib/api';

import {
  Play, Pause, Save, RotateCcw, Check, Plus, Trash2,
  Calendar, AlertCircle, Clock, Hourglass, Flame
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, YAxis
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const {
    elapsedTime, setElapsedTime,
    timerRunning, setTimerRunning,
    mode, setMode,
    initialTime, setInitialTime,
    getTimeStudied,
  } = useTimer();

  const [habits, setHabits] = useState([]);
  const [studyStats, setStudyStats] = useState({ today: '0m 0s', totalSeconds: 0, percentChange: 0 });
  const [pendingTasks, setPendingTasks] = useState(0);
  const [pendingReminders, setPendingReminders] = useState(0);
  const [reminders, setReminders] = useState([]);
  const [barData, setBarData] = useState([]);

  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [deleteHabitId, setDeleteHabitId] = useState(null);

  const [calendarHabit, setCalendarHabit] = useState(null);

  const [newHabitName, setNewHabitName] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [reminderForm, setReminderForm] = useState({ text: '', deadline: '' });
  const [timerInput, setTimerInput] = useState(60);

  const todayStr = useLiveLocalDay();

  const formatHms = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h > 0 ? `${h}h ${m}m ${r}s` : `${m}m ${r}s`;
  };

  const formatClock = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (hh > 0) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [hRes, sRes, wRes, tRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/api/habits`, { headers }),
        fetch(`${API_BASE}/api/sessions/today`, { headers }),
        fetch(`${API_BASE}/api/sessions/weekly-stats`, { headers }),
        fetch(`${API_BASE}/api/tasks`, { headers }),
        fetch(`${API_BASE}/api/reminders`, { headers }),
      ]);

      const [hData, sData, wData, tData, rData] = await Promise.all([
        hRes.json(), sRes.json(), wRes.json(), tRes.json(), rRes.json(),
      ]);

      if (hData?.success) setHabits(hData.habits || []);
      if (sData?.success) {
        setStudyStats({
          today: formatHms(sData.totalSeconds),
          totalSeconds: sData.totalSeconds,
          percentChange: sData.percentChange ?? 0,
        });
      }
      if (wData?.success) setBarData(wData.graphData || []);
      if (tData?.success) setPendingTasks(tData.pendingCount ?? 0);
      if (rData?.success) {
        setReminders(rData.reminders || []);
        setPendingReminders(rData.pendingCount ?? 0);
      }
    } catch (err) {
      console.error('Dashboard fetchData error:', err);
    }
  };

  useEffect(() => {
     
    if (token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, todayStr]);

  const startCountdown = () => {
    const minutes = Math.max(1, parseInt(timerInput || 0, 10));
    const seconds = minutes * 60;

    setMode('timer');
    setInitialTime(seconds);
    setElapsedTime(seconds);
    setTimerRunning(true);
    setShowTimerSetup(false);
  };

  const switchToStopwatch = () => {
    setTimerRunning(false);
    setMode('stopwatch');
    setInitialTime(0);
    setElapsedTime(0);
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    await fetch(`${API_BASE}/api/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newHabitName.trim() }),
    });

    setNewHabitName('');
    setShowHabitModal(false);
    fetchData();
  };

  const handleToggleHabit = async (id) => {
    await fetch(`${API_BASE}/api/habits/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleDeleteHabit = async () => {
    if (!deleteHabitId) return;
    await fetch(`${API_BASE}/api/habits/${deleteHabitId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteHabitId(null);
    fetchData();
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: newTaskText.trim(), dueDate: newTaskDueDate || null }),
    });

    setNewTaskText('');
    setNewTaskDueDate('');
    setShowTaskModal(false);
    fetchData();
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!reminderForm.text.trim() || !reminderForm.deadline) return;

    await fetch(`${API_BASE}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: reminderForm.text.trim(), deadline: reminderForm.deadline }),
    });

    setReminderForm({ text: '', deadline: '' });
    setShowReminderModal(false);
    fetchData();
  };

  const handleLogSession = async () => {
    const duration = getTimeStudied?.() ?? 0;
    if (duration <= 0) {
      setShowLogDialog(false);
      return;
    }

    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ durationInSeconds: duration }),
    });

    if (res.ok) {
      setShowLogDialog(false);
      setTimerRunning(false);

      if (mode === 'stopwatch') setElapsedTime(0);
      else setElapsedTime(initialTime || 0);

      fetchData();
      window.dispatchEvent(new Event('study-session-logged'));
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5">
        <h2 className="fw-bold mb-4 mt-3 text-dark">
          Hello, {user?.name?.split(' ')[0] || 'Student'}! 👋
        </h2>

        {/* TOP TILES */}
        <div className="row g-4 mb-4">
          {/* Tasks */}
          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="text-muted small fw-bold text-uppercase">Tasks Pending</h6>
                <button
                  className="btn btn-sm btn-light border rounded-circle shadow-sm p-2"
                  onClick={() => setShowTaskModal(true)}
                  title="Add task"
                  type="button"
                >
                  <Plus size={16} className="text-primary" />
                </button>
              </div>
              <h1 className="fw-bold my-3 display-5">{pendingTasks}</h1>
              <span className="text-primary small fw-bold" style={{ cursor: 'pointer' }} onClick={() => navigate('/todo')}>
                View full list &rarr;
              </span>
            </div>
          </div>

          {/* Reminders */}
          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="text-muted small fw-bold text-uppercase">Reminders</h6>
                <button
                  className="btn btn-sm btn-light border rounded-circle shadow-sm p-2"
                  onClick={() => setShowReminderModal(true)}
                  title="Add reminder"
                  type="button"
                >
                  <Calendar size={16} className="text-danger" />
                </button>
              </div>
              <h1 className="fw-bold my-3 display-5 text-danger">{pendingReminders}</h1>
              <span className="text-danger small fw-bold" style={{ cursor: 'pointer' }} onClick={() => navigate('/todo')}>
                Check deadlines &rarr;
              </span>
            </div>
          </div>

          {/* Study Today */}
          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
              <h6 className="text-muted small fw-bold text-uppercase">Study Today</h6>
              <h1 className="fw-bold text-primary my-3 display-6">{studyStats.today}</h1>
              <p className={`small mb-0 fw-bold ${studyStats.percentChange >= 0 ? 'text-success' : 'text-danger'}`}>
                {studyStats.percentChange >= 0 ? '▲' : '▼'} {Math.abs(studyStats.percentChange)}% vs yesterday
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 shadow-sm border h-100 text-center d-flex flex-column justify-content-center align-items-center position-relative">
              {/* Mode switch */}
              <div className="position-absolute top-0 end-0 p-3 d-flex gap-2">
                <button
                  type="button"
                  className={`btn btn-sm rounded-circle p-1 border-0 ${mode === 'stopwatch' ? 'bg-primary text-white' : 'text-muted'}`}
                  onClick={switchToStopwatch}
                  title="Stopwatch"
                >
                  <Clock size={16} />
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-circle p-1 border-0 ${mode === 'timer' ? 'bg-primary text-white' : 'text-muted'}`}
                  onClick={() => { setTimerRunning(false); setShowTimerSetup(true); }}
                  title="Countdown"
                >
                  <Hourglass size={16} />
                </button>
              </div>

              <h6 className="text-muted small fw-bold text-uppercase mb-2">
                {mode === 'stopwatch' ? 'Stopwatch' : 'Countdown'}
              </h6>

              <div className={`h1 fw-bold mb-3 font-monospace ${mode === 'timer' && elapsedTime <= 300 ? 'text-danger' : 'text-dark'}`}>
                {formatClock(elapsedTime)}
              </div>

              <button
                type="button"
                className={`btn btn-lg rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2 ${timerRunning ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => {
                  if (mode === 'timer' && elapsedTime === 0) { setShowTimerSetup(true); return; }
                  if (timerRunning) { setTimerRunning(false); setShowLogDialog(true); }
                  else setTimerRunning(true);
                }}
              >
                {timerRunning ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                <span className="fw-bold small">{timerRunning ? 'PAUSE' : 'START'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Study Goal Card */}
        <div className="mb-4">
          <StudyGoalCard />
        </div>

        {/* GRAPH + HABITS */}
        <div className="row g-4">
          {/* Graph */}
          <div className="col-lg-8">
            <div className="bg-white p-4 rounded-4 shadow-sm border" style={{ minHeight: 430 }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Study Activity (Last 7 Days)</h6>
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      height={60}
                      tick={({ x, y, payload }) => (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={10} dy={16} textAnchor="middle" fill="#374151" fontSize={12} fontWeight="bold">
                            {payload.value}
                          </text>
                          <text x={0} y={30} dy={16} textAnchor="middle" fill="#9ca3af" fontSize={11}>
                            {barData[payload.index]?.date}
                          </text>
                        </g>
                      )}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      content={({ active, payload }) =>
                        active && payload && payload.length ? (
                          <div className="bg-dark text-white p-2 px-3 rounded-3 shadow-sm small">
                            <div className="fw-bold">{payload[0].payload.day} • {payload[0].payload.date}</div>
                            <div className="text-light">{formatHms(payload[0].payload.rawSeconds)}</div>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={40}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={i === barData.length - 1 ? '#6366f1' : '#e0e7ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Habits */}
          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
              <div className="d-flex justify-content-between mb-3 align-items-center">
                <h6 className="fw-bold mb-0">Daily Habits</h6>
                <button
                  type="button"
                  className="btn btn-sm btn-light border rounded-circle shadow-sm p-2"
                  onClick={() => setShowHabitModal(true)}
                  title="Add habit"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {habits.length === 0 ? (
                  <p className="text-muted small text-center my-4">No habits yet. Click + to add one.</p>
                ) : (
                  habits.map(h => (
                    <div
                      key={h._id}
                      className="d-flex justify-content-between align-items-center p-3 border rounded-4"
                      style={{ backgroundColor: h.completedToday ? '#f0fdf4' : '#fafafa' }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-bold small text-dark text-truncate">
                          {h.emoji} {h.name}
                        </div>
                        <div
                          className="d-flex align-items-center gap-1 mt-1"
                          style={{ cursor: 'pointer' }}
                          title="View in Global Calendar"
                          onClick={() => navigate('/calendar')}
                        >
                          <Flame size={13} style={{ color: h.streak > 0 ? '#ea580c' : '#9ca3af' }} />
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: '12px',
                              color: h.streak > 0 ? '#ea580c' : '#9ca3af',
                              textDecoration: 'underline dotted',
                            }}
                          >
                            {h.streak} day streak
                          </span>
                        </div>
                      </div>

                      <div className="d-flex gap-2 align-items-center ms-2">
                        <button
                          type="button"
                          className={`btn btn-sm rounded-circle shadow-sm ${h.completedToday ? 'btn-success' : 'btn-outline-secondary'}`}
                          onClick={() => handleToggleHabit(h._id)}
                          title={h.completedToday ? 'Mark undone' : 'Mark done'}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm text-danger border-0 bg-transparent"
                          onClick={() => setDeleteHabitId(h._id)}
                          title="Delete habit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Calendar Modal */}
      {calendarHabit && (
        <HabitCalendarModal habit={calendarHabit} onClose={() => setCalendarHabit(null)} />
      )}

      {/* TIMER SETUP MODAL */}
      {showTimerSetup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg text-center" style={{ width: 360 }}>
            <Hourglass size={44} className="text-primary mb-2" />
            <h5 className="fw-bold mb-3">Set Countdown</h5>

            <label className="text-muted small fw-bold mb-2">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              className="form-control form-control-lg text-center fw-bold rounded-3 mb-3"
              value={timerInput}
              onChange={e => setTimerInput(e.target.value)}
              autoFocus
            />

            <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
              {[15, 30, 45, 60, 90, 120].map(m => (
                <button key={m} type="button" className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setTimerInput(m)}>
                  {m}m
                </button>
              ))}
            </div>

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-primary flex-grow-1 py-2 fw-bold rounded-3" onClick={startCountdown}>
                Start
              </button>
              <button type="button" className="btn btn-light py-2 px-3 rounded-3" onClick={() => setShowTimerSetup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG MODAL */}
      {showLogDialog && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg text-center" style={{ width: 380 }}>
            <h5 className="fw-bold mb-2">
              Log {formatHms(getTimeStudied?.() ?? 0)}?
            </h5>
            <p className="text-muted small mb-4">
              {mode === 'timer'
                ? 'You stopped the countdown. You can log the time studied or reset.'
                : 'You paused the stopwatch. Log your focused time?'}
            </p>
            <div className="d-grid gap-2">
              <button type="button" className="btn btn-primary py-2 fw-bold" onClick={handleLogSession}>
                <Save className="me-2" size={18} /> Log Session
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary py-2"
                onClick={() => {
                  setShowLogDialog(false);
                  setTimerRunning(false);
                  if (mode === 'stopwatch') setElapsedTime(0);
                  else setElapsedTime(initialTime || 0);
                }}
              >
                <RotateCcw className="me-2" size={18} /> Reset
              </button>
              <button
                type="button"
                className="btn btn-light py-2"
                onClick={() => {
                  setShowLogDialog(false);
                  setTimerRunning(true);
                }}
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD HABIT MODAL */}
      {showHabitModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: 380 }}>
            <h5 className="fw-bold mb-3">New Habit</h5>
            <form onSubmit={handleAddHabit}>
              <input
                className="form-control rounded-3 mb-3 py-3 bg-light border-0"
                placeholder="e.g., Read 30 mins"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                autoFocus
                required
              />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1 py-2 fw-bold rounded-3">
                  Create
                </button>
                <button type="button" className="btn btn-light py-2 px-3 rounded-3" onClick={() => setShowHabitModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showTaskModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: 380 }}>
            <h5 className="fw-bold mb-3">Add Task</h5>
            <form onSubmit={handleAddTask}>
              <input
                className="form-control rounded-3 mb-3 py-3 bg-light border-0"
                placeholder="e.g., Finish DSA sheet"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                autoFocus
                required
              />
              <input
                type="date"
                className="form-control rounded-3 mb-3 py-3 bg-light border-0 text-muted"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                title="Due Date (optional)"
              />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1 py-2 fw-bold rounded-3">
                  Add
                </button>
                <button type="button" className="btn btn-light py-2 px-3 rounded-3" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD REMINDER MODAL */}
      {showReminderModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: 380 }}>
            <h5 className="fw-bold mb-3">Set Reminder</h5>
            <form onSubmit={handleAddReminder}>
              <input
                className="form-control rounded-3 mb-3 py-3 bg-light border-0"
                placeholder="e.g., Submit assignment"
                value={reminderForm.text}
                onChange={(e) => setReminderForm({ ...reminderForm, text: e.target.value })}
                autoFocus
                required
              />
              <input
                type="datetime-local"
                min={todayStr + "T00:00"}
                className="form-control rounded-3 mb-3 py-3 bg-light border-0"
                value={reminderForm.deadline}
                onChange={(e) => setReminderForm({ ...reminderForm, deadline: e.target.value })}
                required
              />
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1 py-2 fw-bold rounded-3">
                  Save
                </button>
                <button type="button" className="btn btn-light py-2 px-3 rounded-3" onClick={() => setShowReminderModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE HABIT MODAL */}
      {deleteHabitId && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg text-center" style={{ width: 350 }}>
            <AlertCircle size={48} className="text-danger mb-2" />
            <h5 className="fw-bold mb-2">Delete habit?</h5>
            <p className="text-muted small mb-3">This action can’t be undone.</p>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-danger flex-grow-1 py-2 fw-bold rounded-3" onClick={handleDeleteHabit}>
                Delete
              </button>
              <button type="button" className="btn btn-light py-2 px-3 rounded-3" onClick={() => setDeleteHabitId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

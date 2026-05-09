import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveLocalDay } from '../utils/date';
import { useNotification } from '../context/NotificationContext';
import {
  Target,
  Flame,
  CheckCircle,
  CalendarDays,
  Timer,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const StudyGoalCard = () => {
  const { token } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const today = useLiveLocalDay();

  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    setSelectedDate((prev) => (prev === today ? today : prev));
  }, [today]);

  const [goal, setGoal] = useState(null);
  const [loggedSeconds, setLoggedSeconds] = useState(0);

  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [inputH, setInputH] = useState('');
  const [inputM, setInputM] = useState('');

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [goalDates, setGoalDates] = useState(new Set());

  const formatTime = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const ordinal = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };

  const prettyDate = (yyyyMmDd) => {
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    const day = ordinal(d.getDate());
    const month = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(d);
    return `${day} ${month}`;
  };

  const fetchForDate = useCallback(async (dateStr, { silent = false } = {}) => {
    if (!token) return;

    if (!silent) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [gRes, sRes] = await Promise.all([
        fetch(`http://localhost:5000/api/daily-goal/day?date=${dateStr}`, { headers }),
        fetch('http://localhost:5000/api/daily-goal/streak', { headers }),
      ]);

      const [gData, sData] = await Promise.all([gRes.json(), sRes.json()]);

      if (gData?.success) {
        setGoal(gData.goal);
        setLoggedSeconds(gData.loggedSeconds ?? 0);
      } else {
        setGoal(null);
        setLoggedSeconds(0);
      }

      if (sData?.success) {
        setStreak(sData.streak ?? 0);
        setLongestStreak(sData.longestStreak ?? 0);
      } else {
        setStreak(0);
        setLongestStreak(0);
      }
    } catch (err) {
      console.error('StudyGoalCard fetch error:', err);
      notifyError('Failed to load goal.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, notifyError]);

  const fetchMonthGoals = useCallback(async (month, year) => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`http://localhost:5000/api/daily-goal/month?month=${month}&year=${year}`, { headers });
      const data = await res.json();
      if (data?.success) setGoalDates(new Set(data.dates || []));
      else setGoalDates(new Set());
    } catch (err) {
      console.error('fetchMonthGoals error:', err);
      setGoalDates(new Set());
    }
  }, [token]);

  useEffect(() => {
    fetchForDate(selectedDate);
  }, [selectedDate, fetchForDate]);

  useEffect(() => {
    if (selectedDate === today) fetchForDate(today, { silent: true });
  }, [today, selectedDate, fetchForDate]);

  useEffect(() => {
    const onLogged = () => fetchForDate(selectedDate, { silent: true });

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') fetchForDate(selectedDate, { silent: true });
    };

    window.addEventListener('study-session-logged', onLogged);
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      window.removeEventListener('study-session-logged', onLogged);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [fetchForDate, selectedDate]);

  useEffect(() => {
    if (showCalendar) fetchMonthGoals(calMonth, calYear);
  }, [showCalendar, calMonth, calYear, fetchMonthGoals]);

  const handleSaveGoal = async (e) => {
    e.preventDefault();

    const h = parseInt(inputH || '0', 10) || 0;
    const m = parseInt(inputM || '0', 10) || 0;
    const sec = h * 3600 + m * 60;

    if (!selectedDate) {
      notifyError('Please select a date.');
      return;
    }
    if (selectedDate < today) {
      notifyError('You can’t set a goal for a past date.');
      return;
    }
    if (sec <= 0) {
      notifyError('Please enter a valid goal (at least 1 minute).');
      return;
    }

    try {
      setBusy(true);
      setLoading(true);

      const res = await fetch('http://localhost:5000/api/daily-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ goalSeconds: sec, targetDate: selectedDate }),
      });

      const data = await res.json();
      if (!data?.success) {
        notifyError(data?.message || 'Failed to save goal.');
        return;
      }

      notifySuccess(goal ? 'Goal updated!' : 'Goal set!');
      setInputH('');
      setInputM('');

      await fetchForDate(selectedDate, { silent: true });
      if (showCalendar) fetchMonthGoals(calMonth, calYear);
    } catch (err) {
      console.error(err);
      notifyError('Network error.');
    } finally {
      setBusy(false);
      setLoading(false);
    }
  };

  const hasGoal = !!goal && goal.goalSeconds > 0;
  const percent = hasGoal ? Math.min(100, Math.round((loggedSeconds / goal.goalSeconds) * 100)) : 0;

  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(calMonth).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${calYear}-${mm}-${dd}`;
    cells.push({
      day: d,
      dateStr,
      isPast: dateStr < today,
      isSelected: dateStr === selectedDate,
      isToday: dateStr === today,
      hasGoal: goalDates.has(dateStr),
    });
  }

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  return (
    <div className="bg-white rounded-4 shadow-sm border p-4 position-relative">
      {loading && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)', zIndex: 5 }}
        >
          <div className="d-flex align-items-center gap-2 bg-white border shadow-sm rounded-pill px-3 py-2">
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
            <span className="small fw-bold text-muted">Updating...</span>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3" style={{ position: 'relative', zIndex: 1 }}>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-10 p-2 rounded-3">
            <Target size={20} className="text-primary" />
          </div>
          <div>
            <h6 className="fw-bold mb-0">Study Goal</h6>
            <small className="text-muted">
              {selectedDate === today ? "Today's target & progress" : `Target for ${prettyDate(selectedDate)}`}
            </small>
          </div>
        </div>

        {streak > 0 && (
          <div
            className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill fw-bold"
            style={{ backgroundColor: '#fff7ed', color: '#ea580c', fontSize: '13px' }}
          >
            <Flame size={16} /> {streak} day{streak !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="row g-3 align-items-start" style={{ position: 'relative', zIndex: 1 }}>
        <div className="col-lg-7">
          <div className="p-3 rounded-4 border" style={{ background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                  Progress
                </div>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <div className="fw-bold" style={{ fontSize: '26px', color: '#111827' }}>
                    {formatTime(loggedSeconds)}
                  </div>
                  <div className="text-muted small">
                    of <span className="fw-bold text-dark">{hasGoal ? formatTime(goal.goalSeconds) : '0m'}</span>
                  </div>
                </div>
              </div>

              {hasGoal && goal?.achieved && (
                <span
                  className="badge rounded-pill px-3 py-2"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.25)',
                    fontWeight: 800
                  }}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    <CheckCircle size={14} /> Achieved
                  </span>
                </span>
              )}
            </div>

            <div className="progress rounded-pill mb-2" style={{ height: '10px', backgroundColor: '#eef2ff' }}>
              <div
                className="progress-bar rounded-pill"
                style={{
                  width: `${percent}%`,
                  background: hasGoal && goal?.achieved
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                    : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold" style={{ fontSize: '13px', color: hasGoal && goal?.achieved ? '#10b981' : '#6366f1' }}>
                {percent}% complete
              </span>
              {longestStreak > 0 && (
                <span className="text-muted" style={{ fontSize: '11px' }}>
                  🏆 Best streak: <strong>{longestStreak} days</strong>
                </span>
              )}
            </div>

            {!hasGoal && (
              <div className="mt-2 small fw-bold" style={{ color: '#ef4444' }}>
                No goal set for {prettyDate(selectedDate)}.
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <form onSubmit={handleSaveGoal} className="p-3 rounded-4 border shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-white border rounded-3 p-2">
                  <CalendarDays size={18} className="text-primary" />
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: '14px' }}>
                    {hasGoal ? 'Update goal' : 'Set goal'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    Pick a day from calendar
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-light rounded-pill px-3 fw-bold"
                onClick={() => setShowCalendar(true)}
                disabled={busy}
                title="Select date"
              >
                {prettyDate(selectedDate)}
              </button>
            </div>

            <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '11px' }}>
              DURATION
            </label>
            <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
              <div className="input-group input-group-sm" style={{ width: '120px' }}>
                <span className="input-group-text bg-white border-0 rounded-start-3">
                  <Timer size={16} className="text-muted" />
                </span>
                <input
                  type="number"
                  className="form-control bg-white border-0"
                  placeholder="0"
                  min="0"
                  max="23"
                  value={inputH}
                  onChange={(e) => setInputH(e.target.value)}
                  disabled={busy}
                />
                <span className="input-group-text bg-white border-0 rounded-end-3 text-muted">h</span>
              </div>

              <div className="input-group input-group-sm" style={{ width: '120px' }}>
                <span className="input-group-text bg-white border-0 rounded-start-3">
                  <Timer size={16} className="text-muted" />
                </span>
                <input
                  type="number"
                  className="form-control bg-white border-0"
                  placeholder="30"
                  min="0"
                  max="59"
                  value={inputM}
                  onChange={(e) => setInputM(e.target.value)}
                  disabled={busy}
                />
                <span className="input-group-text bg-white border-0 rounded-end-3 text-muted">m</span>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-sm w-100 fw-bold rounded-3 py-2 ${hasGoal ? 'btn-outline-primary' : 'btn-primary'}`}
              disabled={busy}
            >
              {busy ? 'Saving...' : (hasGoal ? 'Update Goal' : 'Set Goal')}
            </button>

            <div className="text-muted small mt-2" style={{ fontSize: '11px' }}>
              Dates with a goal are highlighted in the calendar.
            </div>
          </form>
        </div>
      </div>

      {showCalendar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCalendar(false)}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{ width: '420px', maxWidth: '95vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0">Pick a date</h6>
                <small className="text-muted">Highlighted days already have goals</small>
              </div>
              <button className="btn btn-sm btn-light rounded-circle border-0" onClick={() => setShowCalendar(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <button className="btn btn-sm btn-light rounded-circle" onClick={prevMonth} type="button">
                <ChevronLeft size={18} />
              </button>
              <span className="fw-bold">
                {MONTHS[calMonth - 1]} {calYear}
              </span>
              <button className="btn btn-sm btn-light rounded-circle" onClick={nextMonth} type="button">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="d-grid mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', display: 'grid' }}>
              {DAYS.map(d => (
                <div key={d} className="text-center text-muted fw-bold" style={{ fontSize: '11px', padding: '4px 0' }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {cells.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} />;

                const baseBg = cell.isSelected
                  ? '#6366f1'
                  : cell.hasGoal
                  ? '#8b5cf6'
                  : cell.isToday
                  ? '#f3f4f6'
                  : 'transparent';

                const baseColor = cell.isSelected || cell.hasGoal
                  ? '#fff'
                  : cell.isPast
                  ? '#d1d5db'
                  : '#374151';

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    className="rounded-3 fw-bold border-0"
                    disabled={cell.isPast}
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      setShowCalendar(false);
                    }}
                    style={{
                      height: '38px',
                      fontSize: '13px',
                      backgroundColor: baseBg,
                      color: baseColor,
                      cursor: cell.isPast ? 'not-allowed' : 'pointer',
                      opacity: cell.isPast ? 0.4 : 1,
                      outline: cell.hasGoal && !cell.isSelected ? '2px solid rgba(99,102,241,0.25)' : 'none',
                    }}
                    title={cell.hasGoal ? 'Goal already set' : 'No goal set'}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-top d-flex justify-content-between">
              <span className="text-muted small">
                Selected: <strong>{prettyDate(selectedDate)}</strong>
              </span>
              <span className="text-muted small">
                Legend: <span className="fw-bold" style={{ color: '#8b5cf6' }}>Goal set</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGoalCard;

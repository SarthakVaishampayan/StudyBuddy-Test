import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { yyyyMmDdLocal } from '../utils/date';
import { API_BASE } from '../lib/api';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const HabitCalendarModal = ({ habit, onClose }) => {
  const { token } = useAuth();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [completedDates, setCompletedDates] = useState([]);
  const [loading, setLoading] = useState(false);

  const todayStr = yyyyMmDdLocal();

  useEffect(() => {
    if (!habit) return;
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `${API_BASE}/api/habits/${habit._id}/calendar?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) setCompletedDates(data.completedDates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [habit, month, year, token]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const daysInMonth  = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const mm   = String(month).padStart(2, '0');
    const dd   = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    cells.push({
      day:       d,
      dateStr,
      completed: completedDates.includes(dateStr),
      isToday:   dateStr === todayStr,
      isFuture:  dateStr > todayStr,
    });
  }

  const completedCount = completedDates.length;
  const completionRate = daysInMonth > 0
    ? Math.round((completedCount / daysInMonth) * 100)
    : 0;

  const currentYm = new Date().getFullYear() * 12 + (new Date().getMonth() + 1);
  const selectedYm = year * 12 + month;
  const disableNext = selectedYm >= currentYm;

  if (!habit) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-lg p-4"
        style={{ width: '420px', maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '24px' }}>{habit.emoji}</span>
            <div>
              <h6 className="fw-bold mb-0">{habit.name}</h6>
              <small className="text-muted">Habit Calendar</small>
            </div>
          </div>
          <button
            className="btn btn-sm btn-light rounded-circle border-0"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="btn btn-sm btn-light rounded-circle" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <span className="fw-bold">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            className="btn btn-sm btn-light rounded-circle"
            onClick={nextMonth}
            disabled={disableNext}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="d-grid mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', display: 'grid' }}>
          {DAYS.map((d) => (
            <div key={d} className="text-center text-muted fw-bold" style={{ fontSize: '11px', padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} />;
              return (
                <div
                  key={cell.dateStr}
                  className="d-flex align-items-center justify-content-center rounded-3 fw-bold"
                  style={{
                    height: '38px',
                    fontSize: '13px',
                    backgroundColor: cell.completed
                      ? habit.color
                      : cell.isToday
                      ? '#f3f4f6'
                      : 'transparent',
                    color: cell.completed
                      ? '#fff'
                      : cell.isToday
                      ? '#111'
                      : cell.isFuture
                      ? '#d1d5db'
                      : '#374151',
                    border: cell.isToday && !cell.completed
                      ? `2px solid ${habit.color}`
                      : '2px solid transparent',
                    opacity: cell.isFuture ? 0.4 : 1,
                  }}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
          <div className="text-center">
            <div className="fw-bold fs-5" style={{ color: habit.color }}>{completedCount}</div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Days Completed</div>
          </div>
          <div className="text-center">
            <div className="fw-bold fs-5" style={{ color: habit.color }}>{completionRate}%</div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="fw-bold fs-5" style={{ color: habit.color }}>{daysInMonth - completedCount}</div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Days Missed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitCalendarModal;

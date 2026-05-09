import { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
});

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '< 1 min';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

const GlobalCalendar = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_BASE}/api/calendar`, { headers });
        const data = await res.json();

        if (data.success) {
          const formattedEvents = data.events.map(ev => ({
            ...ev,
            start: new Date(ev.start),
            end: new Date(ev.end),
          }));
          setEvents(formattedEvents);

          const reminderEvents = data.events.filter(ev => ev.type === 'reminder').map(ev => ({
            _id: ev.id,
            text: ev.title.replace('[Reminder] ', ''),
            deadline: ev.start,
            completed: false
          }));
          setReminders(reminderEvents);
        }
      } catch (error) {
        console.error('Failed to load calendar events', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchCalendar();
  }, [token]);

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || '#3174ad',
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '2px 5px',
        fontWeight: 'bold',
        fontSize: '12px',
        maxWidth: 'fit-content',
      }
    };
  };

  const generateTooltipForDate = useCallback((date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEvents = events.filter(e => {
      const eStart = new Date(e.start);
      return eStart >= dayStart && eStart <= dayEnd;
    });

    if (dayEvents.length === 0) return 'No events for this day.';

    const habits = dayEvents.filter(e => e.type === 'habit');
    const tasks = dayEvents.filter(e => e.type === 'task');
    const sessions = dayEvents.filter(e => e.type === 'session');
    const rems = dayEvents.filter(e => e.type === 'reminder');
    const goals = dayEvents.filter(e => e.type === 'dailyGoal');

    let tip = `📅 ${format(date, 'MMM d, yyyy')}\n`;
    if (habits.length > 0) tip += `\n🌟 Habits:\n` + habits.map(h => ` • ${h.title} (${format(new Date(h.start), 'h:mm a')})`).join('\n');
    if (tasks.length > 0) tip += `\n📝 Tasks:\n` + tasks.map(t => ` • ${t.title.replace('[Task] ', '')} ${t.completed ? '✅' : '⏳'}`).join('\n');
    if (sessions.length > 0) tip += `\n⏱️ Study:\n` + sessions.map(s => ` • ${s.title.replace('[Study] ', '')} – ${formatDuration(s.duration)} at ${format(new Date(s.start), 'h:mm a')}`).join('\n');
    if (rems.length > 0) tip += `\n⏰ Reminders:\n` + rems.map(r => ` • ${r.title.replace('[Reminder] ', '')} at ${format(new Date(r.start), 'h:mm a')}`).join('\n');
    if (goals.length > 0) tip += `\n🎯 Goal:\n` + goals.map(g => ` • ${g.title.replace('Daily Goal: ', '')}`).join('\n');

    return tip;
  }, [events]);

  const dayPropGetter = (date) => ({
    title: generateTooltipForDate(date),
  });

  const handleDrillDown = useCallback((date) => {
    setCurrentDate(date);
    setCurrentView('day');
  }, []);

  const components = {
    month: {
      dateHeader: ({ date, label }) => (
        <div
          className="cal-date-header"
          title={`Click to expand ${format(date, 'MMM d')} · ` + generateTooltipForDate(date)}
          onClick={(e) => { e.stopPropagation(); handleDrillDown(date); }}
        >
          <span className="cal-date-num">{label}</span>
        </div>
      ),
    },
  };

  const getTypeLabel = (type) => {
    const labels = {
      habit: '🌟 Habit',
      task: '📝 Task',
      session: '⏱️ Study Session',
      reminder: '⏰ Reminder',
      dailyGoal: '🎯 Daily Goal',
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5 h-100">
        <h2 className="fw-bold mb-4 mt-3 text-dark">Global Calendar</h2>

        <div className="bg-white p-4 rounded-4 shadow-sm border" style={{ height: '80vh' }}>
          {loading ? (
            <div className="w-100 h-100 d-flex justify-content-center align-items-center">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              view={currentView}
              onView={(view) => setCurrentView(view)}
              views={['month', 'week', 'day']}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              components={components}
              step={15}
              timeslots={4}
              dayLayoutAlgorithm="no-overlap"
              popup
              onDrillDown={handleDrillDown}
              onSelectEvent={(event) => setSelectedEvent(event)}
              tooltipAccessor={(event) => generateTooltipForDate(event.start)}
            />
          )}
        </div>
      </div>

      {selectedEvent && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}
          onClick={() => setSelectedEvent(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div
                style={{
                  height: '6px',
                  borderRadius: '16px 16px 0 0',
                  background: selectedEvent.color || '#6366f1',
                }}
              />
              <div className="modal-header border-bottom-0 px-4 pt-3 pb-0">
                <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: selectedEvent.color, color: '#fff', fontSize: '13px' }}>
                  {getTypeLabel(selectedEvent.type)}
                </span>
                <button type="button" className="btn-close" onClick={() => setSelectedEvent(null)} />
              </div>
              <div className="modal-body px-4 py-3">
                <h5 className="fw-bold text-dark mb-3">{selectedEvent.title}</h5>
                <table className="table table-borderless mb-0" style={{ fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td className="fw-semibold text-muted" style={{ width: '110px' }}>📅 Date</td>
                      <td>{format(selectedEvent.start, 'EEEE, MMM d, yyyy')}</td>
                    </tr>
                    {!selectedEvent.allDay && (
                      <tr>
                        <td className="fw-semibold text-muted">🕐 Time</td>
                        <td>{format(selectedEvent.start, 'h:mm a')}</td>
                      </tr>
                    )}
                    {selectedEvent.type === 'session' && (
                      <tr>
                        <td className="fw-semibold text-muted">⏱️ Duration</td>
                        <td>{formatDuration(selectedEvent.duration)}</td>
                      </tr>
                    )}
                    {selectedEvent.type === 'task' && (
                      <tr>
                        <td className="fw-semibold text-muted">📋 Status</td>
                        <td>
                          <span className={`badge ${selectedEvent.completed ? 'bg-success' : 'bg-warning text-dark'} rounded-pill px-3`}>
                            {selectedEvent.completed ? '✅ Completed' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer border-top-0 px-4 pb-3 pt-0">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setSelectedEvent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalCalendar;

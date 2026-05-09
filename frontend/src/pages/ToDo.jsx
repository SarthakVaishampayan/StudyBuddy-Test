import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, Circle, Plus, Trash2, Calendar
} from 'lucide-react';
import { API_BASE } from '../lib/api';

const Todo = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchAllData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [tRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/api/tasks`, { headers }),
        fetch(`${API_BASE}/api/reminders`, { headers }),
      ]);
      const [tData, rData] = await Promise.all([tRes.json(), rRes.json()]);
      if (tData.success) setTasks(tData.tasks);
      if (rData.success) setReminders(rData.reminders);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
     
    if (token) fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: input, dueDate: dueDate || null }),
    });
    setInput('');
    setDueDate('');
    fetchAllData();
  };

  const deleteTask = async (id) => {
    await fetch(`${API_BASE}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAllData();
  };

  const deleteReminder = async (id) => {
    await fetch(`${API_BASE}/api/reminders/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAllData();
  };

  const toggleTask = async (id) => {
    await fetch(`${API_BASE}/api/tasks/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAllData();
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />
      <div className="p-4 px-lg-5">
        <h2 className="fw-bold mb-4 mt-3">Tasks & Deadlines</h2>

        <div className="row g-4">
          {/* TASK LIST SECTION */}
          <div className="col-lg-7">
            <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <CheckCircle2 className="text-primary" /> Daily Tasks
              </h5>
              <form onSubmit={addTask} className="d-flex flex-wrap gap-2 mb-4">
                <input
                  className="form-control rounded-3 py-2 flex-grow-1"
                  style={{ minWidth: '200px' }}
                  placeholder="Add a new task..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <input
                  type="date"
                  className="form-control rounded-3 py-2 text-muted"
                  style={{ width: 'auto' }}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  title="Due Date (optional)"
                />
                <button type="submit" className="btn btn-primary px-3 rounded-3">
                  <Plus />
                </button>
              </form>
              <div className="d-flex flex-column gap-2 mb-4">
                {pending.map((t) => (
                  <div
                    key={t._id}
                    className="d-flex justify-content-between p-3 border rounded-4 bg-light bg-opacity-10 align-items-center cursor-pointer"
                    onClick={() => toggleTask(t._id)}
                  >
                    <div className="d-flex gap-3 align-items-center">
                      <Circle className="text-muted" size={20} />
                      <span className="fw-medium">{t.text}</span>
                    </div>
                    <button
                      className="btn btn-sm text-danger border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(t._id);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              {completed.length > 0 && (
                <div className="p-2 border-top">
                  <span className="text-muted small fw-bold">
                    COMPLETED ({completed.length})
                  </span>
                  <div className="d-flex flex-column gap-2 mt-2 opacity-75">
                    {completed.map((t) => (
                      <div
                        key={t._id}
                        className="d-flex justify-content-between p-3 border rounded-4 bg-light align-items-center cursor-pointer"
                        onClick={() => toggleTask(t._id)}
                      >
                        <div className="d-flex gap-3 align-items-center">
                          <CheckCircle2 className="text-success" size={20} />
                          <span className="text-decoration-line-through">
                            {t.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* REMINDERS/DEADLINES SECTION */}
          <div className="col-lg-5">
            <div className="bg-white p-4 rounded-4 shadow-sm border">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-danger">
                <Calendar /> Deadlines
              </h5>
              {reminders.length === 0 ? (
                <p className="text-muted small">No active reminders.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {reminders.map((r) => {
                    const isOverdue =
                      new Date(r.deadline).getTime() < todayStart.getTime();
                    return (
                      <div
                        key={r._id}
                        className={`p-3 border rounded-4 ${
                          isOverdue
                            ? 'bg-danger bg-opacity-10 border-danger'
                            : 'bg-light'
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div
                              className={`fw-bold ${
                                isOverdue ? 'text-danger' : ''
                              }`}
                            >
                              {r.text}
                            </div>
                            <div className="small text-muted d-flex align-items-center gap-1 mt-1">
                              <Calendar size={14} />{' '}
                              {new Date(r.deadline).toLocaleDateString(
                                undefined,
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </div>
                          </div>
                          <button
                            className="btn btn-sm text-danger p-0"
                            onClick={() => deleteReminder(r._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Todo;

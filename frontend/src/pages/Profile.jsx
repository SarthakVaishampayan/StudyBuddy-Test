import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  User, Mail, Calendar, Trophy,
  Clock, CheckSquare
} from 'lucide-react';
import { API_BASE } from '../lib/api';

const Profile = () => {
  const { user, token } = useAuth();
  const { notifyError } = useNotification();

  const [statsLoading, setStatsLoading] = useState(true);
  const [reminders, setReminders]       = useState([]);

  const [stats, setStats] = useState({
    totalStudySeconds: 0,
    tasksCompleted:    0,
    streakDays:        0,
    habitsCount:       0,
  });

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [wRes, tRes, hRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/api/sessions/weekly-stats`, { headers }),
          fetch(`${API_BASE}/api/tasks`,     { headers }),
          fetch(`${API_BASE}/api/habits`,    { headers }),
          fetch(`${API_BASE}/api/reminders`, { headers }),
        ]);

        const [wData, tData, hData, rData] = await Promise.all([
          wRes.json(), tRes.json(), hRes.json(), rRes.json(),
        ]);

        let totalSec   = 0;
        let streakDays = 0;

        if (wData?.success) {
          totalSec   = wData.graphData.reduce((acc, d) => acc + d.rawSeconds, 0);
          streakDays = wData.graphData.filter(d => d.rawSeconds > 0).length;
        }

        setStats({
          totalStudySeconds: totalSec,
          tasksCompleted:    tData?.success ? tData.tasks.filter(t => t.completed).length : 0,
          streakDays,
          habitsCount:       hData?.success ? hData.habits.length : 0,
        });

        if (rData?.success) setReminders(rData.reminders);
      } catch (err) {
        console.error('Profile stats fetch failed:', err);
        notifyError('Failed to load profile stats.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const formatStudyTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!user) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5">
        <h2 className="fw-bold mb-4 mt-3">My Profile</h2>

        <div className="row g-4">
          {/* Left Column — ID Card */}
          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border text-center">
              {/* Avatar */}
              <div
                className="bg-primary bg-opacity-10 rounded-circle border border-primary border-opacity-25 d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: '110px', height: '110px' }}
              >
                <User size={54} className="text-primary" />
              </div>

              <h4 className="fw-bold mb-1">{user.name}</h4>
              <p className="text-muted small mb-4">Student · StudyBuddy</p>

              {/* Info rows */}
              <div className="d-flex flex-column gap-3 text-start px-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-circle flex-shrink-0">
                    <Mail size={16} className="text-secondary" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="text-muted" style={{ fontSize: '10px' }}>EMAIL</div>
                    <div className="small fw-medium text-truncate">{user.email}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-circle flex-shrink-0">
                    <Calendar size={16} className="text-secondary" />
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>JOINED</div>
                    <div className="small fw-medium">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {user.studyGoal && (
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light p-2 rounded-circle flex-shrink-0">
                      <Trophy size={16} className="text-warning" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="text-muted" style={{ fontSize: '10px' }}>GOAL</div>
                      <div className="small fw-medium text-truncate">{user.studyGoal}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="row g-3 mt-1">
              {[
                { label: 'Weekly Study', value: statsLoading ? '—' : formatStudyTime(stats.totalStudySeconds), color: 'text-primary'  },
                { label: 'Active Days',  value: statsLoading ? '—' : stats.streakDays,                        color: 'text-success'  },
                { label: 'Tasks Done',   value: statsLoading ? '—' : stats.tasksCompleted,                    color: 'text-warning'  },
                { label: 'Habits',       value: statsLoading ? '—' : stats.habitsCount,                       color: 'text-danger'   },
              ].map((s, i) => (
                <div key={i} className="col-6">
                  <div className="bg-white p-3 rounded-4 shadow-sm border text-center">
                    <div className={`fw-bold fs-4 ${s.color}`}>{s.value}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — Bio + Highlights */}
          <div className="col-lg-8">
            {/* Bio (only if filled) */}
            {user.bio && (
              <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                <h6 className="fw-bold mb-2 text-muted text-uppercase" style={{ fontSize: '11px' }}>
                  About Me
                </h6>
                <p className="mb-0 text-dark">{user.bio}</p>
              </div>
            )}

            {/* Achievement Highlights */}
            <div className="bg-white p-4 rounded-4 shadow-sm border">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <Trophy size={20} className="text-warning" /> Highlights
              </h5>
              <div className="row g-3">
                {[
                  {
                    icon:  <Clock size={28} className="text-success mb-2" />,
                    value: statsLoading ? '—' : formatStudyTime(stats.totalStudySeconds),
                    label: 'Studied This Week',
                    bg:    '#f0fdf4',
                  },
                  {
                    icon:  <Trophy size={28} className="text-warning mb-2" />,
                    value: statsLoading ? '—' : `${stats.streakDays} Days`,
                    label: 'Active Streak',
                    bg:    '#fffbeb',
                  },
                  {
                    icon:  <CheckSquare size={28} className="text-primary mb-2" />,
                    value: statsLoading ? '—' : stats.tasksCompleted,
                    label: 'Tasks Completed',
                    bg:    '#eff6ff',
                  },
                ].map((item, i) => (
                  <div key={i} className="col-md-4">
                    <div className="p-3 rounded-4 text-center" style={{ background: item.bg }}>
                      {item.icon}
                      <div className="fw-bold fs-5 text-dark">{item.value}</div>
                      <div className="text-muted small">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

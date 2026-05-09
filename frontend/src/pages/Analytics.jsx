import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLiveLocalDay, yyyyMmDdLocal } from '../utils/date';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { Clock, Calendar, Flame, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const { token } = useAuth();
  const { notifyInfo } = useNotification();

  const liveDay = useLiveLocalDay();

  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [totalSec, setTotalSec] = useState(0);
  const [goalStreak, setGoalStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [goalWeekly, setGoalWeekly] = useState([]);
  const [habitRate, setHabitRate] = useState(0);

  const formatHms = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h > 0 ? `${h}h ${m}m ${r}s` : `${m}m ${r}s`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [wRes, rRes, sRes, gwRes, hRes] = await Promise.all([
        fetch('http://localhost:5000/api/sessions/weekly-stats', { headers }),
        fetch('http://localhost:5000/api/reminders', { headers }),
        fetch('http://localhost:5000/api/daily-goal/streak', { headers }),
        fetch('http://localhost:5000/api/daily-goal/weekly', { headers }),
        fetch('http://localhost:5000/api/habits', { headers }),
      ]);

      const [wData, rData, sData, gwData, hData] = await Promise.all([
        wRes.json(), rRes.json(), sRes.json(), gwRes.json(), hRes.json(),
      ]);

      if (wData?.success && Array.isArray(wData.graphData)) {
        setWeeklyData(wData.graphData);
        setTotalSec(wData.graphData.reduce((acc, d) => acc + (d.rawSeconds || 0), 0));
      } else {
        setWeeklyData([]);
        setTotalSec(0);
      }

      if (rData?.success) setReminders(rData.reminders || []);
      else setReminders([]);

      if (sData?.success) {
        setGoalStreak(sData.streak ?? 0);
        setLongestStreak(sData.longestStreak ?? 0);
      } else {
        setGoalStreak(0);
        setLongestStreak(0);
      }

      if (gwData?.success) setGoalWeekly(gwData.days || []);
      else setGoalWeekly([]);

      if (hData?.success && Array.isArray(hData.habits) && hData.habits.length > 0) {
        const habits = hData.habits;
        const totalHabits = habits.length;

        const today = new Date();
        let totalPossible = 0;
        let totalDone = 0;

        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const ds = yyyyMmDdLocal(d);

          totalPossible += totalHabits;

          habits.forEach((h) => {
            const cds = Array.isArray(h.completedDates) ? h.completedDates : [];
            const doneThatDay = cds.some((cd) => yyyyMmDdLocal(new Date(cd)) === ds);
            if (doneThatDay) totalDone += 1;
          });
        }

        setHabitRate(totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0);
      } else {
        setHabitRate(0);
      }
    } catch (err) {
      console.error(err);
      notifyInfo('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, liveDay]);

  if (loading) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const streakDays = weeklyData.filter(d => (d.rawSeconds || 0) > 0).length;

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar notifications={reminders} />

      <div className="p-4 px-lg-5">
        <h2 className="fw-bold mb-4 mt-3">Study Insights</h2>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <div className="d-flex align-items-center gap-2 mb-2 text-primary">
                <Clock size={18} />
                <span className="small fw-bold text-uppercase">Weekly Total</span>
              </div>
              <h4 className="fw-bold text-dark mb-0">{formatHms(totalSec)}</h4>
              <p className="text-muted small mt-1 mb-0">Focus time this week</p>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <div className="d-flex align-items-center gap-2 mb-2 text-success">
                <Calendar size={18} />
                <span className="small fw-bold text-uppercase">Consistency</span>
              </div>
              <h4 className="fw-bold text-dark mb-0">{streakDays} / 7 Days</h4>
              <p className="text-muted small mt-1 mb-0">Days with study activity</p>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#ea580c' }}>
                <Flame size={18} />
                <span className="small fw-bold text-uppercase">Goal Streak</span>
              </div>
              <h4 className="fw-bold text-dark mb-0">{goalStreak} Days</h4>
              <p className="text-muted small mt-1 mb-0">
                Best: <strong>{longestStreak} days</strong>
              </p>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-white p-4 rounded-4 border shadow-sm">
              <div className="d-flex align-items-center gap-2 mb-2 text-info">
                <TrendingUp size={18} />
                <span className="small fw-bold text-uppercase">Habit Rate</span>
              </div>
              <h4 className="fw-bold text-dark mb-0">{habitRate}%</h4>
              <p className="text-muted small mt-1 mb-0">Avg habits done / day</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
          <h6 className="fw-bold mb-4">Focus Duration Trend (Hours)</h6>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  height={50}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={10} dy={16} textAnchor="middle" fill="#111" fontSize={12} fontWeight="bold">
                        {payload.value}
                      </text>
                      <text x={0} y={28} dy={16} textAnchor="middle" fill="#6b7280" fontSize={11}>
                        {weeklyData[payload.index]?.date}
                      </text>
                    </g>
                  )}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  content={({ active, payload }) =>
                    active && payload && payload.length ? (
                      <div className="bg-white p-3 border rounded-3 shadow-sm small">
                        <div className="fw-bold text-dark">
                          {payload[0].payload.day}, {payload[0].payload.date}
                        </div>
                        <div className="text-primary fw-bold">
                          {formatHms(payload[0].payload.rawSeconds)}
                        </div>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={40}>
                  {weeklyData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === weeklyData.length - 1 ? '#8b5cf6' : '#ddd6fe'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {goalWeekly.length > 0 && goalWeekly.some(d => (d.goalSeconds || 0) > 0) && (
          <div className="bg-white p-4 rounded-4 border shadow-sm">
            <h6 className="fw-bold mb-1">Goal vs Actual Study Time</h6>
            <p className="text-muted small mb-4">
              How your daily logged time compares to your set goals.
            </p>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalWeekly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis
                    hide={false}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}h`}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload && payload.length ? (
                        <div className="bg-white p-3 border rounded-3 shadow-sm small">
                          <div className="fw-bold mb-1">{label}</div>
                          {payload.map((p, i) => (
                            <div key={i} style={{ color: p.fill }}>
                              {p.name}: <strong>{p.value}h</strong>
                            </div>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>
                    )}
                  />
                  <Bar dataKey="goalHours" name="Goal" fill="#ddd6fe" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="loggedHours" name="Actual" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;

import express from 'express';
import DailyGoal from '../models/DailyGoal.js';
import StudySession from '../models/StudySession.js';
import { protectRoute } from './auth.js';

const router = express.Router();

const yyyyMmDdLocal = (d = new Date()) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

const todayStr = () => yyyyMmDdLocal(new Date());

const parseMonthYear = (month, year) => {
  const m = Math.min(12, Math.max(1, parseInt(month || '0', 10) || new Date().getMonth() + 1));
  const y = parseInt(year || '0', 10) || new Date().getFullYear();
  return { m, y };
};

router.post('/', protectRoute, async (req, res) => {
  try {
    const { goalSeconds, targetDate } = req.body;

    if (!goalSeconds || goalSeconds <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid goal duration' });
    }

    const date = targetDate || todayStr();

    const goal = await DailyGoal.findOneAndUpdate(
      { user: req.user.userId, date },
      { goalSeconds, achieved: false },
      { upsert: true, new: true }
    );

    res.json({ success: true, goal });
  } catch (err) {
    console.error('Set Daily Goal Error:', err);
    res.status(500).json({ success: false, message: 'Failed to set goal' });
  }
});

router.get('/day', protectRoute, async (req, res) => {
  try {
    const dateQuery = req.query.date || todayStr();
    const goal = await DailyGoal.findOne({ user: req.user.userId, date: dateQuery });

    const startOfDay = new Date(`${dateQuery}T00:00:00`);
    const endOfDay   = new Date(`${dateQuery}T23:59:59.999`);

    const sessions = await StudySession.find({
      user: req.user.userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const loggedSeconds = sessions.reduce((acc, s) => acc + s.durationInSeconds, 0);

    if (goal && !goal.achieved && loggedSeconds >= goal.goalSeconds) {
      goal.achieved = true;
      await goal.save();
    }

    res.json({
      success: true,
      goal: goal
        ? { goalSeconds: goal.goalSeconds, achieved: goal.achieved, date: goal.date }
        : null,
      loggedSeconds,
    });
  } catch (err) {
    console.error('Get Day Goal Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch goal for date' });
  }
});

router.get('/month', protectRoute, async (req, res) => {
  try {
    const { m, y } = parseMonthYear(req.query.month, req.query.year);

    const startStr = yyyyMmDdLocal(new Date(y, m - 1, 1));
    const endStr   = yyyyMmDdLocal(new Date(y, m, 1));

    const goals = await DailyGoal.find({
      user: req.user.userId,
      date: { $gte: startStr, $lt: endStr },
      goalSeconds: { $gt: 0 },
    }).select('date');

    res.json({ success: true, dates: goals.map(g => g.date) });
  } catch (err) {
    console.error('Get Month Goals Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch month goals' });
  }
});

router.get('/today', protectRoute, async (req, res) => {
  try {
    const today = todayStr();
    const goal  = await DailyGoal.findOne({ user: req.user.userId, date: today });

    const startOfDay = new Date(`${today}T00:00:00`);
    const endOfDay   = new Date(`${today}T23:59:59.999`);

    const sessions = await StudySession.find({
      user: req.user.userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const loggedSeconds = sessions.reduce((acc, s) => acc + s.durationInSeconds, 0);

    if (goal && !goal.achieved && loggedSeconds >= goal.goalSeconds) {
      goal.achieved = true;
      await goal.save();
    }

    res.json({
      success: true,
      goal: goal
        ? { goalSeconds: goal.goalSeconds, achieved: goal.achieved, date: goal.date }
        : null,
      loggedSeconds,
    });
  } catch (err) {
    console.error('Get Today Goal Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch goal' });
  }
});

router.get('/streak', protectRoute, async (req, res) => {
  try {
    const goals = await DailyGoal.find({
      user: req.user.userId,
      achieved: true,
    }).sort({ date: -1 });

    if (!goals.length) return res.json({ success: true, streak: 0, longestStreak: 0 });

    const doneDates  = new Set(goals.map(g => g.date));
    const today      = todayStr();

    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    const yesterdayStr = yyyyMmDdLocal(yd);

    let checkFrom = doneDates.has(today)
      ? today
      : doneDates.has(yesterdayStr)
      ? yesterdayStr
      : null;

    let streak = 0;
    if (checkFrom) {
      const cursor = new Date(`${checkFrom}T00:00:00`);
      while (true) {
        const ds = yyyyMmDdLocal(cursor);
        if (doneDates.has(ds)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const sortedDates = [...doneDates].sort();
    let longest = 0;
    let current = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    longest = Math.max(longest, current, streak);

    res.json({ success: true, streak, longestStreak: longest });
  } catch (err) {
    console.error('Get Goal Streak Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch streak' });
  }
});

router.get('/weekly', protectRoute, async (req, res) => {
  try {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = yyyyMmDdLocal(d);

      const goal = await DailyGoal.findOne({ user: req.user.userId, date: dateStr });

      const startOfDay = new Date(`${dateStr}T00:00:00`);
      const endOfDay   = new Date(`${dateStr}T23:59:59.999`);

      const sessions = await StudySession.find({
        user: req.user.userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const loggedSeconds = sessions.reduce((acc, s) => acc + s.durationInSeconds, 0);

      days.push({
        date:        dateStr,
        day:         d.toLocaleDateString('en-IN', { weekday: 'short' }),
        goalSeconds: goal ? goal.goalSeconds : 0,
        goalHours:   goal ? +(goal.goalSeconds / 3600).toFixed(2) : 0,
        loggedSeconds,
        loggedHours: +(loggedSeconds / 3600).toFixed(2),
        achieved:    goal ? goal.achieved : false,
      });
    }

    res.json({ success: true, days });
  } catch (err) {
    console.error('Get Weekly Goals Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch weekly goals' });
  }
});

export default router;

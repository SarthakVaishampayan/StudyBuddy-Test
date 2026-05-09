import express from 'express';
import Habit from '../models/Habit.js';
import { protectRoute } from './auth.js';

const router = express.Router();

const yyyyMmDdLocal = (d = new Date()) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

const todayStr = () => yyyyMmDdLocal(new Date());

router.get('/', protectRoute, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.userId }).sort({ createdAt: 1 });
    const today = todayStr();

    const result = habits.map(h => {
      const completedToday = (h.completedDates || []).some(
        d => yyyyMmDdLocal(d) === today
      );

      return {
        _id: h._id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        completedToday,
        streak: h.calculateStreak(),
        completedDates: h.completedDates,
        createdAt: h.createdAt,
      };
    });

    res.json({ success: true, habits: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch habits' });
  }
});

router.post('/', protectRoute, async (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });

    const habit = await Habit.create({
      user: req.user.userId,
      name,
      emoji: emoji || '⭐',
      color: color || '#8b5cf6',
    });

    res.status(201).json({
      success: true,
      habit: {
        _id: habit._id,
        name: habit.name,
        emoji: habit.emoji,
        color: habit.color,
        completedToday: false,
        streak: 0,
        completedDates: [],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create habit' });
  }
});

router.patch('/:id/toggle', protectRoute, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const today = todayStr();
    const alreadyDone = (habit.completedDates || []).some(
      d => yyyyMmDdLocal(d) === today
    );

    if (alreadyDone) {
      habit.completedDates = habit.completedDates.filter(
        d => yyyyMmDdLocal(d) !== today
      );
    } else {
      habit.completedDates.push(new Date());
    }

    await habit.save();

    res.json({
      success: true,
      habit: {
        _id: habit._id,
        name: habit.name,
        emoji: habit.emoji,
        color: habit.color,
        completedToday: !alreadyDone,
        streak: habit.calculateStreak(),
        completedDates: habit.completedDates,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to toggle habit' });
  }
});

router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete habit' });
  }
});

router.get('/:id/calendar', protectRoute, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const datesInMonth = (habit.completedDates || [])
      .filter(d => {
        const dt = new Date(d);
        return (dt.getMonth() + 1) === month && dt.getFullYear() === year;
      })
      .map(d => yyyyMmDdLocal(d));

    res.json({
      success: true,
      habit: {
        _id: habit._id,
        name: habit.name,
        emoji: habit.emoji,
        color: habit.color,
      },
      month,
      year,
      completedDates: datesInMonth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar' });
  }
});

export default router;

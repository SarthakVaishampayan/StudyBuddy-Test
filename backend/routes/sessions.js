import express from 'express';
import StudySession from '../models/StudySession.js';
import { protectRoute } from './auth.js';

const router = express.Router();

router.post('/', protectRoute, async (req, res) => {
  try {
    const session = await StudySession.create({
      user: req.user.userId,
      durationInSeconds: req.body.durationInSeconds,
      subject: req.body.subject || 'General Study',
    });
    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error('POST /sessions error:', err);
    res.status(400).json({ success: false });
  }
});

router.get('/today', protectRoute, async (req, res) => {
  try {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const startYesterday = new Date();
    startYesterday.setDate(startYesterday.getDate() - 1);
    startYesterday.setHours(0, 0, 0, 0);

    const endYesterday = new Date();
    endYesterday.setDate(endYesterday.getDate() - 1);
    endYesterday.setHours(23, 59, 59, 999);

    const [todaySessions, yesterdaySessions] = await Promise.all([
      StudySession.find({ user: req.user.userId, createdAt: { $gte: startToday } }),
      StudySession.find({ user: req.user.userId, createdAt: { $gte: startYesterday, $lte: endYesterday } }),
    ]);

    const todaySec     = todaySessions.reduce((acc, s) => acc + s.durationInSeconds, 0);
    const yesterdaySec = yesterdaySessions.reduce((acc, s) => acc + s.durationInSeconds, 0);

    let percentChange = 0;
    if (yesterdaySec > 0) {
      percentChange = ((todaySec - yesterdaySec) / yesterdaySec) * 100;
    } else if (todaySec > 0) {
      percentChange = 100;
    }

    res.json({
      success: true,
      totalSeconds: todaySec,
      percentChange: parseFloat(percentChange.toFixed(0)),
    });
  } catch (err) {
    console.error('GET /sessions/today error:', err);
    res.status(500).json({ success: false });
  }
});

router.get('/weekly-stats', protectRoute, async (req, res) => {
  try {
    const daysArr  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const graphData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const sessions = await StudySession.find({
        user: req.user.userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const sec = sessions.reduce((acc, s) => acc + s.durationInSeconds, 0);

      graphData.push({
        day:        daysArr[date.getDay()],
        date:       `${date.getDate()}/${date.getMonth() + 1}`,
        hours:      parseFloat((sec / 3600).toFixed(4)),
        rawSeconds: sec,
      });
    }

    res.json({ success: true, graphData });
  } catch (err) {
    console.error('GET /sessions/weekly-stats error:', err);
    res.status(500).json({ success: false });
  }
});

export default router;

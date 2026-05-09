import express from "express";
import Reminder from "../models/Reminder.js";
import { protectRoute } from "./auth.js";
const router = express.Router();

router.get("/", protectRoute, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.userId }).sort({ deadline: 1 });
    const pendingCount = await Reminder.countDocuments({
      user: req.user.userId,
      deadline: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    res.json({ success: true, reminders, pendingCount });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post("/", protectRoute, async (req, res) => {
  try {
    const { text, deadline } = req.body;
    const reminder = await Reminder.create({
      user: req.user.userId,
      text,
      deadline: new Date(deadline)
    });
    res.status(201).json({ success: true, reminder });
  } catch (err) { res.status(400).json({ success: false }); }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

export default router;

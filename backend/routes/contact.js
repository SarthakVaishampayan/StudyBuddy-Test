import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import { protectRoute } from "./auth.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const doc = await ContactMessage.create({
      user: req.user.userId,
      name,
      email,
      subject,
      message,
      type: type || "other",
    });

    res.status(201).json({
      success: true,
      message: "Your message has been submitted.",
      contact: {
        id: doc._id,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error("Contact form error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit the message." });
  }
});

export default router;

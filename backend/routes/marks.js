import express from "express";
import Mark from "../models/Mark.js";
import Subject from "../models/Subject.js";
import { protectRoute } from "./auth.js";

const router = express.Router();

const isNonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

const ensureSubjectOwner = async ({ subjectId, userId }) => {
  const subject = await Subject.findOne({ _id: subjectId, user: userId });
  return subject;
};

router.get("/", protectRoute, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId } = req.query;

    const filter = { user: userId };
    if (subjectId) filter.subjectId = subjectId;

    const marks = await Mark.find(filter).sort({ examDate: -1, createdAt: -1 });
    return res.json({ success: true, marks });
  } catch (err) {
    console.error("GET /api/marks error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch marks." });
  }
});

router.post("/", protectRoute, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId, examName, score, outOf, examDate, note } = req.body;

    if (!subjectId) {
      return res.status(400).json({ success: false, message: "subjectId is required." });
    }
    if (!isNonEmpty(examName)) {
      return res.status(400).json({ success: false, message: "Exam name is required." });
    }

    const sc = Number(score);
    const oo = Number(outOf);

    if (!Number.isFinite(sc) || !Number.isFinite(oo) || oo <= 0 || sc < 0) {
      return res.status(400).json({ success: false, message: "Invalid score/outOf." });
    }
    if (sc > oo) {
      return res.status(400).json({ success: false, message: "Score cannot exceed outOf." });
    }
    if (!isNonEmpty(examDate)) {
      return res.status(400).json({ success: false, message: "Exam date is required." });
    }

    const subject = await ensureSubjectOwner({ subjectId, userId });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }

    const created = await Mark.create({
      user: userId,
      subjectId,
      examName: examName.trim(),
      score: sc,
      outOf: oo,
      examDate: examDate.trim(),
      note: (note || "").toString().trim(),
    });

    return res.status(201).json({ success: true, mark: created });
  } catch (err) {
    console.error("POST /api/marks error:", err);
    return res.status(500).json({ success: false, message: "Failed to add marks." });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const userId = req.user.userId;
    const mark = await Mark.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!mark) return res.status(404).json({ success: false, message: "Marks entry not found." });
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/marks/:id error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete marks." });
  }
});

export default router;

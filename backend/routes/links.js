import express from "express";
import Link from "../models/Link.js";
import { protectRoute } from "./auth.js";

const router = express.Router();

const isNonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

const normalizeUrl = (raw) => {
  const u = (raw || "").toString().trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
};

router.get("/", protectRoute, async (req, res) => {
  try {
    const links = await Link.find({ user: req.user.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, links });
  } catch (err) {
    console.error("GET /api/links error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch links." });
  }
});

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, url, description } = req.body;

    if (!isNonEmpty(title)) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }
    if (!isNonEmpty(url)) {
      return res.status(400).json({ success: false, message: "URL is required." });
    }

    const finalUrl = normalizeUrl(url);

    if (!/^https?:\/\//i.test(finalUrl)) {
      return res.status(400).json({ success: false, message: "Invalid URL." });
    }

    const created = await Link.create({
      user: req.user.userId,
      title: title.trim(),
      url: finalUrl,
      description: (description || "").toString().trim(),
    });

    return res.status(201).json({ success: true, link: created });
  } catch (err) {
    console.error("POST /api/links error:", err);
    return res.status(500).json({ success: false, message: "Failed to add link." });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const deleted = await Link.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!deleted) return res.status(404).json({ success: false, message: "Link not found." });
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/links/:id error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete link." });
  }
});

export default router;

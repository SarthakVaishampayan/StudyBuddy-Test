import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import sessionRoutes from "./routes/sessions.js";
import taskRoutes from "./routes/tasks.js";
import reminderRoutes from "./routes/reminders.js";
import subjectRoutes from "./routes/subjects.js";
import dailyGoalRoutes from "./routes/dailyGoal.js";
import marksRoutes from "./routes/marks.js";
import linksRoutes from "./routes/links.js";
import aiRoutes from "./routes/ai.js";
import calendarRoutes from "./routes/calendar.js";
const app = express();

const frontendOrigin = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.replace(/\/$/, "") 
  : "http://localhost:5173";

app.use(
  cors({
    origin: [frontendOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/studybuddy"
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/daily-goal", dailyGoalRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/calendar", calendarRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "StudyBuddy API is running",
    timestamp: new Date(),
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

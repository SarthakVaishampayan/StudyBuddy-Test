import mongoose from 'mongoose';

const dailyGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date:         { type: String, required: true }, // e.g. "2026-02-22"
  goalSeconds:  { type: Number, required: true },
  achieved:     { type: Boolean, default: false },
}, { timestamps: true });

dailyGoalSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyGoal', dailyGoalSchema);

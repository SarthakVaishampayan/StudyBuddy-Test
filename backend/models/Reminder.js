import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  deadline: { type: Date, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Reminder", reminderSchema);

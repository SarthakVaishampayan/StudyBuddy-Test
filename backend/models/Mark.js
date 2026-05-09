import mongoose from "mongoose";

const markSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    outOf: {
      type: Number,
      required: true,
      min: 1,
    },
    examDate: {
      type: String, // YYYY-MM-DD from <input type="date" />
      required: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

markSchema.index({ user: 1, subjectId: 1, examDate: -1 });

export default mongoose.model("Mark", markSchema);

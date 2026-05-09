import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

linkSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Link", linkSchema);

import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  durationInSeconds: { 
    type: Number, 
    required: true 
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  subject: { 
    type: String, 
    default: "General" 
  }
}, { timestamps: true });

export default mongoose.model("StudySession", studySessionSchema);

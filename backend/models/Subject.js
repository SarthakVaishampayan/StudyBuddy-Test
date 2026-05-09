import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const subjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name:     { type: String, required: true, trim: true },
  emoji:    { type: String, default: '📚' },
  color:    { type: String, default: '#8b5cf6' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  notes:    { type: String, default: '' },
  topics:   [topicSchema],
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);

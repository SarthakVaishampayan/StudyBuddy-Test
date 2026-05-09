import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true, trim: true },
  emoji: { type: String, default: '⭐' },
  color: { type: String, default: '#8b5cf6' },
  completedDates: [{ type: Date }],
}, { timestamps: true });

const yyyyMmDdLocal = (d = new Date()) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

habitSchema.methods.calculateStreak = function () {
  if (!this.completedDates?.length) return 0;

  const doneDates = new Set(
    this.completedDates.map((d) => yyyyMmDdLocal(d))
  );

  const today = new Date();
  const todayStr = yyyyMmDdLocal(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yyyyMmDdLocal(yesterday);

  let checkFrom;
  if (doneDates.has(todayStr)) checkFrom = new Date(today);
  else if (doneDates.has(yesterdayStr)) checkFrom = new Date(yesterday);
  else return 0;

  let streak = 0;
  const cursor = new Date(checkFrom);
  while (true) {
    const dateStr = yyyyMmDdLocal(cursor);
    if (doneDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export default mongoose.model('Habit', habitSchema);

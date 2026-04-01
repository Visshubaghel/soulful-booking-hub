import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true, // "YYYY-MM-DD"
    index: true,
  },
  time: {
    type: String,
    required: true, // "10:30 AM"
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  maxPatients: {
    type: Number,
    default: 10,
  },
  currentBookings: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Compound unique index: one slot doc per date+time combination
SlotSchema.index({ date: 1, time: 1 }, { unique: true });

export const Slot = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);

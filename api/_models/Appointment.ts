import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  patientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  patientPhone: {
    type: String,
    trim: true,
  },
  date: {
    type: String,
    required: true, // "YYYY-MM-DD"
  },
  time: {
    type: String,
    required: true, // "10:30 AM"
  },
  service: {
    type: String,
    default: 'General Consultation',
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

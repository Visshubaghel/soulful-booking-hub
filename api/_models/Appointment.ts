import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  patientEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  patientPhone: {
    type: String,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  symptoms: {
    type: String,
    required: true, // "reason for visit"
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
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  nextVisitDate: {
    type: String, // "YYYY-MM-DD"
    default: null,
  },
  prescriptionData: {
    type: String, // Store Base64 encoded image string
    default: null,
  }
}, { timestamps: true });

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

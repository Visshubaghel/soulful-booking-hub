import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
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
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    trim: true,
  },
  nextVisitDate: {
    type: String, // YYYY-MM-DD
    default: null,
  }
}, { timestamps: true });

export const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db.js';
import { setCorsHeaders } from '../_lib/auth.js';
import { Patient } from '../_models/Patient.js';
import { Appointment } from '../_models/Appointment.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const patient = await Patient.findById(id);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      
      const appointments = await Appointment.find({ patientId: patient._id }).sort({ date: -1, time: -1 });

      return res.status(200).json({ patient, appointments });
    }

    if (req.method === 'PUT') {
      const { nextVisitDate } = req.body;
      const patient = await Patient.findByIdAndUpdate(id, { $set: { nextVisitDate } }, { new: true });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      return res.status(200).json(patient);
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Patient detail error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}

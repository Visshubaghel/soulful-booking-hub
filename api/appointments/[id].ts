import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db.js';
import { setCorsHeaders } from '../_lib/auth.js';
import { Appointment } from '../_models/Appointment.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  try {
    await connectToDatabase();

    if (req.method === 'PUT') {
      const { status, prescriptionData, notes, nextVisitDate } = req.body;
      
      const updateFields: any = {};
      if (status) updateFields.status = status;
      if (prescriptionData) updateFields.prescriptionData = prescriptionData;
      if (notes !== undefined) updateFields.notes = notes;
      if (nextVisitDate !== undefined) updateFields.nextVisitDate = nextVisitDate;

      const appt = await Appointment.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
      if (!appt) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      return res.status(200).json(appt);
    }
    
    if (req.method === 'GET') {
      const appt = await Appointment.findById(id).populate('patientId');
      if (!appt) return res.status(404).json({ message: 'Appointment not found' });
      return res.status(200).json(appt);
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Update appointment error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}

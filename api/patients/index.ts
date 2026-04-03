import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db.js';
import { setCorsHeaders } from '../_lib/auth.js';
import { Patient } from '../_models/Patient.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const { search } = req.query;
      let query = {};
      if (search && typeof search === 'string') {
        const regex = new RegExp(search, 'i');
        query = { $or: [{ name: regex }, { patientId: regex }, { phone: regex }] };
      }
      
      const patients = await Patient.find(query).sort({ createdAt: -1 });
      return res.status(200).json(patients);
    } 
    
    if (req.method === 'POST') {
      // Direct registration of a patient
      const { name, age, gender, phone, email, address } = req.body;
      
      if (!name || !age || !gender || !phone) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Generate Patient ID (e.g., PT-1001)
      const count = await Patient.countDocuments();
      const patientId = `PT-${1000 + count + 1}`;

      const patient = new Patient({
        patientId,
        name,
        age,
        gender,
        phone,
        email,
        address,
      });

      await patient.save();
      return res.status(201).json(patient);
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Patients error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}

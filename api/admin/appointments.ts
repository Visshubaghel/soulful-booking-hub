import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../../_lib/db.js';
import { setCorsHeaders, verifyAdmin } from '../../_lib/auth.js';
import { Appointment } from '../../_models/Appointment.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectToDatabase();

  // GET /api/admin/appointments — list all appointments, newest first
  if (req.method === 'GET') {
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    const { date, status } = req.query;
    const filter: any = {};
    if (date) filter.date = date;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 }).lean();
    const total = await Appointment.countDocuments();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = await Appointment.countDocuments({ date: todayStr });

    return res.status(200).json({ appointments, total, todayCount });
  }

  // PATCH /api/admin/appointments — update status
  if (req.method === 'PATCH') {
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ message: 'id and status required' });
    }
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    return res.status(200).json({ appointment });
  }

  // POST /api/admin/appointments — manually create appointment (admin)
  if (req.method === 'POST') {
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    const { patientName, patientEmail, patientPhone, date, time, service, notes } = req.body;
    if (!patientName || !patientEmail || !date || !time) {
      return res.status(400).json({ message: 'patientName, patientEmail, date, time required' });
    }

    const appt = new Appointment({ patientName, patientEmail, patientPhone, date, time, service, notes, status: 'confirmed' });
    await appt.save();
    return res.status(201).json({ appointment: appt });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

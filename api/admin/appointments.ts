import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db.js';
import { setCorsHeaders, verifyAdmin } from '../_lib/auth.js';
import { Appointment } from '../_models/Appointment.js';
import { Slot } from '../_models/Slot.js';

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

  // PATCH /api/admin/appointments — update status or date/time
  if (req.method === 'PATCH') {
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    const { id, status, date, time } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'id required' });
    }

    const currentAppointment = await Appointment.findById(id);
    if (!currentAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const updates: any = {};
    if (status) {
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.status = status;
    }

    // Handle rescheduling logic
    if (date && time && (date !== currentAppointment.date || time !== currentAppointment.time)) {
      // 1. Decrement old slot
      await Slot.findOneAndUpdate(
        { date: currentAppointment.date, time: currentAppointment.time },
        { $inc: { currentBookings: -1 } }
      );

      // 2. Increment new slot
      await Slot.findOneAndUpdate(
        { date, time },
        { $inc: { currentBookings: 1 }, $setOnInsert: { isBlocked: false, maxPatients: 10 } },
        { upsert: true, setDefaultsOnInsert: true }
      );

      updates.date = date;
      updates.time = time;
    }

    const updatedAppt = await Appointment.findByIdAndUpdate(id, { $set: updates }, { new: true });
    
    return res.status(200).json({ appointment: updatedAppt });
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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db';
import { setCorsHeaders, verifyAdmin } from '../_lib/auth';
import { Appointment } from '../_models/Appointment';
import { Slot } from '../_models/Slot';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const admin = verifyAdmin(req, res);
  if (!admin) return;

  try {
    await connectToDatabase();

    const todayStr = new Date().toISOString().split('T')[0];

    const [totalAppointments, todayAppointments, blockedSlotsToday] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: todayStr }),
      Slot.countDocuments({ date: todayStr, isBlocked: true }),
    ]);

    const totalSlotsPerDay = 17;
    const fullSlots = await Slot.countDocuments({
      date: todayStr,
      $expr: { $gte: ['$currentBookings', '$maxPatients'] }
    });

    const availableSlotsToday = Math.max(0, totalSlotsPerDay - blockedSlotsToday - fullSlots);

    return res.status(200).json({
      totalAppointments,
      todayAppointments,
      availableSlotsToday,
      blockedSlotsToday,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return res.status(500).json({ message: 'Internal Server Error', detail: error.message });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db';
import { setCorsHeaders, verifyAdmin } from '../_lib/auth';
import { Appointment } from '../_models/Appointment';
import { Slot } from '../_models/Slot';
import { User } from '../_models/User';

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

    const [totalAppointments, todayAppointments, totalUsers, blockedSlotsToday] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: todayStr }),
      User.countDocuments(),
      Slot.countDocuments({ date: todayStr, isBlocked: true }),
    ]);

    // Count available slots for today
    // We generate 18 slots per day (10:30 AM to 7:00 PM, every 30 min = 17 slots)
    const totalSlotsPerDay = 17;
    const fullSlots = await Slot.countDocuments({
      date: todayStr,
      $expr: { $gte: ['$currentBookings', '$maxPatients'] }
    });

    const availableSlotsToday = totalSlotsPerDay - blockedSlotsToday - fullSlots;

    return res.status(200).json({
      totalAppointments,
      todayAppointments,
      totalUsers,
      availableSlotsToday: Math.max(0, availableSlotsToday),
      blockedSlotsToday,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

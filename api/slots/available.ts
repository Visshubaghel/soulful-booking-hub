import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db';
import { setCorsHeaders } from '../_lib/auth';
import { Slot } from '../_models/Slot';

/**
 * GET /api/slots/available?date=YYYY-MM-DD
 * Public endpoint — returns all available (non-blocked, under capacity) time slots for a given date.
 * Used by the booking page and chatbot.
 */

// Generate all time slots for a day (10:30 AM to 7:00 PM, every 30 min)
function generateDaySlots(date: string) {
  const slots: { date: string; time: string; isBlocked: boolean; maxPatients: number; currentBookings: number }[] = [];
  const start = 10 * 60 + 30; // 10:30 in minutes
  const end = 19 * 60;        // 7:00 PM in minutes

  for (let m = start; m < end; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const time = `${displayH}:${min.toString().padStart(2, '0')} ${suffix}`;
    slots.push({ date, time, isBlocked: false, maxPatients: 10, currentBookings: 0 });
  }
  return slots;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ message: 'date query param required (YYYY-MM-DD)' });
  }

  // Validate date is not in the past
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return res.status(200).json({
      availableSlots: [],
      message: `The date ${date} is in the past. Please choose a future date.`,
    });
  }

  try {
    await connectToDatabase();

    const template = generateDaySlots(date);
    const existing = await Slot.find({ date }).lean();
    const existingMap = new Map((existing as any[]).map((s) => [s.time, s]));

    // Merge template with existing DB records, then filter to available only
    const available = template
      .map(t => {
        const dbSlot = existingMap.get(t.time) as any;
        return dbSlot ? { ...t, ...dbSlot } : t;
      })
      .filter(s => !s.isBlocked && s.currentBookings < s.maxPatients)
      .map(s => ({
        time: s.time,
        currentBookings: s.currentBookings,
        maxPatients: s.maxPatients,
        spotsLeft: s.maxPatients - s.currentBookings,
      }));

    return res.status(200).json({
      date,
      availableSlots: available,
      totalAvailable: available.length,
    });
  } catch (error) {
    console.error('Available slots error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

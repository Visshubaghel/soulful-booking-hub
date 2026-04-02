import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db.js';
import { setCorsHeaders, verifyAdmin } from '../_lib/auth.js';
import { Slot } from '../_models/Slot.js';

// Generate all time slots for a day (10:30 AM to 7:00 PM, every 30 min)
function generateDaySlots(date: string) {
  const slots = [];
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

  await connectToDatabase();

  // GET /api/admin/slots?date=YYYY-MM-DD
  if (req.method === 'GET') {
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'date query param required (YYYY-MM-DD)' });
    }

    const template = generateDaySlots(date);
    const existing = await Slot.find({ date }).lean();
    const existingMap = new Map(existing.map((s: any) => [s.time, s]));

    // Merge template with existing DB records
    const merged = template.map(t => existingMap.get(t.time) || t);
    return res.status(200).json({ slots: merged });
  }

  // POST /api/admin/slots — upsert a slot config
  if (req.method === 'POST') {
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    const { date, time, isBlocked, maxPatients } = req.body;
    if (!date || !time) {
      return res.status(400).json({ message: 'date and time required' });
    }

    const slot = await Slot.findOneAndUpdate(
      { date, time },
      { $set: { isBlocked: !!isBlocked, ...(maxPatients !== undefined ? { maxPatients } : {}) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ slot });
  }

  // DELETE /api/admin/slots — remove a slot override (reset to default)
  if (req.method === 'DELETE') {
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ message: 'date and time required' });
    }

    await Slot.deleteOne({ date, time });
    return res.status(200).json({ message: 'Slot reset to default' });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

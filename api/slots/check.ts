import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_lib/db.js';
import { setCorsHeaders } from '../_lib/auth.js';
import { Slot } from '../_models/Slot.js';

/**
 * GET /api/slots/check?date=YYYY-MM-DD&time=HH:MM AM/PM
 * Public endpoint - used by the chatbot Gemini function call
 * Returns whether a slot is available (not blocked, under patient limit)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { date, time } = req.query;

  if (!date || !time || typeof date !== 'string' || typeof time !== 'string') {
    return res.status(400).json({ message: 'date and time query params required' });
  }

  // Validate date is not in the past
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return res.status(200).json({
      available: false,
      message: `The date ${date} is in the past. Please choose a future date.`,
    });
  }

  try {
    await connectToDatabase();

    const slot = await Slot.findOne({ date, time }).lean() as any;

    if (slot) {
      if (slot.isBlocked) {
        return res.status(200).json({
          available: false,
          message: `Sorry, the slot on ${date} at ${time} is not available. Please choose a different time.`,
        });
      }
      if (slot.currentBookings >= slot.maxPatients) {
        return res.status(200).json({
          available: false,
          message: `The slot on ${date} at ${time} is fully booked (${slot.currentBookings}/${slot.maxPatients} patients). Please choose a different time.`,
        });
      }
      return res.status(200).json({
        available: true,
        message: `Yes! The slot on ${date} at ${time} is available (${slot.currentBookings}/${slot.maxPatients} patients booked). Please go to the Contact page or WhatsApp us to confirm your booking.`,
        currentBookings: slot.currentBookings,
        maxPatients: slot.maxPatients,
      });
    }

    // No DB record means slot is at default (open, 0 bookings)
    return res.status(200).json({
      available: true,
      message: `Yes! The slot on ${date} at ${time} is available (0/10 patients booked). Please go to the Contact page or WhatsApp us to confirm your booking.`,
      currentBookings: 0,
      maxPatients: 10,
    });
  } catch (error) {
    console.error('Slot check error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../../_lib/db.js';
import { setCorsHeaders } from '../../_lib/auth.js';
import { Appointment } from '../../_models/Appointment.js';
import { Slot } from '../../_models/Slot.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const { patientName, patientEmail, patientPhone, date, time, service, notes } = req.body;

    if (!patientName || !patientEmail || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields: name, email, date, time' });
    }

    // Check slot availability natively
    const slot = await Slot.findOne({ date, time });
    
    // If slot exists, check if it's blocked or full
    if (slot) {
      if (slot.isBlocked) {
        return res.status(400).json({ message: 'Sorry, this slot is blocked by the clinic.' });
      }
      if (slot.currentBookings >= slot.maxPatients) {
        return res.status(400).json({ message: 'Sorry, this slot is fully booked. Please select another.' });
      }
    }

    // Create the appointment
    const newAppt = new Appointment({
      patientName,
      patientEmail,
      patientPhone,
      date,
      time,
      service: service || 'General Consultation',
      notes,
      status: 'pending' // Default strictly to pending for new public bookings
    });
    await newAppt.save();

    // Increment slot booking count
    // If slot didn't exist, upsert it with currentBookings = 1 (default maxPatients is 10)
    await Slot.findOneAndUpdate(
      { date, time },
      { $inc: { currentBookings: 1 }, $setOnInsert: { isBlocked: false, maxPatients: 10 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ 
      success: true, 
      message: 'Appointment booked successfully.',
      appointment: newAppt 
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

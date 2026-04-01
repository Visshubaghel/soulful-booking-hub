import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const mongoose = (await import('mongoose')).default;
    res.status(200).json({ ok: true, version: mongoose.version });
  } catch(e: any) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}

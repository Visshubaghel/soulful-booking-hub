import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const isMongoUriSet = !!process.env.MONGODB_URI;
  res.status(200).json({ 
    message: "Server is alive!", 
    isMongoUrlProvided: isMongoUriSet,
    nodeEnv: process.env.NODE_ENV
  });
}

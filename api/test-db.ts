import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};

  try {
    const bcryptjsMod = await import('bcryptjs');
    const bcrypt = (bcryptjsMod as any).default || bcryptjsMod;
    results.bcryptjs_type = typeof bcrypt.hash;
    results.bcryptjs_keys = Object.keys(bcryptjsMod).slice(0, 5).join(',');
    results.bcryptjs_hasDefault = String('default' in bcryptjsMod);
  } catch (e: any) {
    results.bcryptjs_error = e.message;
  }

  try {
    const jwtMod = await import('jsonwebtoken');
    const jwt = (jwtMod as any).default || jwtMod;
    results.jwt_type = typeof jwt.sign;
    results.jwt_keys = Object.keys(jwtMod).slice(0, 5).join(',');
    results.jwt_hasDefault = String('default' in jwtMod);
  } catch (e: any) {
    results.jwt_error = e.message;
  }

  try {
    const cookieMod = await import('cookie');
    const cookieObj = (cookieMod as any).default || cookieMod;
    results.cookie_serialize_type = typeof cookieObj.serialize;
    results.cookie_keys = Object.keys(cookieMod).slice(0, 5).join(',');
    results.cookie_hasDefault = String('default' in cookieMod);
  } catch (e: any) {
    results.cookie_error = e.message;
  }

  try {
    const mongooseMod = await import('mongoose');
    results.mongoose_type = typeof (mongooseMod as any).default?.connect;
    results.mongoose_keys = Object.keys(mongooseMod).slice(0, 5).join(',');
  } catch (e: any) {
    results.mongoose_error = e.message;
  }

  results.MONGODB_URI_set = String(!!process.env.MONGODB_URI);
  results.JWT_SECRET_set = String(!!process.env.JWT_SECRET);

  return res.status(200).json(results);
}

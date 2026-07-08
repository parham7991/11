import { payload_key, secret_key } from '@/lib/variable';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const GET = () => {
  const token = jwt.sign({ key: payload_key }, secret_key, { expiresIn: '7d' });

  return NextResponse.json({ token }); // 🔄 اینجا باید return بشه
};

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    matchDurationMinutes: parseInt(process.env.MATCH_DURATION_MINUTES || '15', 10),
  });
}

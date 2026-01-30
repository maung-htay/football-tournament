import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const round = searchParams.get('round');

    const filter: any = {};
    if (groupId) filter.groupId = groupId;
    if (round) filter.round = round;

    const matches = await Match.find(filter)
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('groupId')
      .sort({ matchDate: 1, matchTime: 1 });

    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const match = await Match.create(body);
    const populated = await Match.findById(match._id)
      .populate('homeTeam')
      .populate('awayTeam');
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}

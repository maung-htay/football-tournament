import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Team from '@/models/Team';
import Group from '@/models/Group';

// Ensure models are registered
const _Team = Team;
const _Group = Group;

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
    console.error('Failed to fetch matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Clean up null values
    const matchData: any = {
      round: body.round,
      venue: body.venue,
      matchDate: body.matchDate,
      matchTime: body.matchTime,
      status: 'scheduled',
    };

    if (body.matchName) matchData.matchName = body.matchName;
    if (body.homeTeam) matchData.homeTeam = body.homeTeam;
    if (body.awayTeam) matchData.awayTeam = body.awayTeam;
    if (body.homePlaceholder) matchData.homePlaceholder = body.homePlaceholder;
    if (body.awayPlaceholder) matchData.awayPlaceholder = body.awayPlaceholder;
    if (body.groupId) matchData.groupId = body.groupId;

    const match = await Match.create(matchData);
    const populated = await Match.findById(match._id)
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('groupId');
      
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('Failed to create match:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}

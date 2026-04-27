import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import Team from '@/models/Team';
import Match from '@/models/Match';

export async function POST() {
  try {
    await dbConnect();

    // Delete all groups
    await Group.deleteMany({});

    // Reset team stats and remove group assignments
    await Team.updateMany({}, {
      groupId: null,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });

    // Delete ALL matches (group + knockout)
    await Match.deleteMany({});

    return NextResponse.json({ message: 'Groups and all matches reset successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reset groups' }, { status: 500 });
  }
}

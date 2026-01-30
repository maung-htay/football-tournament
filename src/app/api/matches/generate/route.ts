import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import Match from '@/models/Match';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { defaultVenue, startDate } = await request.json();

    const groups = await Group.find({}).populate('teams');
    
    if (groups.length === 0) {
      return NextResponse.json({ error: 'No groups found. Please draw groups first.' }, { status: 400 });
    }

    // Delete existing group matches
    await Match.deleteMany({ round: 'group' });

    const matches: any[] = [];
    let matchDate = new Date(startDate);
    let timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30'];
    let slotIndex = 0;

    for (const group of groups) {
      const teams = group.teams;
      
      // Generate round-robin matches for this group
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            homeTeam: teams[i]._id,
            awayTeam: teams[j]._id,
            groupId: group._id,
            round: 'group',
            venue: defaultVenue || 'Main Stadium',
            matchDate: new Date(matchDate),
            matchTime: timeSlots[slotIndex],
            status: 'scheduled',
          });

          slotIndex++;
          if (slotIndex >= timeSlots.length) {
            slotIndex = 0;
            matchDate.setDate(matchDate.getDate() + 1);
          }
        }
      }
    }

    await Match.insertMany(matches);

    const createdMatches = await Match.find({ round: 'group' })
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('groupId')
      .sort({ matchDate: 1, matchTime: 1 });

    return NextResponse.json(createdMatches, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate matches' }, { status: 500 });
  }
}

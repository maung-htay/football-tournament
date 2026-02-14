import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Group from '@/models/Group';
import Match from '@/models/Match';

export async function DELETE() {
  try {
    await dbConnect();

    // Delete all matches first (due to references)
    await Match.deleteMany({});
    
    // Delete all groups
    await Group.deleteMany({});
    
    // Delete all teams
    await Team.deleteMany({});

    return NextResponse.json({ 
      success: true, 
      message: 'All teams, groups, and matches deleted' 
    });
  } catch (error) {
    console.error('Failed to delete all:', error);
    return NextResponse.json({ error: 'Failed to delete all' }, { status: 500 });
  }
}

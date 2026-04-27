import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import Team from '@/models/Team';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { groups } = await request.json();

    if (!groups || Object.keys(groups).length === 0) {
      return NextResponse.json({ error: 'No groups provided' }, { status: 400 });
    }

    // Delete existing groups
    await Group.deleteMany({});

    // Reset all team group assignments
    await Team.updateMany({}, { groupId: null });

    // Create new groups
    const createdGroups = [];
    for (const [groupName, teamIds] of Object.entries(groups)) {
      if (!Array.isArray(teamIds) || teamIds.length === 0) continue;

      const group = await Group.create({
        name: groupName,
        teams: teamIds,
      });

      // Update teams with group assignment
      await Team.updateMany(
        { _id: { $in: teamIds } },
        { groupId: group._id }
      );

      createdGroups.push(group);
    }

    // Fetch groups with populated teams
    const populatedGroups = await Group.find({}).populate('teams');

    return NextResponse.json(populatedGroups, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create groups' }, { status: 500 });
  }
}

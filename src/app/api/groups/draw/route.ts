import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import Team from '@/models/Team';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { groupCount, teamsPerGroup } = await request.json();

    // Get all teams without groups
    const teams = await Team.find({ groupId: null });
    
    if (teams.length < groupCount * teamsPerGroup) {
      return NextResponse.json(
        { error: `Need at least ${groupCount * teamsPerGroup} teams, but only have ${teams.length}` },
        { status: 400 }
      );
    }

    // Clear existing groups
    await Group.deleteMany({});
    await Team.updateMany({}, { groupId: null });

    // Shuffle teams
    const shuffledTeams = shuffleArray(teams);

    // Create groups
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const createdGroups = [];

    for (let i = 0; i < groupCount; i++) {
      const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
      const teamIds = groupTeams.map(t => t._id);

      const group = await Group.create({
        name: `Group ${groupNames[i]}`,
        teams: teamIds,
      });

      // Update teams with their group
      await Team.updateMany(
        { _id: { $in: teamIds } },
        { groupId: group._id }
      );

      createdGroups.push(group);
    }

    const populatedGroups = await Group.find({}).populate('teams');
    return NextResponse.json(populatedGroups, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to draw groups' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import Team from '@/models/Team';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const group = await Group.findById(params.id).populate('teams');
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { teams } = await request.json();

    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Remove old team assignments
    await Team.updateMany(
      { groupId: group._id },
      { groupId: null }
    );

    // Assign new teams
    await Team.updateMany(
      { _id: { $in: teams } },
      { groupId: group._id }
    );

    // Update group
    group.teams = teams;
    await group.save();

    const updatedGroup = await Group.findById(params.id).populate('teams');
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Remove team assignments
    await Team.updateMany(
      { groupId: params.id },
      { groupId: null }
    );

    const group = await Group.findByIdAndDelete(params.id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}

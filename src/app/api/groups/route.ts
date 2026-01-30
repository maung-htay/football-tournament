import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import Team from '@/models/Team';

export async function GET() {
  try {
    await dbConnect();
    const groups = await Group.find({}).populate({
      path: 'teams',
      options: { sort: { points: -1, goalsFor: -1 } }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const group = await Group.create(body);
    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Group already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Visitor from '@/models/Visitor';

// GET - Get visitor count
export async function GET() {
  try {
    await dbConnect();
    
    let visitor = await Visitor.findOne();
    if (!visitor) {
      visitor = await Visitor.create({ count: 0 });
    }
    
    return NextResponse.json({ count: visitor.count, lastReset: visitor.lastReset });
  } catch (error) {
    console.error('Failed to get visitor count:', error);
    return NextResponse.json({ error: 'Failed to get visitor count' }, { status: 500 });
  }
}

// POST - Increment visitor count
export async function POST() {
  try {
    await dbConnect();
    
    let visitor = await Visitor.findOne();
    if (!visitor) {
      visitor = await Visitor.create({ count: 1 });
    } else {
      visitor.count += 1;
      await visitor.save();
    }
    
    return NextResponse.json({ count: visitor.count });
  } catch (error) {
    console.error('Failed to increment visitor:', error);
    return NextResponse.json({ error: 'Failed to increment' }, { status: 500 });
  }
}

// DELETE - Reset visitor count (admin only)
export async function DELETE() {
  try {
    await dbConnect();
    
    let visitor = await Visitor.findOne();
    if (!visitor) {
      visitor = await Visitor.create({ count: 0 });
    } else {
      visitor.count = 0;
      visitor.lastReset = new Date();
      await visitor.save();
    }
    
    return NextResponse.json({ count: 0, lastReset: visitor.lastReset });
  } catch (error) {
    console.error('Failed to reset visitor count:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}

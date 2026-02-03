import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Team from '@/models/Team';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const match = await Match.findById(params.id)
      .populate('homeTeam')
      .populate('awayTeam');
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const existingMatch = await Match.findById(params.id);
    if (!existingMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Handle status change to live
    if (body.status === 'live' && existingMatch.status !== 'live') {
      body.startedAt = new Date();
      if (body.homeScore === undefined) body.homeScore = 0;
      if (body.awayScore === undefined) body.awayScore = 0;
    }

    // Handle status change to completed - update team stats
    if (body.status === 'completed' && body.homeScore !== undefined && body.awayScore !== undefined) {
      const homeTeam = await Team.findById(existingMatch.homeTeam);
      const awayTeam = await Team.findById(existingMatch.awayTeam);

      if (homeTeam && awayTeam) {
        // If match was already completed, reverse previous stats
        if (existingMatch.status === 'completed' && existingMatch.homeScore !== null) {
          const prevHomeScore = existingMatch.homeScore;
          const prevAwayScore = existingMatch.awayScore;

          homeTeam.played -= 1;
          homeTeam.goalsFor -= prevHomeScore;
          homeTeam.goalsAgainst -= prevAwayScore;
          
          if (prevHomeScore > prevAwayScore) {
            homeTeam.won -= 1;
            homeTeam.points -= 3;
          } else if (prevHomeScore < prevAwayScore) {
            homeTeam.lost -= 1;
          } else {
            homeTeam.drawn -= 1;
            homeTeam.points -= 1;
          }

          awayTeam.played -= 1;
          awayTeam.goalsFor -= prevAwayScore;
          awayTeam.goalsAgainst -= prevHomeScore;
          
          if (prevAwayScore > prevHomeScore) {
            awayTeam.won -= 1;
            awayTeam.points -= 3;
          } else if (prevAwayScore < prevHomeScore) {
            awayTeam.lost -= 1;
          } else {
            awayTeam.drawn -= 1;
            awayTeam.points -= 1;
          }
        }

        // Apply new stats only if completing the match
        if (body.status === 'completed') {
          const newHomeScore = body.homeScore;
          const newAwayScore = body.awayScore;

          homeTeam.played += 1;
          homeTeam.goalsFor += newHomeScore;
          homeTeam.goalsAgainst += newAwayScore;

          awayTeam.played += 1;
          awayTeam.goalsFor += newAwayScore;
          awayTeam.goalsAgainst += newHomeScore;

          if (newHomeScore > newAwayScore) {
            homeTeam.won += 1;
            homeTeam.points += 3;
            awayTeam.lost += 1;
          } else if (newHomeScore < newAwayScore) {
            awayTeam.won += 1;
            awayTeam.points += 3;
            homeTeam.lost += 1;
          } else {
            homeTeam.drawn += 1;
            awayTeam.drawn += 1;
            homeTeam.points += 1;
            awayTeam.points += 1;
          }

          body.completedAt = new Date();
        }

        await homeTeam.save();
        await awayTeam.save();
      }
    }

    const match = await Match.findByIdAndUpdate(params.id, body, { new: true })
      .populate('homeTeam')
      .populate('awayTeam');

    return NextResponse.json(match);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const match = await Match.findByIdAndDelete(params.id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Match deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}

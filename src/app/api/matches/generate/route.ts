import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Group from '@/models/Group';
import Match from '@/models/Match';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { 
      venues, 
      startDate, 
      startTime, 
      matchDuration = 15, 
      breakBetweenMatches = 5,
      restBetweenGames = 2 
    } = await request.json();

    const groups = await Group.find({}).populate('teams');
    
    if (groups.length === 0) {
      return NextResponse.json({ error: 'No groups found. Please draw groups first.' }, { status: 400 });
    }

    // Parse venues
    const venueList = venues.split(',').map((v: string) => v.trim()).filter((v: string) => v);
    if (venueList.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one venue.' }, { status: 400 });
    }

    // Delete existing group matches
    await Match.deleteMany({ round: 'group' });

    // Generate all match pairs
    const allMatchPairs: { homeTeam: string; awayTeam: string; groupId: string }[] = [];
    
    for (const group of groups) {
      const teams = group.teams;
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          allMatchPairs.push({
            homeTeam: teams[i]._id.toString(),
            awayTeam: teams[j]._id.toString(),
            groupId: group._id.toString(),
          });
        }
      }
    }

    // Shuffle matches for randomness
    for (let i = allMatchPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allMatchPairs[i], allMatchPairs[j]] = [allMatchPairs[j], allMatchPairs[i]];
    }

    // Schedule matches properly
    // Each time slot can have multiple matches (one per venue)
    // But a team can only play once per time slot
    // And a team must rest for 'restBetweenGames' time slots before playing again

    const matchInterval = matchDuration + breakBetweenMatches; // minutes between time slots
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    interface ScheduledMatch {
      match: { homeTeam: string; awayTeam: string; groupId: string };
      timeSlot: number;
      venue: string;
    }

    const scheduledMatches: ScheduledMatch[] = [];
    const teamLastTimeSlot: Record<string, number> = {}; // teamId -> last time slot played
    
    let remainingMatches = [...allMatchPairs];
    let currentTimeSlot = 0;
    const maxTimeSlots = allMatchPairs.length * 10; // Safety limit

    while (remainingMatches.length > 0 && currentTimeSlot < maxTimeSlots) {
      // For each time slot, try to schedule matches on each venue
      const teamsPlayingThisSlot = new Set<string>();
      
      for (let venueIdx = 0; venueIdx < venueList.length && remainingMatches.length > 0; venueIdx++) {
        // Find a match where both teams:
        // 1. Are not already playing in this time slot
        // 2. Have rested enough since their last game
        
        let matchFound = false;
        
        for (let i = 0; i < remainingMatches.length; i++) {
          const match = remainingMatches[i];
          const homeTeam = match.homeTeam;
          const awayTeam = match.awayTeam;
          
          // Check if either team is already playing this time slot
          if (teamsPlayingThisSlot.has(homeTeam) || teamsPlayingThisSlot.has(awayTeam)) {
            continue;
          }
          
          // Check rest requirement
          const homeLastSlot = teamLastTimeSlot[homeTeam] ?? -restBetweenGames;
          const awayLastSlot = teamLastTimeSlot[awayTeam] ?? -restBetweenGames;
          
          const homeRested = currentTimeSlot - homeLastSlot >= restBetweenGames;
          const awayRested = currentTimeSlot - awayLastSlot >= restBetweenGames;
          
          if (homeRested && awayRested) {
            // Schedule this match
            scheduledMatches.push({
              match,
              timeSlot: currentTimeSlot,
              venue: venueList[venueIdx],
            });
            
            teamsPlayingThisSlot.add(homeTeam);
            teamsPlayingThisSlot.add(awayTeam);
            teamLastTimeSlot[homeTeam] = currentTimeSlot;
            teamLastTimeSlot[awayTeam] = currentTimeSlot;
            
            remainingMatches.splice(i, 1);
            matchFound = true;
            break;
          }
        }
        
        // If no suitable match found for this venue, skip
        if (!matchFound) {
          continue;
        }
      }
      
      // Move to next time slot
      currentTimeSlot++;
    }

    // If there are still remaining matches (shouldn't happen normally), force schedule them
    if (remainingMatches.length > 0) {
      for (const match of remainingMatches) {
        const venueIdx = scheduledMatches.length % venueList.length;
        scheduledMatches.push({
          match,
          timeSlot: currentTimeSlot,
          venue: venueList[venueIdx],
        });
        currentTimeSlot++;
      }
    }

    // Convert to match documents with actual times
    const baseDate = new Date(startDate);
    baseDate.setHours(startHour, startMinute, 0, 0);

    const matchDocuments = scheduledMatches.map((scheduled) => {
      const matchTime = new Date(baseDate);
      matchTime.setMinutes(matchTime.getMinutes() + (scheduled.timeSlot * matchInterval));
      
      // If past 21:00, move to next day
      if (matchTime.getHours() >= 21) {
        const daysToAdd = Math.floor((matchTime.getHours() - startHour + 24) / 24);
        matchTime.setDate(baseDate.getDate() + daysToAdd);
        matchTime.setHours(startHour + ((matchTime.getHours() - startHour) % (21 - startHour)), matchTime.getMinutes(), 0, 0);
      }

      const hours = matchTime.getHours().toString().padStart(2, '0');
      const minutes = matchTime.getMinutes().toString().padStart(2, '0');

      return {
        homeTeam: scheduled.match.homeTeam,
        awayTeam: scheduled.match.awayTeam,
        groupId: scheduled.match.groupId,
        round: 'group',
        venue: scheduled.venue,
        matchDate: new Date(matchTime.toDateString()),
        matchTime: `${hours}:${minutes}`,
        status: 'scheduled',
      };
    });

    await Match.insertMany(matchDocuments);

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

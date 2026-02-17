import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Group from '@/models/Group';
import Team from '@/models/Team';

// Ensure models are registered
const _Team = Team;
const _Group = Group;

export async function POST() {
  try {
    await dbConnect();

    // Get all groups with their standings
    const groups = await Group.find({}).populate('teams');
    
    // Calculate standings for each group
    const groupStandings: Record<string, any[]> = {};
    
    for (const group of groups) {
      // Get all completed matches for this group
      const groupMatches = await Match.find({
        groupId: group._id,
        status: 'completed',
      });

      // Calculate standings
      const teamStats: Record<string, any> = {};
      
      for (const team of group.teams) {
        teamStats[team._id.toString()] = {
          team: team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        };
      }

      for (const match of groupMatches) {
        const homeId = match.homeTeam?.toString();
        const awayId = match.awayTeam?.toString();
        
        if (!homeId || !awayId || !teamStats[homeId] || !teamStats[awayId]) continue;

        teamStats[homeId].played++;
        teamStats[awayId].played++;
        teamStats[homeId].goalsFor += match.homeScore || 0;
        teamStats[homeId].goalsAgainst += match.awayScore || 0;
        teamStats[awayId].goalsFor += match.awayScore || 0;
        teamStats[awayId].goalsAgainst += match.homeScore || 0;

        if (match.homeScore > match.awayScore) {
          teamStats[homeId].won++;
          teamStats[homeId].points += 3;
          teamStats[awayId].lost++;
        } else if (match.homeScore < match.awayScore) {
          teamStats[awayId].won++;
          teamStats[awayId].points += 3;
          teamStats[homeId].lost++;
        } else {
          teamStats[homeId].drawn++;
          teamStats[awayId].drawn++;
          teamStats[homeId].points += 1;
          teamStats[awayId].points += 1;
        }
      }

      // Sort by points, then goal difference, then goals for
      const sorted = Object.values(teamStats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      });

      groupStandings[group.name] = sorted;
    }

    // Get all completed knockout matches for "Winner X" placeholders
    const completedKnockouts = await Match.find({
      round: { $ne: 'group' },
      status: 'completed',
      matchName: { $exists: true, $ne: '' },
    }).populate('homeTeam awayTeam');

    const matchWinners: Record<string, any> = {};
    const matchLosers: Record<string, any> = {};

    for (const match of completedKnockouts) {
      if (!match.matchName) continue;
      
      if (match.homeScore > match.awayScore) {
        matchWinners[match.matchName] = match.homeTeam;
        matchLosers[match.matchName] = match.awayTeam;
      } else if (match.awayScore > match.homeScore) {
        matchWinners[match.matchName] = match.awayTeam;
        matchLosers[match.matchName] = match.homeTeam;
      }
    }

    // Find all knockout matches with placeholders (even if team already assigned)
    const knockoutMatches = await Match.find({
      round: { $ne: 'group' },
      status: { $ne: 'completed' }, // Only update matches that haven't been played yet
      $or: [
        { homePlaceholder: { $exists: true, $ne: null, $ne: '' } },
        { awayPlaceholder: { $exists: true, $ne: null, $ne: '' } },
      ],
    });

    let resolved = 0;

    for (const match of knockoutMatches) {
      let updated = false;

      // Resolve home placeholder - always update based on current standings
      if (match.homePlaceholder) {
        const team = resolvePlaceholder(match.homePlaceholder, groupStandings, matchWinners, matchLosers);
        if (team) {
          const newTeamId = team._id.toString();
          const currentTeamId = match.homeTeam?.toString();
          
          // Update if team changed or not set
          if (newTeamId !== currentTeamId) {
            match.homeTeam = team._id;
            updated = true;
          }
        }
      }

      // Resolve away placeholder - always update based on current standings
      if (match.awayPlaceholder) {
        const team = resolvePlaceholder(match.awayPlaceholder, groupStandings, matchWinners, matchLosers);
        if (team) {
          const newTeamId = team._id.toString();
          const currentTeamId = match.awayTeam?.toString();
          
          // Update if team changed or not set
          if (newTeamId !== currentTeamId) {
            match.awayTeam = team._id;
            updated = true;
          }
        }
      }

      if (updated) {
        await match.save();
        resolved++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      resolved,
      message: resolved > 0 ? `Updated ${resolved} matches` : 'All teams are up to date'
    });
  } catch (error) {
    console.error('Failed to resolve placeholders:', error);
    return NextResponse.json({ error: 'Failed to resolve placeholders' }, { status: 500 });
  }
}

function resolvePlaceholder(
  placeholder: string, 
  groupStandings: Record<string, any[]>,
  matchWinners: Record<string, any>,
  matchLosers: Record<string, any>
): any | null {
  // Pattern: "Group A 1st" or "Group A 2nd"
  const groupMatch = placeholder.match(/^(Group [A-Z]) (1st|2nd|3rd|4th)$/);
  if (groupMatch) {
    const groupName = groupMatch[1];
    const position = groupMatch[2];
    const standings = groupStandings[groupName];
    
    if (!standings || standings.length === 0) return null;
    
    const posIndex = position === '1st' ? 0 : position === '2nd' ? 1 : position === '3rd' ? 2 : 3;
    return standings[posIndex]?.team || null;
  }

  // Pattern: "Winner R16-1" or "Winner QF1"
  const winnerMatch = placeholder.match(/^Winner (.+)$/);
  if (winnerMatch) {
    const matchName = winnerMatch[1];
    return matchWinners[matchName] || null;
  }

  // Pattern: "Loser SF1" (for 3rd place match)
  const loserMatch = placeholder.match(/^Loser (.+)$/);
  if (loserMatch) {
    const matchName = loserMatch[1];
    return matchLosers[matchName] || null;
  }

  return null;
}

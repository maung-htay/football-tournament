'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  manualRank?: number;
}

interface Group {
  _id: string;
  name: string;
  teams: Team[];
}

interface MatchEvent {
  team: 'home' | 'away';
  jerseyNumber: number;
}

interface Match {
  _id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homePlaceholder?: string;
  awayPlaceholder?: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  liveUrl?: string;
  groupId?: { name: string };
  round: string;
  matchName?: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  status: string;
  startedAt?: string;
  goalScorers?: MatchEvent[];
  yellowCards?: MatchEvent[];
  redCards?: MatchEvent[];
}

// Team display component - uses full name with logo
const TeamDisplay = ({ team, placeholder }: { team?: Team | null; placeholder?: string }) => {
  if (team) {
    return (
      <div className="flex flex-col items-center text-center">
        {team.logoUrl && (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="object-contain mb-1 rounded-full h-11 w-11 sm:w-12 sm:h-12"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <p className="text-sm font-bold leading-tight sm:text-base">{team.name}</p>
      </div>
    );
  }

  if (placeholder) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-10 h-10 mb-1 bg-gray-200 rounded-full sm:w-12 sm:h-12">
          <span className="text-xs text-gray-400">?</span>
        </div>
        <p className="text-sm font-medium text-gray-500 sm:text-base">{placeholder}</p>
      </div>
    );
  }

  return <span className="text-gray-400">TBD</span>;
};

// Timer component for live matches
const MatchTimer = ({ startedAt, durationMinutes }: { startedAt: string; durationMinutes: number }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setElapsed(elapsedSeconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const totalDurationSeconds = durationMinutes * 60;
  const isOvertime = elapsed >= totalDurationSeconds;

  return (
    <span className={`font-mono font-bold ${isOvertime ? 'text-red-600' : 'text-green-600'}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      {isOvertime && ' ⏰'}
    </span>
  );
};

// Stats Section Component
interface PlayerStat {
  teamId: string;
  teamName: string;
  jerseyNumber: number;
  count: number;
}

const StatsSection = ({ matches }: { matches: Match[] }) => {
  const calculateTopScorers = (): PlayerStat[] => {
    const statsMap: Record<string, PlayerStat> = {};

    matches.forEach(match => {
      if (match.status !== 'completed' && match.status !== 'live') return;

      const goals = match.goalScorers || [];
      goals.forEach(event => {
        const team = event.team === 'home' ? match.homeTeam : match.awayTeam;
        if (!team) return;

        const key = `${team._id}-${event.jerseyNumber}`;
        if (!statsMap[key]) {
          statsMap[key] = {
            teamId: team._id,
            teamName: team.name,
            jerseyNumber: event.jerseyNumber,
            count: 0,
          };
        }
        statsMap[key].count++;
      });
    });

    return Object.values(statsMap).sort((a, b) => b.count - a.count);
  };

  const topScorers = calculateTopScorers();
  const totalGoals = topScorers.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-4">
      {/* Total Goals Card */}
      <div className="p-6 text-center bg-white shadow rounded-xl">
        <p className="text-4xl font-bold text-green-600">{totalGoals}</p>
        <p className="mt-1 text-sm text-gray-500">⚽ Total Goals</p>
      </div>

      {/* Top 10 Scorers */}
      <div className="overflow-hidden bg-white shadow rounded-xl">
        <div className="px-4 py-3 text-sm font-bold text-white bg-green-600 sm:text-base">⚽ Top 10 Goal Scorers</div>
        {topScorers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No goals recorded yet</div>
        ) : (
          <div className="divide-y">
            {topScorers.slice(0, 10).map((player, idx) => (
              <div key={`${player.teamId}-${player.jerseyNumber}`} className={`flex items-center px-4 py-3 ${idx < 3 ? 'bg-yellow-50' : ''}`}>
                <span className="w-10 text-lg font-bold text-gray-500">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </span>
                <span className="font-bold text-green-600 w-14">#{player.jerseyNumber}</span>
                <span className="flex-1 text-sm">{player.teamName}</span>
                <span className="text-xl font-bold text-green-700">{player.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'bracket' | 'stats'>('matches');
  const [matchFilter, setMatchFilter] = useState<'live' | 'fixtures' | 'completed'>('fixtures');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [matchDuration, setMatchDuration] = useState(15);

  // Check if there are live matches
  const hasLiveMatches = matches.some(m => m.status === 'live');

  useEffect(() => {
    fetchData();
    fetchSettings();
    setShowContact(process.env.NEXT_PUBLIC_SHOW_CONTACT === 'true');

    // Track visitor (only once per session)
    if (typeof window !== 'undefined' && !sessionStorage.getItem('visited')) {
      fetch('/api/visitors', { method: 'POST' });
      sessionStorage.setItem('visited', 'true');
    }
  }, []);

  // Auto refresh only when live matches exist
  useEffect(() => {
    if (!hasLiveMatches) return;

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [hasLiveMatches]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setMatchDuration(data.matchDurationMinutes || 15);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [groupsRes, matchesRes, teamsRes] = await Promise.all([
        fetch('/api/groups', { cache: 'no-store' }),
        fetch('/api/matches', { cache: 'no-store' }),
        fetch('/api/teams', { cache: 'no-store' }),
      ]);
      const groupsData = await groupsRes.json();
      const matchesData = await matchesRes.json();
      const teamsData = await teamsRes.json();

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setGroups([]);
      setMatches([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = {
      group: 'Group Stage',
      round32: 'Round of 32',
      round16: 'Round of 16',
      quarter: 'Quarter Final',
      semi: 'Semi Final',
      third: '3rd Place',
      final: 'Final',
    };
    return labels[round] || round;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      live: 'bg-red-100 text-red-800 animate-pulse',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      scheduled: 'Scheduled',
      live: '🔴 LIVE',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredMatches = matches.filter((match) => {
    let statusMatch = true;
    if (matchFilter === 'live') statusMatch = match.status === 'live';
    if (matchFilter === 'fixtures') statusMatch = match.status === 'scheduled';
    if (matchFilter === 'completed') statusMatch = match.status === 'completed' || match.status === 'cancelled';

    let teamMatch = true;
    if (teamFilter !== 'all') {
      teamMatch = match.homeTeam?._id === teamFilter || match.awayTeam?._id === teamFilter;
    }

    return statusMatch && teamMatch;
  }).sort((a, b) => {
    // Convert time to minutes for proper comparison
    const parseTime = (time: string) => {
      const [h, m] = (time || '00:00').split(':').map(Number);
      return h * 60 + m;
    };

    if (matchFilter === 'completed') {
      // Completed: newest first (by date then time descending)
      const dateDiff = new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return parseTime(b.matchTime) - parseTime(a.matchTime);
    }
    // Fixtures/Live: earliest first (by date then time ascending)
    const dateDiff = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return parseTime(a.matchTime) - parseTime(b.matchTime);
  });

  const liveCount = matches.filter(m => m.status === 'live').length;

  // Knockout bracket data
  const matchesByRound = {
    round32: matches.filter(m => m.round === 'round32'),
    round16: matches.filter(m => m.round === 'round16'),
    quarter: matches.filter(m => m.round === 'quarter'),
    semi: matches.filter(m => m.round === 'semi'),
    third: matches.filter(m => m.round === 'third'),
    final: matches.filter(m => m.round === 'final'),
  };

  const hasKnockoutMatches = Object.values(matchesByRound).some(arr => arr.length > 0);

  const getTeamDisplayText = (match: Match, side: 'home' | 'away') => {
    const team = side === 'home' ? match.homeTeam : match.awayTeam;
    const placeholder = side === 'home' ? match.homePlaceholder : match.awayPlaceholder;
    if (team) return team.name;
    if (placeholder) return placeholder;
    return 'TBD';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-b-2 border-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="text-white bg-green-600 shadow-lg">
        <div className="max-w-6xl px-4 py-4 mx-auto sm:py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold sm:text-2xl">⚽ Football Tournament</h1>
            {showContact && (
              <Link href="/contact" className="text-sm text-green-100 hover:text-white">
                📞 Contact
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="max-w-6xl px-3 mx-auto mt-4 sm:px-4 sm:mt-6">
        <div className="flex p-1 space-x-1 bg-white rounded-lg shadow sm:space-x-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${activeTab === 'matches' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            📅 Matches
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${activeTab === 'standings' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            📊 Standings
          </button>
          {hasKnockoutMatches && (
            <button
              onClick={() => setActiveTab('bracket')}
              className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${activeTab === 'bracket' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              🏆 Bracket
            </button>
          )}
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${activeTab === 'stats' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            🏆 Stats
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl px-3 py-4 mx-auto sm:px-4 sm:py-6">
        {activeTab === 'matches' ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Team Filter */}
            <div className="p-2 bg-white rounded-lg shadow">
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">🔍 All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Match Filter Tabs */}
            <div className="flex p-1 space-x-1 bg-gray-100 rounded-lg sm:space-x-2">
              <button
                onClick={() => setMatchFilter('live')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2 ${matchFilter === 'live' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                🔴 Live
                {liveCount > 0 && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${matchFilter === 'live' ? 'bg-white text-red-500' : 'bg-red-500 text-white'
                    }`}>{liveCount}</span>
                )}
              </button>
              <button
                onClick={() => setMatchFilter('fixtures')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition ${matchFilter === 'fixtures' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                📅 Fixtures
              </button>
              <button
                onClick={() => setMatchFilter('completed')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition ${matchFilter === 'completed' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                ✓ Done
              </button>
            </div>

            {/* Match List */}
            {filteredMatches.length === 0 ? (
              <div className="py-8 text-center bg-white shadow sm:py-12 rounded-xl">
                <p className="text-sm text-gray-500 sm:text-base">
                  {matchFilter === 'live' && 'No live matches right now'}
                  {matchFilter === 'fixtures' && 'No upcoming matches scheduled'}
                  {matchFilter === 'completed' && 'No completed matches yet'}
                  {teamFilter !== 'all' && ' for this team'}
                </p>
              </div>
            ) : (
              filteredMatches.map((match) => (
                <div
                  key={match._id}
                  className={`bg-white rounded-xl shadow-md overflow-hidden ${match.status === 'live' ? 'ring-2 ring-red-400' : ''
                    }`}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 sm:px-4">
                    <span className="text-xs text-gray-600 sm:text-sm">
                      {getRoundLabel(match.round)}
                      {match.groupId && ` - ${match.groupId.name}`}
                      {match.matchName && ` (${match.matchName})`}
                    </span>
                    {getStatusBadge(match.status)}
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <TeamDisplay team={match.homeTeam} placeholder={match.homePlaceholder} />
                      </div>
                      <div className="px-2 sm:px-6 min-w-[80px] sm:min-w-[100px]">
                        {match.status === 'completed' || match.status === 'live' ? (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800 sm:text-3xl">
                              {match.homeScore} - {match.awayScore}
                            </div>
                            {match.homePenalty !== null && match.homePenalty !== undefined && (
                              <div className="text-sm font-medium text-purple-600">
                                ({match.homePenalty} - {match.awayPenalty} PEN)
                              </div>
                            )}
                            {match.status === 'live' && (
                              <div className="mt-1">
                                <p className="text-xs font-medium text-red-500 sm:text-sm animate-pulse">● LIVE</p>
                                {match.startedAt && (
                                  <MatchTimer startedAt={match.startedAt} durationMinutes={matchDuration} />
                                )}
                              </div>
                            )}
                          </div>
                        ) : match.status === 'cancelled' ? (
                          <div className="text-center text-gray-400">
                            <p className="text-sm">Cancelled</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-base font-medium text-gray-600 sm:text-lg">{match.matchTime}</p>
                            <p className="text-xs text-gray-400 sm:text-sm">{formatDate(match.matchDate)}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <TeamDisplay team={match.awayTeam} placeholder={match.awayPlaceholder} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 sm:mt-3 sm:text-sm">
                      <span>📍 {match.venue}</span>
                      {match.liveUrl && (
                        <a
                          href={match.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          📺 Live Stream
                        </a>
                      )}
                    </div>

                    {/* Goal Scorers & Cards */}
                    {(match.status === 'completed' || match.status === 'live') && (
                      (match.goalScorers?.length || match.yellowCards?.length || match.redCards?.length) ? (
                        <div className="grid grid-cols-2 gap-3 pt-3 mt-3 text-xs border-t border-gray-100">
                          {/* Home Team Events */}
                          <div className="space-y-1">
                            {match.goalScorers?.filter(g => g.team === 'home').length ? (
                              <p className="text-gray-600">
                                <span className="text-green-600">⚽</span> {match.goalScorers.filter(g => g.team === 'home').map(g => `#${g.jerseyNumber}`).join(', ')}
                              </p>
                            ) : null}
                            {match.yellowCards?.filter(c => c.team === 'home').length ? (
                              <p className="text-gray-600">
                                <span>🟨</span> {match.yellowCards.filter(c => c.team === 'home').map(c => `#${c.jerseyNumber}`).join(', ')}
                              </p>
                            ) : null}
                            {match.redCards?.filter(c => c.team === 'home').length ? (
                              <p className="text-gray-600">
                                <span>🟥</span> {match.redCards.filter(c => c.team === 'home').map(c => `#${c.jerseyNumber}`).join(', ')}
                              </p>
                            ) : null}
                          </div>
                          {/* Away Team Events */}
                          <div className="space-y-1 text-right">
                            {match.goalScorers?.filter(g => g.team === 'away').length ? (
                              <p className="text-gray-600">
                                {match.goalScorers.filter(g => g.team === 'away').map(g => `#${g.jerseyNumber}`).join(', ')} <span className="text-green-600">⚽</span>
                              </p>
                            ) : null}
                            {match.yellowCards?.filter(c => c.team === 'away').length ? (
                              <p className="text-gray-600">
                                {match.yellowCards.filter(c => c.team === 'away').map(c => `#${c.jerseyNumber}`).join(', ')} <span>🟨</span>
                              </p>
                            ) : null}
                            {match.redCards?.filter(c => c.team === 'away').length ? (
                              <p className="text-gray-600">
                                {match.redCards.filter(c => c.team === 'away').map(c => `#${c.jerseyNumber}`).join(', ')} <span>🟥</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'standings' ? (
          /* Standings Tab */
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {groups.length === 0 ? (
              <div className="col-span-2 py-8 text-center bg-white shadow sm:py-12 rounded-xl">
                <p className="text-gray-500">No groups created yet</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group._id} className="overflow-hidden bg-white shadow-md rounded-xl">
                  <div className="px-3 py-2 text-white bg-green-600 sm:px-4 sm:py-3">
                    <h3 className="text-sm font-bold sm:text-base">{group.name}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="text-gray-500 bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left sm:px-3">Team</th>
                          <th className="px-1 py-2 text-center sm:px-2">P</th>
                          <th className="px-1 py-2 text-center sm:px-2">W</th>
                          <th className="px-1 py-2 text-center sm:px-2">D</th>
                          <th className="px-1 py-2 text-center sm:px-2">L</th>
                          <th className="hidden px-1 py-2 text-center sm:px-2 sm:table-cell">GF</th>
                          <th className="hidden px-1 py-2 text-center sm:px-2 sm:table-cell">GA</th>
                          <th className="px-1 py-2 text-center sm:px-2">GD</th>
                          <th className="px-2 py-2 font-bold text-center sm:px-3">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.teams
                          .sort((a, b) => {
                            // 1. Sort by points first
                            if (b.points !== a.points) return b.points - a.points;

                            // 2. If points equal and both have manualRank, use manualRank
                            if (a.manualRank && b.manualRank) return a.manualRank - b.manualRank;

                            // 3. Then goal difference (if no manualRank)
                            const gdA = a.goalsFor - a.goalsAgainst;
                            const gdB = b.goalsFor - b.goalsAgainst;
                            if (gdB !== gdA) return gdB - gdA;

                            // 4. Then goals for
                            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

                            return 0;
                          })
                          .map((team, idx) => (
                            <tr key={team._id} className={`border-t ${idx < 2 ? 'bg-green-50' : ''}`}>
                              <td className="px-2 py-2 sm:px-3">
                                <div className="flex items-center gap-2">
                                  {team.logoUrl ? (
                                    <img
                                      src={team.logoUrl}
                                      alt={team.name}
                                      className="flex-shrink-0 object-contain w-6 h-6 rounded-full"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full"></div>
                                  )}
                                  <span className="font-medium">{team.name}</span>
                                </div>
                              </td>
                              <td className="px-1 py-2 text-center sm:px-2">{team.played}</td>
                              <td className="px-1 py-2 text-center sm:px-2">{team.won}</td>
                              <td className="px-1 py-2 text-center sm:px-2">{team.drawn}</td>
                              <td className="px-1 py-2 text-center sm:px-2">{team.lost}</td>
                              <td className="hidden px-1 py-2 text-center sm:px-2 sm:table-cell">{team.goalsFor}</td>
                              <td className="hidden px-1 py-2 text-center sm:px-2 sm:table-cell">{team.goalsAgainst}</td>
                              <td className="px-1 py-2 text-center sm:px-2">{team.goalsFor - team.goalsAgainst}</td>
                              <td className="px-2 py-2 font-bold text-center sm:px-3">{team.points}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-500 sm:px-4 bg-gray-50">
                    🟢 Top 2 advance
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'bracket' ? (
          /* Bracket Tab */
          <div className="p-4 overflow-x-auto bg-white shadow rounded-xl">
            <h3 className="mb-4 text-lg font-bold text-center">🏆 Knockout Stage</h3>
            <div className="flex justify-center gap-6 min-w-max">
              {(['round32', 'round16', 'quarter', 'semi', 'final'] as const).map(round => {
                const roundMatches = matchesByRound[round];
                if (roundMatches.length === 0) return null;

                return (
                  <div key={round} className="flex flex-col gap-4">
                    <h4 className="pb-2 text-sm font-bold text-center text-gray-600 border-b">
                      {getRoundLabel(round)}
                    </h4>
                    {roundMatches.map(match => {
                      const hasPenalty = match.homePenalty !== null && match.homePenalty !== undefined;
                      const homeWinsPen = hasPenalty && match.homePenalty! > match.awayPenalty!;
                      const awayWinsPen = hasPenalty && match.awayPenalty! > match.homePenalty!;
                      const homeWins = match.status === 'completed' && (
                        match.homeScore! > match.awayScore! ||
                        (match.homeScore === match.awayScore && homeWinsPen)
                      );
                      const awayWins = match.status === 'completed' && (
                        match.awayScore! > match.homeScore! ||
                        (match.homeScore === match.awayScore && awayWinsPen)
                      );

                      return (
                        <div
                          key={match._id}
                          className={`rounded-lg p-3 w-56 border-l-4 ${match.status === 'completed' ? 'bg-green-50 border-green-500' :
                            match.status === 'live' ? 'bg-red-50 border-red-500' :
                              'bg-gray-50 border-gray-300'
                            }`}
                        >
                          {match.matchName && <p className="mb-1 text-xs text-gray-500">{match.matchName}</p>}
                          <div className={`text-sm font-medium flex justify-between ${homeWins ? 'text-green-700' : ''}`}>
                            <span className="flex-1 truncate">{getTeamDisplayText(match, 'home')}</span>
                            {(match.status === 'completed' || match.status === 'live') && (
                              <span className="ml-2 font-bold">
                                {match.homeScore}
                                {hasPenalty && <span className="ml-1 text-xs text-purple-600">({match.homePenalty})</span>}
                              </span>
                            )}
                          </div>
                          <div className={`text-sm font-medium flex justify-between ${awayWins ? 'text-green-700' : ''}`}>
                            <span className="flex-1 truncate">{getTeamDisplayText(match, 'away')}</span>
                            {(match.status === 'completed' || match.status === 'live') && (
                              <span className="ml-2 font-bold">
                                {match.awayScore}
                                {hasPenalty && <span className="ml-1 text-xs text-purple-600">({match.awayPenalty})</span>}
                              </span>
                            )}
                          </div>
                          {hasPenalty && (
                            <p className="mt-1 text-xs font-medium text-center text-purple-600">Penalties: {match.homePenalty} - {match.awayPenalty}</p>
                          )}
                          <div className="flex justify-between mt-2 text-xs text-gray-400">
                            <span>{match.venue}</span>
                            <span>{match.matchTime}</span>
                          </div>
                          {match.status === 'live' && (
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs font-medium text-red-500 animate-pulse">● LIVE</p>
                              {match.liveUrl && (
                                <a href={match.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">📺 Stream</a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* 3rd Place */}
              {matchesByRound.third.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h4 className="pb-2 text-sm font-bold text-center text-gray-600 border-b">3rd Place</h4>
                  {matchesByRound.third.map(match => (
                    <div
                      key={match._id}
                      className={`rounded-lg p-3 w-52 border-l-4 ${match.status === 'completed' ? 'bg-amber-50 border-amber-500' :
                        match.status === 'live' ? 'bg-red-50 border-red-500' :
                          'bg-gray-50 border-gray-300'
                        }`}
                    >
                      <div className="flex justify-between text-sm font-medium">
                        <span className="flex-1 truncate">{getTeamDisplayText(match, 'home')}</span>
                        {(match.status === 'completed' || match.status === 'live') && (
                          <span className="ml-2 font-bold">{match.homeScore}</span>
                        )}
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="flex-1 truncate">{getTeamDisplayText(match, 'away')}</span>
                        {(match.status === 'completed' || match.status === 'live') && (
                          <span className="ml-2 font-bold">{match.awayScore}</span>
                        )}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{match.venue}</span>
                        <span>{match.matchTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'stats' ? (
          <StatsSection matches={matches} />
        ) : null}
      </div>
    </main>
  );
}

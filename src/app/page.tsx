'use client';

import { useState, useEffect } from 'react';

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
}

interface Group {
  _id: string;
  name: string;
  teams: Team[];
}

interface Match {
  _id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  groupId?: { name: string };
  round: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  status: string;
}

// Team display component - shows logo if available, otherwise team name
const TeamDisplay = ({ team, showName = false, size = 'md' }: { team: Team | null; showName?: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  if (!team) {
    return <span className="text-gray-400">TBD</span>;
  }

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-12 h-12 sm:w-16 sm:h-16',
  };

  return (
    <div className="flex flex-col items-center">
      {team.logoUrl ? (
        <img 
          src={team.logoUrl} 
          alt={team.name}
          className={`${sizeClasses[size]} object-contain mb-1`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-gray-200 rounded-full flex items-center justify-center mb-1`}>
          <span className="text-xs sm:text-sm font-bold text-gray-500">{team.shortName.slice(0, 2)}</span>
        </div>
      )}
      <p className="font-bold text-sm sm:text-lg">{team.shortName}</p>
      {showName && <p className="text-xs text-gray-500 hidden sm:block">{team.name}</p>}
    </div>
  );
};

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  const [matchFilter, setMatchFilter] = useState<'live' | 'fixtures' | 'completed'>('fixtures');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, matchesRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/matches'),
      ]);
      const groupsData = await groupsRes.json();
      const matchesData = await matchesRes.json();
      
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setGroups([]);
      setMatches([]);
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
    if (matchFilter === 'live') return match.status === 'live';
    if (matchFilter === 'fixtures') return match.status === 'scheduled';
    if (matchFilter === 'completed') return match.status === 'completed' || match.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    if (matchFilter === 'completed') {
      return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
    }
    return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
  });

  const liveCount = matches.filter(m => m.status === 'live').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold">⚽ Football Tournament</h1>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        <div className="flex space-x-2 bg-white rounded-lg p-1 shadow">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'matches'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 Matches
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'standings'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 Standings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === 'matches' ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Match Filter Tabs */}
            <div className="flex space-x-1 sm:space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMatchFilter('live')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2 ${
                  matchFilter === 'live'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔴 Live
                {liveCount > 0 && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                    matchFilter === 'live' ? 'bg-white text-red-500' : 'bg-red-500 text-white'
                  }`}>
                    {liveCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMatchFilter('fixtures')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition ${
                  matchFilter === 'fixtures'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 Fixtures
              </button>
              <button
                onClick={() => setMatchFilter('completed')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition ${
                  matchFilter === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✓ Done
              </button>
            </div>

            {/* Match List */}
            {filteredMatches.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow">
                <p className="text-gray-500 text-sm sm:text-base">
                  {matchFilter === 'live' && 'No live matches right now'}
                  {matchFilter === 'fixtures' && 'No upcoming matches scheduled'}
                  {matchFilter === 'completed' && 'No completed matches yet'}
                </p>
              </div>
            ) : (
              filteredMatches.map((match) => (
                <div
                  key={match._id}
                  className={`bg-white rounded-xl shadow-md overflow-hidden ${
                    match.status === 'live' ? 'ring-2 ring-red-400' : ''
                  }`}
                >
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 flex justify-between items-center border-b">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {getRoundLabel(match.round)}
                      {match.groupId && ` - ${match.groupId.name}`}
                    </span>
                    {getStatusBadge(match.status)}
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex-1 text-center">
                        <TeamDisplay team={match.homeTeam} showName />
                      </div>

                      {/* Score / Time */}
                      <div className="px-2 sm:px-6 min-w-[80px] sm:min-w-[100px]">
                        {match.status === 'completed' || match.status === 'live' ? (
                          <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                              {match.homeScore} - {match.awayScore}
                            </div>
                            {match.status === 'live' && (
                              <p className="text-red-500 text-xs sm:text-sm font-medium animate-pulse mt-1">● LIVE</p>
                            )}
                          </div>
                        ) : match.status === 'cancelled' ? (
                          <div className="text-center text-gray-400">
                            <p className="text-sm">Cancelled</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-base sm:text-lg font-medium text-gray-600">{match.matchTime}</p>
                            <p className="text-xs sm:text-sm text-gray-400">{formatDate(match.matchDate)}</p>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 text-center">
                        <TeamDisplay team={match.awayTeam} showName />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-gray-500">
                      📍 {match.venue}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Standings Tab */
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {groups.length === 0 ? (
              <div className="col-span-2 text-center py-8 sm:py-12 bg-white rounded-xl shadow">
                <p className="text-gray-500">No groups created yet</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3">
                    <h3 className="font-bold text-sm sm:text-base">{group.name}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 text-left">Team</th>
                          <th className="px-1 sm:px-2 py-2 text-center">P</th>
                          <th className="px-1 sm:px-2 py-2 text-center">W</th>
                          <th className="px-1 sm:px-2 py-2 text-center">D</th>
                          <th className="px-1 sm:px-2 py-2 text-center">L</th>
                          <th className="px-1 sm:px-2 py-2 text-center hidden sm:table-cell">GF</th>
                          <th className="px-1 sm:px-2 py-2 text-center hidden sm:table-cell">GA</th>
                          <th className="px-1 sm:px-2 py-2 text-center">GD</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-bold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.teams
                          .sort((a, b) => {
                            if (b.points !== a.points) return b.points - a.points;
                            const gdA = a.goalsFor - a.goalsAgainst;
                            const gdB = b.goalsFor - b.goalsAgainst;
                            if (gdB !== gdA) return gdB - gdA;
                            return b.goalsFor - a.goalsFor;
                          })
                          .map((team, idx) => (
                            <tr
                              key={team._id}
                              className={`border-t ${idx < 2 ? 'bg-green-50' : ''}`}
                            >
                              <td className="px-2 sm:px-3 py-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  {team.logoUrl ? (
                                    <img src={team.logoUrl} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                                  ) : (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-[8px] sm:text-[10px] font-bold text-gray-500">{team.shortName.slice(0, 2)}</span>
                                    </div>
                                  )}
                                  <span className="font-medium">{team.shortName}</span>
                                </div>
                              </td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.played}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.won}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.drawn}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.lost}</td>
                              <td className="px-1 sm:px-2 py-2 text-center hidden sm:table-cell">{team.goalsFor}</td>
                              <td className="px-1 sm:px-2 py-2 text-center hidden sm:table-cell">{team.goalsAgainst}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">
                                {team.goalsFor - team.goalsAgainst}
                              </td>
                              <td className="px-2 sm:px-3 py-2 text-center font-bold">{team.points}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-gray-50 text-xs text-gray-500">
                    🟢 Top 2 advance
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

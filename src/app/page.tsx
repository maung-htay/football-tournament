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
}

interface Group {
  _id: string;
  name: string;
  teams: Team[];
}

interface Match {
  _id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homePlaceholder?: string;
  awayPlaceholder?: string;
  homeScore: number | null;
  awayScore: number | null;
  groupId?: { name: string };
  round: string;
  matchName?: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  status: string;
}

// Team display component - uses full name only, no logo
const TeamDisplay = ({ team, placeholder }: { team?: Team | null; placeholder?: string }) => {
  if (team) {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="font-bold text-sm sm:text-base leading-tight">{team.name}</p>
      </div>
    );
  }
  
  if (placeholder) {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="font-medium text-sm sm:text-base text-gray-500">{placeholder}</p>
      </div>
    );
  }
  
  return <span className="text-gray-400">TBD</span>;
};

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  const [matchFilter, setMatchFilter] = useState<'live' | 'fixtures' | 'completed'>('fixtures');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetchData();
    setShowContact(process.env.NEXT_PUBLIC_SHOW_CONTACT === 'true');
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, matchesRes, teamsRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/matches'),
        fetch('/api/teams'),
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
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold">⚽ Football Tournament</h1>
            {showContact && (
              <Link href="/contact" className="text-green-100 hover:text-white text-sm">
                📞 Contact
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        <div className="flex space-x-2 bg-white rounded-lg p-1 shadow">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'matches' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 Matches
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition text-sm sm:text-base ${
              activeTab === 'standings' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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
            {/* Team Filter */}
            <div className="bg-white rounded-lg p-2 shadow">
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="all">🔍 All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Match Filter Tabs */}
            <div className="flex space-x-1 sm:space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMatchFilter('live')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2 ${
                  matchFilter === 'live' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔴 Live
                {liveCount > 0 && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                    matchFilter === 'live' ? 'bg-white text-red-500' : 'bg-red-500 text-white'
                  }`}>{liveCount}</span>
                )}
              </button>
              <button
                onClick={() => setMatchFilter('fixtures')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition ${
                  matchFilter === 'fixtures' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 Fixtures
              </button>
              <button
                onClick={() => setMatchFilter('completed')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition ${
                  matchFilter === 'completed' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-200'
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
                  {teamFilter !== 'all' && ' for this team'}
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
                      <div className="flex-1">
                        <TeamDisplay team={match.awayTeam} placeholder={match.awayPlaceholder} />
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
                            <tr key={team._id} className={`border-t ${idx < 2 ? 'bg-green-50' : ''}`}>
                              <td className="px-2 sm:px-3 py-2">
                                <span className="font-medium">{team.name}</span>
                              </td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.played}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.won}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.drawn}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.lost}</td>
                              <td className="px-1 sm:px-2 py-2 text-center hidden sm:table-cell">{team.goalsFor}</td>
                              <td className="px-1 sm:px-2 py-2 text-center hidden sm:table-cell">{team.goalsAgainst}</td>
                              <td className="px-1 sm:px-2 py-2 text-center">{team.goalsFor - team.goalsAgainst}</td>
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

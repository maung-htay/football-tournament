'use client';

import { useState, useEffect } from 'react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
}

interface MatchEvent {
  team: 'home' | 'away';
  jerseyNumber: number;
}

interface Match {
  _id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  status: string;
  goalScorers?: MatchEvent[];
  yellowCards?: MatchEvent[];
  redCards?: MatchEvent[];
}

interface PlayerStat {
  teamId: string;
  teamName: string;
  jerseyNumber: number;
  count: number;
}

export default function StatsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'yellow' | 'red'>('goals');

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const calculateStats = (type: 'goal' | 'yellow' | 'red'): PlayerStat[] => {
    const statsMap: Record<string, PlayerStat> = {};

    matches.forEach(match => {
      if (match.status !== 'completed' && match.status !== 'live') return;

      let events: MatchEvent[] = [];
      if (type === 'goal') events = match.goalScorers || [];
      else if (type === 'yellow') events = match.yellowCards || [];
      else events = match.redCards || [];

      events.forEach(event => {
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

  const topScorers = calculateStats('goal');
  const yellowCardStats = calculateStats('yellow');
  const redCardStats = calculateStats('red');

  const totalGoals = topScorers.reduce((sum, p) => sum + p.count, 0);
  const totalYellows = yellowCardStats.reduce((sum, p) => sum + p.count, 0);
  const totalReds = redCardStats.reduce((sum, p) => sum + p.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tournament Stats</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{totalGoals}</p>
          <p className="text-sm text-gray-500">⚽ Goals</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-yellow-500">{totalYellows}</p>
          <p className="text-sm text-gray-500">🟨 Yellow</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{totalReds}</p>
          <p className="text-sm text-gray-500">🟥 Red</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            activeTab === 'goals' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⚽ Top Scorers
        </button>
        <button
          onClick={() => setActiveTab('yellow')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            activeTab === 'yellow' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          🟨 Yellow Cards
        </button>
        <button
          onClick={() => setActiveTab('red')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            activeTab === 'red' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          🟥 Red Cards
        </button>
      </div>

      {/* Stats Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {activeTab === 'goals' && (
          <>
            <div className="bg-green-600 text-white px-4 py-3 font-bold">⚽ Top Goal Scorers</div>
            {topScorers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No goals recorded yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Jersey</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Team</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Goals</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.slice(0, 20).map((player, idx) => (
                    <tr key={`${player.teamId}-${player.jerseyNumber}`} className={`border-t ${idx < 3 ? 'bg-yellow-50' : ''}`}>
                      <td className="px-4 py-3 font-medium">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600">#{player.jerseyNumber}</td>
                      <td className="px-4 py-3">{player.teamName}</td>
                      <td className="px-4 py-3 text-center font-bold text-lg">{player.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'yellow' && (
          <>
            <div className="bg-yellow-500 text-white px-4 py-3 font-bold">🟨 Yellow Cards</div>
            {yellowCardStats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No yellow cards recorded yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Jersey</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Team</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {yellowCardStats.map((player, idx) => (
                    <tr key={`${player.teamId}-${player.jerseyNumber}`} className="border-t">
                      <td className="px-4 py-3 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-yellow-600">#{player.jerseyNumber}</td>
                      <td className="px-4 py-3">{player.teamName}</td>
                      <td className="px-4 py-3 text-center font-bold">{player.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'red' && (
          <>
            <div className="bg-red-600 text-white px-4 py-3 font-bold">🟥 Red Cards</div>
            {redCardStats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No red cards recorded yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Jersey</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Team</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {redCardStats.map((player, idx) => (
                    <tr key={`${player.teamId}-${player.jerseyNumber}`} className="border-t">
                      <td className="px-4 py-3 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-red-600">#{player.jerseyNumber}</td>
                      <td className="px-4 py-3">{player.teamName}</td>
                      <td className="px-4 py-3 text-center font-bold">{player.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

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

export default function StandingsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchGroups();
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchGroups, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Group Standings</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Auto-refresh: 10s
          {lastUpdated && (
            <span className="text-xs">
              (Updated: {lastUpdated.toLocaleTimeString()})
            </span>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <p className="text-4xl mb-4">📊</p>
          <p>No groups created yet</p>
          <p className="text-sm mt-2">Please draw groups first</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3">
                <h3 className="font-bold text-sm sm:text-base">{group.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left">#</th>
                      <th className="px-2 sm:px-3 py-2 text-left">Team</th>
                      <th className="px-1 sm:px-2 py-2 text-center">P</th>
                      <th className="px-1 sm:px-2 py-2 text-center">W</th>
                      <th className="px-1 sm:px-2 py-2 text-center">D</th>
                      <th className="px-1 sm:px-2 py-2 text-center">L</th>
                      <th className="px-1 sm:px-2 py-2 text-center">GF</th>
                      <th className="px-1 sm:px-2 py-2 text-center">GA</th>
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
                          <td className="px-2 sm:px-3 py-2 font-medium text-gray-500">{idx + 1}</td>
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {team.logoUrl && (
                                <img src={team.logoUrl} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                              )}
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </td>
                          <td className="px-1 sm:px-2 py-2 text-center">{team.played}</td>
                          <td className="px-1 sm:px-2 py-2 text-center text-green-600 font-medium">{team.won}</td>
                          <td className="px-1 sm:px-2 py-2 text-center text-gray-500">{team.drawn}</td>
                          <td className="px-1 sm:px-2 py-2 text-center text-red-500">{team.lost}</td>
                          <td className="px-1 sm:px-2 py-2 text-center">{team.goalsFor}</td>
                          <td className="px-1 sm:px-2 py-2 text-center">{team.goalsAgainst}</td>
                          <td className="px-1 sm:px-2 py-2 text-center">
                            <span className={team.goalsFor - team.goalsAgainst > 0 ? 'text-green-600' : team.goalsFor - team.goalsAgainst < 0 ? 'text-red-500' : ''}>
                              {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}{team.goalsFor - team.goalsAgainst}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-center font-bold text-lg">{team.points}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 sm:px-4 py-2 bg-gray-50 text-xs text-gray-500 flex justify-between">
                <span>🟢 Top 2 advance to knockout</span>
                <span>{group.teams.length} teams</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <h4 className="font-bold text-blue-800 mb-2">📋 Ranking Rules</h4>
        <ol className="text-blue-700 space-y-1 list-decimal list-inside">
          <li>Points (Win: 3, Draw: 1, Loss: 0)</li>
          <li>Goal Difference (GF - GA)</li>
          <li>Goals Scored (GF)</li>
        </ol>
      </div>
    </div>
  );
}

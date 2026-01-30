'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Team {
  _id: string;
  name: string;
  shortName: string;
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

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'groups'>('matches');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, matchesRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/matches'),
      ]);
      const groupsData = await groupsRes.json();
      const matchesData = await matchesRes.json();
      
      // Ensure we always set arrays, even if API returns error object
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
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = {
      group: 'グループステージ',
      round16: 'ラウンド16',
      quarter: '準々決勝',
      semi: '準決勝',
      third: '3位決定戦',
      final: '決勝',
    };
    return labels[round] || round;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      live: 'bg-red-100 text-red-800 animate-pulse',
      completed: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      scheduled: '予定',
      live: 'LIVE',
      completed: '終了',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">⚽ フットボール大会</h1>
              <p className="text-green-100 text-sm mt-1">Football Tournament</p>
            </div>
            <Link
              href="/admin"
              className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg text-sm transition"
            >
              管理者ページ
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex space-x-2 bg-white rounded-lg p-1 shadow">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'matches'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 試合一覧
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'groups'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 グループ順位
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'matches' ? (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <p className="text-gray-500">まだ試合がありません</p>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b">
                    <span className="text-sm text-gray-600">
                      {getRoundLabel(match.round)}
                      {match.groupId && ` - ${match.groupId.name}`}
                    </span>
                    {getStatusBadge(match.status)}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex-1 text-center">
                        <p className="font-bold text-lg">{match.homeTeam?.shortName || 'TBD'}</p>
                        <p className="text-sm text-gray-500">{match.homeTeam?.name || 'To Be Decided'}</p>
                      </div>

                      {/* Score */}
                      <div className="px-6">
                        {match.status === 'completed' || match.status === 'live' ? (
                          <div className="text-3xl font-bold text-gray-800">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-lg font-medium text-gray-600">{match.matchTime}</p>
                            <p className="text-sm text-gray-400">{formatDate(match.matchDate)}</p>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 text-center">
                        <p className="font-bold text-lg">{match.awayTeam?.shortName || 'TBD'}</p>
                        <p className="text-sm text-gray-500">{match.awayTeam?.name || 'To Be Decided'}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-center text-sm text-gray-500">
                      📍 {match.venue}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {groups.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-xl shadow">
                <p className="text-gray-500">まだグループがありません</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-green-600 text-white px-4 py-3">
                    <h3 className="font-bold">{group.name}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left">チーム</th>
                          <th className="px-2 py-2 text-center">試</th>
                          <th className="px-2 py-2 text-center">勝</th>
                          <th className="px-2 py-2 text-center">分</th>
                          <th className="px-2 py-2 text-center">負</th>
                          <th className="px-2 py-2 text-center">得</th>
                          <th className="px-2 py-2 text-center">失</th>
                          <th className="px-2 py-2 text-center">差</th>
                          <th className="px-3 py-2 text-center font-bold">点</th>
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
                              <td className="px-3 py-2">
                                <span className="font-medium">{team.shortName}</span>
                                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                                  {team.name}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center text-sm">{team.played}</td>
                              <td className="px-2 py-2 text-center text-sm">{team.won}</td>
                              <td className="px-2 py-2 text-center text-sm">{team.drawn}</td>
                              <td className="px-2 py-2 text-center text-sm">{team.lost}</td>
                              <td className="px-2 py-2 text-center text-sm">{team.goalsFor}</td>
                              <td className="px-2 py-2 text-center text-sm">{team.goalsAgainst}</td>
                              <td className="px-2 py-2 text-center text-sm">
                                {team.goalsFor - team.goalsAgainst}
                              </td>
                              <td className="px-3 py-2 text-center font-bold">{team.points}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                    🟢 上位2チームが決勝トーナメント進出
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

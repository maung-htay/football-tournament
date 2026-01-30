'use client';

import { useState, useEffect } from 'react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
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

export default function ScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{ home: number; away: number }>({ home: 0, away: 0 });

  useEffect(() => {
    fetchMatches();
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

  const handleEditClick = (match: Match) => {
    setEditingMatch(match._id);
    setScores({
      home: match.homeScore ?? 0,
      away: match.awayScore ?? 0,
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateScore = async (matchId: string) => {
    setUpdating(matchId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: scores.home,
          awayScore: scores.away,
        }),
      });

      if (!res.ok) throw new Error('Failed to update score');

      setSuccess('スコアを更新しました。順位も自動更新されました。');
      setEditingMatch(null);
      fetchMatches();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = {
      group: 'グループ',
      round16: 'R16',
      quarter: '準々',
      semi: '準決',
      third: '3位',
      final: '決勝',
    };
    return labels[round] || round;
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === 'scheduled') return match.status === 'scheduled';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800">スコア入力</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            予定
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            終了
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            試合がありません
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div
              key={match._id}
              className="bg-white rounded-xl shadow overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-2 flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {formatDate(match.matchDate)} {match.matchTime} | {match.venue}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  match.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {getRoundLabel(match.round)}
                  {match.groupId && ` ${match.groupId.name}`}
                </span>
              </div>

              <div className="p-4">
                {editingMatch === match._id ? (
                  // Edit Mode
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="font-bold text-lg">{match.homeTeam?.shortName}</p>
                      <input
                        type="number"
                        min="0"
                        value={scores.home}
                        onChange={(e) => setScores({ ...scores, home: parseInt(e.target.value) || 0 })}
                        className="w-20 text-center text-2xl font-bold border-2 border-orange-300 rounded-lg py-2 mt-2"
                      />
                    </div>
                    <span className="text-2xl text-gray-400">-</span>
                    <div className="text-center">
                      <p className="font-bold text-lg">{match.awayTeam?.shortName}</p>
                      <input
                        type="number"
                        min="0"
                        value={scores.away}
                        onChange={(e) => setScores({ ...scores, away: parseInt(e.target.value) || 0 })}
                        className="w-20 text-center text-2xl font-bold border-2 border-orange-300 rounded-lg py-2 mt-2"
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-center">
                    <div className="flex-1 text-center">
                      <p className="font-bold text-lg">{match.homeTeam?.shortName}</p>
                      <p className="text-sm text-gray-500">{match.homeTeam?.name}</p>
                    </div>
                    <div className="px-6">
                      {match.status === 'completed' ? (
                        <div className="text-3xl font-bold">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="text-2xl text-gray-300">- : -</div>
                      )}
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-bold text-lg">{match.awayTeam?.shortName}</p>
                      <p className="text-sm text-gray-500">{match.awayTeam?.name}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex justify-center gap-2">
                  {editingMatch === match._id ? (
                    <>
                      <button
                        onClick={() => handleUpdateScore(match._id)}
                        disabled={updating === match._id}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {updating === match._id ? '更新中...' : '✓ 確定'}
                      </button>
                      <button
                        onClick={() => setEditingMatch(null)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEditClick(match)}
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                    >
                      ⚽ スコア入力
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-gray-500">
        表示中: {filteredMatches.length}試合 / 全{matches.length}試合
      </div>
    </div>
  );
}

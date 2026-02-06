'use client';

import { useState, useEffect } from 'react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
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

const TeamDisplay = ({ team }: { team: Team | null }) => {
  if (!team) return <span className="text-gray-400">TBD</span>;
  
  return (
    <div className="flex flex-col items-center text-center">
      {team.logoUrl && (
        <img src={team.logoUrl} alt={team.name} className="w-10 h-10 sm:w-12 sm:h-12 object-contain mb-1" />
      )}
      <p className="font-bold text-sm sm:text-base leading-tight">{team.name}</p>
    </div>
  );
};

export default function ScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');

  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{ home: number; away: number }>({ home: 0, away: 0 });

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 10000);
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

  const handleStartMatch = async (matchId: string) => {
    setUpdating(matchId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'live', homeScore: 0, awayScore: 0 }),
      });

      if (!res.ok) throw new Error('Failed to start match');
      setSuccess('Match started!');
      fetchMatches();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleEditClick = (match: Match) => {
    setEditingMatch(match._id);
    setScores({ home: match.homeScore ?? 0, away: match.awayScore ?? 0 });
    setError('');
    setSuccess('');
  };

  const handleUpdateScore = async (matchId: string, complete: boolean = false) => {
    setUpdating(matchId);
    setError('');
    setSuccess('');

    try {
      const body: any = { homeScore: scores.home, awayScore: scores.away };
      if (complete) body.status = 'completed';

      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update');
      setSuccess(complete ? 'Match completed!' : 'Score updated');
      setEditingMatch(null);
      fetchMatches();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = { group: 'Group', round32: 'R32', round16: 'R16', quarter: 'QF', semi: 'SF', third: '3rd', final: 'Final' };
    return labels[round] || round;
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === 'scheduled') return match.status === 'scheduled';
    if (filter === 'live') return match.status === 'live';
    if (filter === 'completed') return match.status === 'completed';
    return match.status !== 'cancelled';
  }).sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
  });

  const liveCount = matches.filter(m => m.status === 'live').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Score Management</h2>
      
      {/* Filter buttons */}
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}>All</button>
        <button onClick={() => setFilter('scheduled')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${filter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Scheduled</button>
        <button onClick={() => setFilter('live')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1 ${filter === 'live' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
          🔴 Live {liveCount > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === 'live' ? 'bg-white text-red-600' : 'bg-red-500 text-white'}`}>{liveCount}</span>}
        </button>
        <button onClick={() => setFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Completed</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">No matches found</div>
        ) : (
          filteredMatches.map((match) => (
            <div key={match._id} className={`bg-white rounded-xl shadow overflow-hidden ${match.status === 'live' ? 'ring-2 ring-red-400' : ''}`}>
              <div className="bg-gray-50 px-3 sm:px-4 py-2 flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600">{formatDate(match.matchDate)} {match.matchTime} | {match.venue}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  match.status === 'live' ? 'bg-red-100 text-red-800 animate-pulse' :
                  match.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {match.status === 'live' ? '🔴 LIVE' : match.status.toUpperCase()}
                </span>
              </div>

              <div className="p-3 sm:p-4">
                {editingMatch === match._id ? (
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <div className="text-center">
                      <TeamDisplay team={match.homeTeam} />
                      <input
                        type="number"
                        min="0"
                        value={scores.home}
                        onChange={(e) => setScores({ ...scores, home: parseInt(e.target.value) || 0 })}
                        className="w-16 sm:w-20 text-center text-xl sm:text-2xl font-bold border-2 border-orange-300 rounded-lg py-2 mt-2"
                      />
                    </div>
                    <span className="text-xl sm:text-2xl text-gray-400">-</span>
                    <div className="text-center">
                      <TeamDisplay team={match.awayTeam} />
                      <input
                        type="number"
                        min="0"
                        value={scores.away}
                        onChange={(e) => setScores({ ...scores, away: parseInt(e.target.value) || 0 })}
                        className="w-16 sm:w-20 text-center text-xl sm:text-2xl font-bold border-2 border-orange-300 rounded-lg py-2 mt-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="flex-1 text-center">
                      <TeamDisplay team={match.homeTeam} />
                    </div>
                    <div className="px-3 sm:px-6">
                      {match.status === 'completed' || match.status === 'live' ? (
                        <div className="text-2xl sm:text-3xl font-bold">{match.homeScore} - {match.awayScore}</div>
                      ) : (
                        <div className="text-xl sm:text-2xl text-gray-300">vs</div>
                      )}
                      {match.status === 'live' && <p className="text-red-500 text-xs font-medium animate-pulse text-center mt-1">● LIVE</p>}
                    </div>
                    <div className="flex-1 text-center">
                      <TeamDisplay team={match.awayTeam} />
                    </div>
                  </div>
                )}

                <div className="mt-3 sm:mt-4 flex justify-center gap-2 flex-wrap">
                  {match.status === 'scheduled' && (
                    <button
                      onClick={() => handleStartMatch(match._id)}
                      disabled={updating === match._id}
                      className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {updating === match._id ? 'Starting...' : '▶️ Start Match'}
                    </button>
                  )}

                  {match.status === 'live' && (
                    editingMatch === match._id ? (
                      <>
                        <button onClick={() => handleUpdateScore(match._id, false)} disabled={updating === match._id} className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 text-sm">Update</button>
                        <button onClick={() => handleUpdateScore(match._id, true)} disabled={updating === match._id} className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 text-sm">✓ Complete</button>
                        <button onClick={() => setEditingMatch(null)} className="bg-gray-300 px-3 sm:px-4 py-2 rounded-lg text-sm">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => handleEditClick(match)} className="bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-orange-600 text-sm">⚽ Update Score</button>
                    )
                  )}

                  {match.status === 'completed' && (
                    editingMatch === match._id ? (
                      <>
                        <button onClick={() => handleUpdateScore(match._id, true)} disabled={updating === match._id} className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 text-sm">Save</button>
                        <button onClick={() => setEditingMatch(null)} className="bg-gray-300 px-3 sm:px-4 py-2 rounded-lg text-sm">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => handleEditClick(match)} className="bg-gray-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-600 text-sm">✏️ Edit</button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-gray-500">Showing: {filteredMatches.length} matches</div>
    </div>
  );
}

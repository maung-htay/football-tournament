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

const TeamDisplay = ({ team, placeholder }: { team?: Team | null; placeholder?: string }) => {
  if (team) {
    return <p className="font-bold text-sm sm:text-base leading-tight text-center">{team.name}</p>;
  }
  if (placeholder) {
    return <p className="font-medium text-sm sm:text-base text-gray-500 text-center">{placeholder}</p>;
  }
  return <span className="text-gray-400">TBD</span>;
};

const MatchTimer = ({ startedAt, durationMinutes }: { startedAt: string; durationMinutes: number }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(startedAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isOvertime = elapsed >= durationMinutes * 60;

  return (
    <div className={`text-center ${isOvertime ? 'text-red-600' : 'text-green-600'}`}>
      <span className="text-lg font-mono font-bold">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {isOvertime && <span className="text-xs ml-1">⏰</span>}
    </div>
  );
};

export default function ScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [matchDuration, setMatchDuration] = useState(15);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{ home: number; away: number; homePen: number; awayPen: number; liveUrl: string }>({ 
    home: 0, away: 0, homePen: 0, awayPen: 0, liveUrl: '' 
  });
  const [showPenalty, setShowPenalty] = useState(false);
  
  // Match events state
  const [goalScorers, setGoalScorers] = useState<MatchEvent[]>([]);
  const [yellowCards, setYellowCards] = useState<MatchEvent[]>([]);
  const [redCards, setRedCards] = useState<MatchEvent[]>([]);
  const [newJersey, setNewJersey] = useState<{ goal: string; yellow: string; red: string }>({ goal: '', yellow: '', red: '' });

  useEffect(() => {
    fetchMatches();
    fetchSettings();
    const matchInterval = setInterval(fetchMatches, 30000);
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => {
      clearInterval(matchInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setMatchDuration(data.matchDurationMinutes || 15);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

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
    setScores({ 
      home: match.homeScore ?? 0, 
      away: match.awayScore ?? 0,
      homePen: match.homePenalty ?? 0,
      awayPen: match.awayPenalty ?? 0,
      liveUrl: match.liveUrl || ''
    });
    setShowPenalty(match.homePenalty !== null && match.homePenalty !== undefined);
    setGoalScorers(match.goalScorers || []);
    setYellowCards(match.yellowCards || []);
    setRedCards(match.redCards || []);
    setNewJersey({ goal: '', yellow: '', red: '' });
    setError('');
    setSuccess('');
  };

  const addEvent = (type: 'goal' | 'yellow' | 'red', team: 'home' | 'away') => {
    const jersey = parseInt(newJersey[type]);
    if (isNaN(jersey) || jersey <= 0) return;

    const event: MatchEvent = { team, jerseyNumber: jersey };
    
    if (type === 'goal') {
      setGoalScorers([...goalScorers, event]);
      // Auto update score
      if (team === 'home') {
        setScores({ ...scores, home: scores.home + 1 });
      } else {
        setScores({ ...scores, away: scores.away + 1 });
      }
    } else if (type === 'yellow') {
      setYellowCards([...yellowCards, event]);
    } else {
      setRedCards([...redCards, event]);
    }
    
    setNewJersey({ ...newJersey, [type]: '' });
  };

  const removeEvent = (type: 'goal' | 'yellow' | 'red', index: number) => {
    if (type === 'goal') {
      const removed = goalScorers[index];
      setGoalScorers(goalScorers.filter((_, i) => i !== index));
      // Auto update score
      if (removed.team === 'home') {
        setScores({ ...scores, home: Math.max(0, scores.home - 1) });
      } else {
        setScores({ ...scores, away: Math.max(0, scores.away - 1) });
      }
    } else if (type === 'yellow') {
      setYellowCards(yellowCards.filter((_, i) => i !== index));
    } else {
      setRedCards(redCards.filter((_, i) => i !== index));
    }
  };

  const handleUpdateScore = async (matchId: string, complete: boolean = false) => {
    setUpdating(matchId);
    setError('');
    setSuccess('');

    try {
      const body: any = { 
        homeScore: scores.home, 
        awayScore: scores.away,
        liveUrl: scores.liveUrl || null,
        goalScorers,
        yellowCards,
        redCards,
      };
      if (showPenalty) {
        body.homePenalty = scores.homePen;
        body.awayPenalty = scores.awayPen;
      } else {
        body.homePenalty = null;
        body.awayPenalty = null;
      }
      if (complete) body.status = 'completed';

      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update');
      setSuccess(complete ? 'Match completed!' : 'Score updated');
      setEditingMatch(null);
      setShowPenalty(false);
      setGoalScorers([]);
      setYellowCards([]);
      setRedCards([]);
      fetchMatches();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpdating(null);
    }
  };

  const canComplete = (match: Match) => {
    if (!match.startedAt) return true;
    const startTime = new Date(match.startedAt).getTime();
    const elapsedSeconds = (currentTime - startTime) / 1000;
    const thresholdSeconds = (matchDuration - 1) * 60;
    return elapsedSeconds >= thresholdSeconds;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = { 
      group: 'Group Stage', round32: 'Round of 32', round16: 'Round of 16', 
      quarter: 'Quarter Final', semi: 'Semi Final', third: '3rd Place', final: 'Final' 
    };
    return labels[round] || round;
  };

  const isKnockout = (round: string) => ['round32', 'round16', 'quarter', 'semi', 'third', 'final'].includes(round);

  const venues = Array.from(new Set(matches.map(m => m.venue))).sort();

  const filteredMatches = matches.filter((match) => {
    let statusMatch = true;
    if (statusFilter === 'scheduled') statusMatch = match.status === 'scheduled';
    if (statusFilter === 'live') statusMatch = match.status === 'live';
    if (statusFilter === 'completed') statusMatch = match.status === 'completed';
    if (statusFilter === 'all') statusMatch = match.status !== 'cancelled';

    let venueMatch = true;
    if (venueFilter !== 'all') venueMatch = match.venue === venueFilter;
    
    return statusMatch && venueMatch;
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Score Management</h2>
        <div className="text-right text-xs text-gray-400">
          <div>Match: {matchDuration} min</div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${statusFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}>All</button>
          <button onClick={() => setStatusFilter('scheduled')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${statusFilter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Scheduled</button>
          <button onClick={() => setStatusFilter('live')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1 ${statusFilter === 'live' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
            🔴 Live {liveCount > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === 'live' ? 'bg-white text-red-600' : 'bg-red-500 text-white'}`}>{liveCount}</span>}
          </button>
          <button onClick={() => setStatusFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Done</button>
        </div>

        <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm border bg-white">
          <option value="all">All Venues</option>
          {venues.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">No matches found</div>
        ) : (
          filteredMatches.map((match) => {
            const canCompleteMatch = canComplete(match);
            const homeGoals = (match.goalScorers || []).filter(g => g.team === 'home');
            const awayGoals = (match.goalScorers || []).filter(g => g.team === 'away');
            
            return (
              <div key={match._id} className={`bg-white rounded-xl shadow overflow-hidden ${match.status === 'live' ? 'ring-2 ring-red-400' : ''}`}>
                {/* Header */}
                <div className="bg-gray-50 px-3 sm:px-4 py-2 flex justify-between items-center text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>{formatDate(match.matchDate)} {match.matchTime}</span>
                    <span>|</span>
                    <span>{match.venue}</span>
                    <span>|</span>
                    <span className="font-medium text-green-600">{getRoundLabel(match.round)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.status === 'live' && match.startedAt && (
                      <MatchTimer startedAt={match.startedAt} durationMinutes={matchDuration} />
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      match.status === 'live' ? 'bg-red-100 text-red-800 animate-pulse' :
                      match.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {match.status === 'live' ? '🔴 LIVE' : match.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  {editingMatch === match._id ? (
                    <div className="space-y-4">
                      {/* Score Input */}
                      <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <div className="text-center flex-1">
                          <TeamDisplay team={match.homeTeam} placeholder={match.homePlaceholder} />
                          <input
                            type="number"
                            min="0"
                            value={scores.home}
                            onChange={(e) => setScores({ ...scores, home: parseInt(e.target.value) || 0 })}
                            className="w-16 sm:w-20 text-center text-xl sm:text-2xl font-bold border-2 border-orange-300 rounded-lg py-2 mt-2"
                          />
                        </div>
                        <span className="text-xl sm:text-2xl text-gray-400">-</span>
                        <div className="text-center flex-1">
                          <TeamDisplay team={match.awayTeam} placeholder={match.awayPlaceholder} />
                          <input
                            type="number"
                            min="0"
                            value={scores.away}
                            onChange={(e) => setScores({ ...scores, away: parseInt(e.target.value) || 0 })}
                            className="w-16 sm:w-20 text-center text-xl sm:text-2xl font-bold border-2 border-orange-300 rounded-lg py-2 mt-2"
                          />
                        </div>
                      </div>

                      {/* Goal Scorers */}
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">⚽ Goal Scorers</p>
                        <div className="flex gap-1 mb-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="#"
                            value={newJersey.goal}
                            onChange={(e) => setNewJersey({ ...newJersey, goal: e.target.value })}
                            className="w-14 text-center border rounded py-1 text-sm"
                          />
                          <button onClick={() => addEvent('goal', 'home')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">+Home</button>
                          <button onClick={() => addEvent('goal', 'away')} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">+Away</button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {goalScorers.map((g, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${g.team === 'home' ? 'bg-green-100' : 'bg-blue-100'}`}>
                              ⚽#{g.jerseyNumber}
                              <button onClick={() => removeEvent('goal', i)} className="text-red-500 hover:text-red-700">×</button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Yellow Cards */}
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">🟨 Yellow Cards</p>
                        <div className="flex gap-1 mb-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="#"
                            value={newJersey.yellow}
                            onChange={(e) => setNewJersey({ ...newJersey, yellow: e.target.value })}
                            className="w-14 text-center border rounded py-1 text-sm"
                          />
                          <button onClick={() => addEvent('yellow', 'home')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">+Home</button>
                          <button onClick={() => addEvent('yellow', 'away')} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">+Away</button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {yellowCards.map((c, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${c.team === 'home' ? 'bg-green-100' : 'bg-blue-100'}`}>
                              🟨#{c.jerseyNumber}
                              <button onClick={() => removeEvent('yellow', i)} className="text-red-500 hover:text-red-700">×</button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Red Cards */}
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">🟥 Red Cards</p>
                        <div className="flex gap-1 mb-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="#"
                            value={newJersey.red}
                            onChange={(e) => setNewJersey({ ...newJersey, red: e.target.value })}
                            className="w-14 text-center border rounded py-1 text-sm"
                          />
                          <button onClick={() => addEvent('red', 'home')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">+Home</button>
                          <button onClick={() => addEvent('red', 'away')} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">+Away</button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {redCards.map((c, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${c.team === 'home' ? 'bg-green-100' : 'bg-blue-100'}`}>
                              🟥#{c.jerseyNumber}
                              <button onClick={() => removeEvent('red', i)} className="text-red-500 hover:text-red-700">×</button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Penalty Section */}
                      {isKnockout(match.round) && (
                        <div className="border-t pt-3">
                          <label className="flex items-center gap-2 justify-center text-sm mb-2">
                            <input type="checkbox" checked={showPenalty} onChange={(e) => setShowPenalty(e.target.checked)} className="w-4 h-4" />
                            <span>Penalty Shootout</span>
                          </label>
                          {showPenalty && (
                            <div className="flex items-center justify-center gap-3">
                              <input type="number" min="0" value={scores.homePen} onChange={(e) => setScores({ ...scores, homePen: parseInt(e.target.value) || 0 })} className="w-14 text-center text-lg font-bold border-2 border-purple-300 rounded-lg py-1" />
                              <span className="text-sm text-gray-500">PEN</span>
                              <input type="number" min="0" value={scores.awayPen} onChange={(e) => setScores({ ...scores, awayPen: parseInt(e.target.value) || 0 })} className="w-14 text-center text-lg font-bold border-2 border-purple-300 rounded-lg py-1" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Live URL */}
                      <div className="border-t pt-3">
                        <label className="block text-sm text-gray-600 mb-1 text-center">📺 Facebook Live URL</label>
                        <input type="url" value={scores.liveUrl} onChange={(e) => setScores({ ...scores, liveUrl: e.target.value })} placeholder="https://facebook.com/..." className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-center gap-2 pt-2">
                        <button onClick={() => handleUpdateScore(match._id, false)} disabled={updating === match._id} className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 text-sm">Update</button>
                        <button 
                          onClick={() => handleUpdateScore(match._id, true)} 
                          disabled={updating === match._id || !canCompleteMatch} 
                          className={`px-3 sm:px-4 py-2 rounded-lg text-sm ${canCompleteMatch ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                          ✓ Complete
                        </button>
                        <button onClick={() => { setEditingMatch(null); setShowPenalty(false); }} className="bg-gray-300 px-3 sm:px-4 py-2 rounded-lg text-sm">Cancel</button>
                      </div>
                      
                      {!canCompleteMatch && (
                        <p className="text-center text-xs text-gray-500">Complete button enables at {matchDuration - 1}:00</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="flex-1 text-center">
                          <TeamDisplay team={match.homeTeam} placeholder={match.homePlaceholder} />
                          {homeGoals.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">⚽ {homeGoals.map(g => `#${g.jerseyNumber}`).join(', ')}</p>
                          )}
                        </div>
                        <div className="px-3 sm:px-6">
                          {match.status === 'completed' || match.status === 'live' ? (
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold">{match.homeScore} - {match.awayScore}</div>
                              {match.homePenalty !== null && match.homePenalty !== undefined && (
                                <div className="text-sm text-purple-600 font-medium">({match.homePenalty} - {match.awayPenalty} PEN)</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xl sm:text-2xl text-gray-300">vs</div>
                          )}
                          {match.status === 'live' && <p className="text-red-500 text-xs font-medium animate-pulse text-center mt-1">● LIVE</p>}
                        </div>
                        <div className="flex-1 text-center">
                          <TeamDisplay team={match.awayTeam} placeholder={match.awayPlaceholder} />
                          {awayGoals.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">⚽ {awayGoals.map(g => `#${g.jerseyNumber}`).join(', ')}</p>
                          )}
                        </div>
                      </div>

                      {((match.yellowCards && match.yellowCards.length > 0) || (match.redCards && match.redCards.length > 0)) && (
                        <div className="mt-2 flex justify-center gap-4 text-xs">
                          {match.yellowCards && match.yellowCards.length > 0 && (
                            <span>🟨 {match.yellowCards.map(c => `#${c.jerseyNumber}`).join(', ')}</span>
                          )}
                          {match.redCards && match.redCards.length > 0 && (
                            <span>🟥 {match.redCards.map(c => `#${c.jerseyNumber}`).join(', ')}</span>
                          )}
                        </div>
                      )}

                      {match.liveUrl && (
                        <div className="mt-2 text-center">
                          <a href={match.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">📺 Live Stream</a>
                        </div>
                      )}

                      <div className="mt-3 sm:mt-4 flex justify-center gap-2 flex-wrap">
                        {match.status === 'scheduled' && (
                          <button onClick={() => handleStartMatch(match._id)} disabled={updating === match._id || !match.homeTeam || !match.awayTeam} className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                            {updating === match._id ? 'Starting...' : '▶️ Start Match'}
                          </button>
                        )}
                        {match.status === 'live' && (
                          <button onClick={() => handleEditClick(match)} className="bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-orange-600 text-sm">⚽ Update Score</button>
                        )}
                        {match.status === 'completed' && (
                          <button onClick={() => handleEditClick(match)} className="bg-gray-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-600 text-sm">✏️ Edit</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-sm text-gray-500">Showing: {filteredMatches.length} matches</div>
    </div>
  );
}

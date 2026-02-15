'use client';

import { useState, useEffect } from 'react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
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
  groupId?: Group;
  round: string;
  matchName?: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  status: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showBracket, setShowBracket] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'bracket'>('list');

  const [formData, setFormData] = useState({
    round: 'group',
    matchName: '',
    homeType: 'team', // 'team' or 'placeholder'
    awayType: 'team',
    homeTeam: '',
    awayTeam: '',
    homePlaceholder: '',
    awayPlaceholder: '',
    venue: '',
    matchDate: '',
    matchTime: '',
  });

  const [generateData, setGenerateData] = useState({
    venues: 'A, B, C',
    startDate: '',
    startTime: '09:00',
    matchDuration: 15,
    breakBetweenMatches: 5,
    restBetweenGames: 2,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes, groupsRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/teams'),
        fetch('/api/groups'),
      ]);
      const matchesData = await matchesRes.json();
      const teamsData = await teamsRes.json();
      const groupsData = await groupsRes.json();
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      round: 'group',
      matchName: '',
      homeType: 'team',
      awayType: 'team',
      homeTeam: '',
      awayTeam: '',
      homePlaceholder: '',
      awayPlaceholder: '',
      venue: '',
      matchDate: '',
      matchTime: '',
    });
    setEditingMatch(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setShowGenerate(false);
    setError('');
    setSuccess('');
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      round: match.round,
      matchName: match.matchName || '',
      homeType: match.homeTeam ? 'team' : 'placeholder',
      awayType: match.awayTeam ? 'team' : 'placeholder',
      homeTeam: match.homeTeam?._id || '',
      awayTeam: match.awayTeam?._id || '',
      homePlaceholder: match.homePlaceholder || '',
      awayPlaceholder: match.awayPlaceholder || '',
      venue: match.venue,
      matchDate: match.matchDate.split('T')[0],
      matchTime: match.matchTime,
    });
    setShowForm(true);
    setShowGenerate(false);
    setError('');
    setSuccess('');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload: any = {
        round: formData.round,
        matchName: formData.matchName || undefined,
        venue: formData.venue,
        matchDate: formData.matchDate,
        matchTime: formData.matchTime,
      };

      if (formData.homeType === 'team' && formData.homeTeam) {
        payload.homeTeam = formData.homeTeam;
        payload.homePlaceholder = null;
      } else if (formData.homePlaceholder) {
        payload.homePlaceholder = formData.homePlaceholder;
        payload.homeTeam = null;
      }

      if (formData.awayType === 'team' && formData.awayTeam) {
        payload.awayTeam = formData.awayTeam;
        payload.awayPlaceholder = null;
      } else if (formData.awayPlaceholder) {
        payload.awayPlaceholder = formData.awayPlaceholder;
        payload.awayTeam = null;
      }

      const url = editingMatch ? `/api/matches/${editingMatch._id}` : '/api/matches';
      const method = editingMatch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save match');
      }

      setSuccess(editingMatch ? 'Match updated' : 'Match created');
      handleCloseForm();
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGenerating(true);

    try {
      const res = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate');
      }

      const result = await res.json();
      setSuccess(`Generated ${result.length} matches`);
      setShowGenerate(false);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this match?')) return;
    try {
      await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      setSuccess('Match cancelled');
      fetchData();
    } catch (error) {
      setError('Failed to cancel');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this match?')) return;
    try {
      await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      setSuccess('Match deleted');
      fetchData();
    } catch (error) {
      setError('Failed to delete');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = { group: 'Group', round32: 'R32', round16: 'R16', quarter: 'QF', semi: 'SF', third: '3rd', final: 'Final' };
    return labels[round] || round;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { scheduled: 'bg-blue-100 text-blue-800', live: 'bg-red-100 text-red-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  const getTeamDisplay = (match: Match, side: 'home' | 'away') => {
    const team = side === 'home' ? match.homeTeam : match.awayTeam;
    const placeholder = side === 'home' ? match.homePlaceholder : match.awayPlaceholder;
    
    if (team) return team.name;
    if (placeholder) return placeholder;
    return 'TBD';
  };

  // Generate placeholder options
  const getPlaceholderOptions = () => {
    const options: string[] = [];
    
    // Group positions
    groups.forEach(g => {
      options.push(`${g.name} 1st`);
      options.push(`${g.name} 2nd`);
    });
    
    // Match winners/losers
    const knockoutMatches = matches.filter(m => m.round !== 'group' && m.matchName);
    knockoutMatches.forEach(m => {
      options.push(`Winner ${m.matchName}`);
      options.push(`Loser ${m.matchName}`);
    });
    
    return options;
  };

  // Group matches by round for bracket view
  const matchesByRound = {
    round32: matches.filter(m => m.round === 'round32'),
    round16: matches.filter(m => m.round === 'round16'),
    quarter: matches.filter(m => m.round === 'quarter'),
    semi: matches.filter(m => m.round === 'semi'),
    third: matches.filter(m => m.round === 'third'),
    final: matches.filter(m => m.round === 'final'),
  };

  const hasKnockoutMatches = Object.values(matchesByRound).some(arr => arr.length > 0);
  
  // Check if there are unresolved placeholders
  const hasUnresolvedPlaceholders = matches.some(m => 
    (m.homePlaceholder && !m.homeTeam) || (m.awayPlaceholder && !m.awayTeam)
  );

  // Resolve placeholders
  const handleResolvePlaceholders = async () => {
    setError('');
    setSuccess('');
    setResolving(true);

    try {
      const res = await fetch('/api/matches/resolve-placeholders', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to resolve');
      
      setSuccess(data.message || 'Placeholders resolved');
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Match Management</h2>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <button onClick={() => { setShowGenerate(!showGenerate); setShowForm(false); }} className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-lg text-sm">⚡ Auto</button>
          <button onClick={handleAddNew} className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">+ Add</button>
          {hasUnresolvedPlaceholders && (
            <button 
              onClick={handleResolvePlaceholders} 
              disabled={resolving}
              className="flex-1 sm:flex-none bg-purple-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {resolving ? '...' : '🔄 Resolve Teams'}
            </button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      {hasKnockoutMatches && (
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded text-sm ${activeTab === 'list' ? 'bg-white shadow' : ''}`}>📋 List</button>
          <button onClick={() => setActiveTab('bracket')} className={`px-4 py-2 rounded text-sm ${activeTab === 'bracket' ? 'bg-white shadow' : ''}`}>🏆 Bracket</button>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Auto Generate Form */}
      {showGenerate && (
        <form onSubmit={handleGenerate} className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3">⚡ Auto Generate Group Stage</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venues</label>
              <input type="text" value={generateData.venues} onChange={(e) => setGenerateData({ ...generateData, venues: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={generateData.startDate} onChange={(e) => setGenerateData({ ...generateData, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={generateData.startTime} onChange={(e) => setGenerateData({ ...generateData, startTime: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select value={generateData.matchDuration} onChange={(e) => setGenerateData({ ...generateData, matchDuration: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[10, 12, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break</label>
              <select value={generateData.breakBetweenMatches} onChange={(e) => setGenerateData({ ...generateData, breakBetweenMatches: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[0, 5, 10, 15].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rest</label>
              <select value={generateData.restBetweenGames} onChange={(e) => setGenerateData({ ...generateData, restBetweenGames: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} matches</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={generating || groups.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm">{generating ? '...' : 'Generate'}</button>
            <button type="button" onClick={() => setShowGenerate(false)} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Add/Edit Match Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold mb-3">{editingMatch ? 'Edit Match' : 'Add Match'}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Round */}
            <div>
              <label className="block text-sm font-medium mb-1">Round</label>
              <select value={formData.round} onChange={(e) => setFormData({ ...formData, round: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="group">Group Stage</option>
                <option value="round32">Round of 32</option>
                <option value="round16">Round of 16</option>
                <option value="quarter">Quarter Final</option>
                <option value="semi">Semi Final</option>
                <option value="third">3rd Place</option>
                <option value="final">Final</option>
              </select>
            </div>

            {/* Match Name (for knockout) */}
            {formData.round !== 'group' && (
              <div>
                <label className="block text-sm font-medium mb-1">Match Name</label>
                <input type="text" value={formData.matchName} onChange={(e) => setFormData({ ...formData, matchName: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., R16-1, QF1, SF1" />
              </div>
            )}

            {/* Home Team Selection */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-1">Home</label>
              {formData.round !== 'group' && (
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setFormData({ ...formData, homeType: 'team' })} className={`px-3 py-1 rounded text-xs ${formData.homeType === 'team' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Team</button>
                  <button type="button" onClick={() => setFormData({ ...formData, homeType: 'placeholder' })} className={`px-3 py-1 rounded text-xs ${formData.homeType === 'placeholder' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Placeholder</button>
                </div>
              )}
              {formData.homeType === 'team' || formData.round === 'group' ? (
                <select value={formData.homeTeam} onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select Team...</option>
                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              ) : (
                <select value={formData.homePlaceholder} onChange={(e) => setFormData({ ...formData, homePlaceholder: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {getPlaceholderOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}
            </div>

            {/* Away Team Selection */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-1">Away</label>
              {formData.round !== 'group' && (
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setFormData({ ...formData, awayType: 'team' })} className={`px-3 py-1 rounded text-xs ${formData.awayType === 'team' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Team</button>
                  <button type="button" onClick={() => setFormData({ ...formData, awayType: 'placeholder' })} className={`px-3 py-1 rounded text-xs ${formData.awayType === 'placeholder' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Placeholder</button>
                </div>
              )}
              {formData.awayType === 'team' || formData.round === 'group' ? (
                <select value={formData.awayTeam} onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select Team...</option>
                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              ) : (
                <select value={formData.awayPlaceholder} onChange={(e) => setFormData({ ...formData, awayPlaceholder: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {getPlaceholderOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={formData.matchDate} onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input type="time" value={formData.matchTime} onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : (editingMatch ? 'Update' : 'Create')}</button>
            <button type="button" onClick={handleCloseForm} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Bracket View */}
      {activeTab === 'bracket' && hasKnockoutMatches && (
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <h3 className="text-lg font-bold mb-4">🏆 Knockout Bracket</h3>
          <div className="flex gap-8 min-w-max">
            {(['round32', 'round16', 'quarter', 'semi', 'final'] as const).map(round => {
              const roundMatches = matchesByRound[round];
              if (roundMatches.length === 0) return null;
              
              return (
                <div key={round} className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-center text-gray-600 border-b pb-2">
                    {getRoundLabel(round)}
                  </h4>
                  {roundMatches.map(match => (
                    <div key={match._id} className="bg-gray-50 rounded-lg p-3 w-48 border-l-4 border-green-500">
                      {match.matchName && <p className="text-xs text-gray-500 mb-1">{match.matchName}</p>}
                      <div className={`text-sm font-medium ${match.status === 'completed' && match.homeScore! > match.awayScore! ? 'text-green-600' : ''}`}>
                        {getTeamDisplay(match, 'home')}
                        {match.status === 'completed' && <span className="float-right">{match.homeScore}</span>}
                      </div>
                      <div className={`text-sm font-medium ${match.status === 'completed' && match.awayScore! > match.homeScore! ? 'text-green-600' : ''}`}>
                        {getTeamDisplay(match, 'away')}
                        {match.status === 'completed' && <span className="float-right">{match.awayScore}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{match.venue} | {match.matchTime}</p>
                    </div>
                  ))}
                </div>
              );
            })}
            
            {/* 3rd Place */}
            {matchesByRound.third.length > 0 && (
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-center text-gray-600 border-b pb-2">3rd Place</h4>
                {matchesByRound.third.map(match => (
                  <div key={match._id} className="bg-amber-50 rounded-lg p-3 w-48 border-l-4 border-amber-500">
                    <div className="text-sm font-medium">{getTeamDisplay(match, 'home')}</div>
                    <div className="text-sm font-medium">{getTeamDisplay(match, 'away')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <>
          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-3">
            {matches.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">No matches yet</div>
            ) : matches.map((match) => (
              <div key={match._id} className={`bg-white rounded-xl shadow p-4 ${match.status === 'cancelled' ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">{formatDate(match.matchDate)} {match.matchTime}</span>
                  {getStatusBadge(match.status)}
                </div>
                <div className="space-y-1 mb-2">
                  <div className="font-medium text-sm">{getTeamDisplay(match, 'home')}</div>
                  <div className="text-gray-400 text-xs">vs</div>
                  <div className="font-medium text-sm">{getTeamDisplay(match, 'away')}</div>
                  {(match.status === 'completed' || match.status === 'live') && (
                    <div className="text-center font-bold">{match.homeScore} - {match.awayScore}</div>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{getRoundLabel(match.round)} {match.matchName && `(${match.matchName})`} | {match.venue}</span>
                  <div className="space-x-2">
                    {match.status === 'scheduled' && (
                      <>
                        <button onClick={() => handleEdit(match)} className="text-blue-600">Edit</button>
                        <button onClick={() => handleCancel(match._id)} className="text-orange-600">Cancel</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(match._id)} className="text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Home Team</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Away Team</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {matches.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No matches yet</td></tr>
                ) : matches.map((match) => (
                  <tr key={match._id} className={`hover:bg-gray-50 ${match.status === 'cancelled' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm">{formatDate(match.matchDate)}</div>
                      <div className="text-xs text-gray-500">{match.matchTime}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">{getTeamDisplay(match, 'home')}</td>
                    <td className="px-4 py-3 text-center">
                      {match.status === 'completed' || match.status === 'live' 
                        ? <span className="font-bold">{match.homeScore} - {match.awayScore}</span> 
                        : <span className="text-gray-400">vs</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">{getTeamDisplay(match, 'away')}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{getRoundLabel(match.round)}</span>
                      {match.matchName && <span className="text-xs text-gray-500 ml-1">({match.matchName})</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">{match.venue}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(match.status)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {match.status === 'scheduled' && (
                        <>
                          <button onClick={() => handleEdit(match)} className="text-blue-600 text-sm">Edit</button>
                          <button onClick={() => handleCancel(match._id)} className="text-orange-600 text-sm">Cancel</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(match._id)} className="text-red-600 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      <div className="text-sm text-gray-500">Total: {matches.length} matches</div>
    </div>
  );
}

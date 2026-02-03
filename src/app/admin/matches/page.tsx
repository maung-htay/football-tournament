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
}

interface Match {
  _id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  groupId?: Group;
  round: string;
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
  const [generating, setGenerating] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    groupId: '',
    round: 'group',
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
    setFormData({ homeTeam: '', awayTeam: '', groupId: '', round: 'group', venue: '', matchDate: '', matchTime: '' });
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
      homeTeam: match.homeTeam?._id || '',
      awayTeam: match.awayTeam?._id || '',
      groupId: match.groupId?._id || '',
      round: match.round,
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

    try {
      const url = editingMatch ? `/api/matches/${editingMatch._id}` : '/api/matches';
      const method = editingMatch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save match');
      setSuccess(editingMatch ? 'Match updated' : 'Match created');
      handleCloseForm();
      fetchData();
    } catch (error: any) {
      setError(error.message);
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
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed');
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

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Match Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => { setShowGenerate(!showGenerate); setShowForm(false); }} 
            className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
          >
            ⚡ Auto
          </button>
          <button 
            onClick={handleAddNew}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            + Add Match
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {showGenerate && (
        <form onSubmit={handleGenerate} className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3">⚡ Auto Generate Group Stage</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venues (comma separated)</label>
              <input type="text" value={generateData.venues} onChange={(e) => setGenerateData({ ...generateData, venues: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="A, B, C" required />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Match Duration</label>
              <select value={generateData.matchDuration} onChange={(e) => setGenerateData({ ...generateData, matchDuration: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[10, 12, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break Between</label>
              <select value={generateData.breakBetweenMatches} onChange={(e) => setGenerateData({ ...generateData, breakBetweenMatches: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[0, 5, 10, 15].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rest Between</label>
              <select value={generateData.restBetweenGames} onChange={(e) => setGenerateData({ ...generateData, restBetweenGames: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} matches</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={generating || groups.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm">{generating ? 'Generating...' : 'Generate'}</button>
            <button type="button" onClick={() => setShowGenerate(false)} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
          {groups.length === 0 && <p className="mt-2 text-sm text-red-500">Please draw groups first</p>}
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold mb-3">{editingMatch ? 'Edit Match' : 'Add Match'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Home Team</label>
              <select value={formData.homeTeam} onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required>
                <option value="">Select...</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Away Team</label>
              <select value={formData.awayTeam} onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required>
                <option value="">Select...</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Field A" required />
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
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">{editingMatch ? 'Update' : 'Create'}</button>
            <button type="button" onClick={handleCloseForm} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {matches.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">No matches yet</div>
        ) : matches.map((match) => (
          <div key={match._id} className={`bg-white rounded-xl shadow p-4 ${match.status === 'cancelled' ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">{formatDate(match.matchDate)} {match.matchTime}</span>
              {getStatusBadge(match.status)}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{match.homeTeam?.shortName || 'TBD'}</span>
              <span className="text-gray-400 mx-2">
                {match.status === 'completed' || match.status === 'live' 
                  ? <span className="font-bold">{match.homeScore} - {match.awayScore}</span> 
                  : 'vs'}
              </span>
              <span className="font-medium">{match.awayTeam?.shortName || 'TBD'}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{getRoundLabel(match.round)} | {match.venue}</span>
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

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {matches.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No matches yet</td></tr>
              ) : matches.map((match) => (
                <tr key={match._id} className={`hover:bg-gray-50 ${match.status === 'cancelled' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="text-sm">{formatDate(match.matchDate)}</div>
                    <div className="text-xs text-gray-500">{match.matchTime}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{match.homeTeam?.shortName || 'TBD'}</span>
                    <span className="text-gray-400 mx-2">vs</span>
                    <span className="font-medium">{match.awayTeam?.shortName || 'TBD'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {match.status === 'completed' || match.status === 'live' ? <span className="font-bold">{match.homeScore} - {match.awayScore}</span> : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{getRoundLabel(match.round)}</span></td>
                  <td className="px-4 py-3 text-sm">{match.venue}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(match.status)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {match.status === 'scheduled' && (
                      <>
                        <button onClick={() => handleEdit(match)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        <button onClick={() => handleCancel(match._id)} className="text-orange-600 hover:text-orange-800 text-sm">Cancel</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(match._id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-sm text-gray-500">Total: {matches.length} matches</div>
    </div>
  );
}

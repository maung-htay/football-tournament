'use client';

import { useState, useEffect } from 'react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  manualRank?: number;
}

interface Group {
  _id: string;
  name: string;
  teams: Team[];
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [groupCount, setGroupCount] = useState(4);
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Manual draw mode
  const [manualMode, setManualMode] = useState(false);
  const [manualGroups, setManualGroups] = useState<Record<string, string[]>>({});
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [savingManual, setSavingManual] = useState(false);

  // Edit mode for existing groups
  const [editMode, setEditMode] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Tiebreaker mode
  const [tiebreakerMode, setTiebreakerMode] = useState(false);
  const [tiebreakerGroup, setTiebreakerGroup] = useState<Group | null>(null);
  const [teamRanks, setTeamRanks] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, teamsRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/teams'),
      ]);
      const groupsData = await groupsRes.json();
      const teamsData = await teamsRes.json();
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setAllTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort teams in a group
  const sortTeams = (teams: Team[]) => {
    return [...teams].sort((a, b) => {
      // 1. Sort by points first
      if (b.points !== a.points) return b.points - a.points;
      
      // 2. Then goal difference
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      
      // 3. Then goals for
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      
      // 4. If all equal, use manualRank (tiebreaker)
      if (a.manualRank && b.manualRank) return a.manualRank - b.manualRank;
      if (a.manualRank) return -1;
      if (b.manualRank) return 1;
      
      return 0;
    });
  };

  // Check if teams are tied (same points, GD, and GF)
  const checkTiedTeams = (teams: Team[]) => {
    // Group teams by points, GD, and GF
    const groups: Record<string, Team[]> = {};
    
    for (const team of teams) {
      const gd = team.goalsFor - team.goalsAgainst;
      const key = `${team.points}_${gd}_${team.goalsFor}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(team);
    }
    
    // Check if any group has 2+ teams without all having manualRank
    for (const key in groups) {
      const teamsInGroup = groups[key];
      if (teamsInGroup.length >= 2) {
        // Check if all teams in this tied group have manualRank set
        const allHaveRank = teamsInGroup.every(t => t.manualRank);
        if (!allHaveRank) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Auto Draw
  const handleAutoDraw = async () => {
    setError('');
    setSuccess('');
    setDrawing(true);

    try {
      const res = await fetch('/api/groups/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCount, teamsPerGroup }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to draw');
      }

      setSuccess('Auto draw completed!');
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDrawing(false);
    }
  };

  // Start Manual Draw
  const startManualDraw = () => {
    const initialGroups: Record<string, string[]> = {};
    for (let i = 0; i < groupCount; i++) {
      const groupName = `Group ${String.fromCharCode(65 + i)}`;
      initialGroups[groupName] = [];
    }
    setManualGroups(initialGroups);
    setSelectedGroup(Object.keys(initialGroups)[0]);
    setManualMode(true);
    setError('');
    setSuccess('');
  };

  // Click team to add to selected group
  const handleTeamClick = (teamId: string) => {
    if (!selectedGroup) {
      setError('Please select a group first');
      return;
    }

    const currentTeams = manualGroups[selectedGroup] || [];
    
    if (currentTeams.includes(teamId)) {
      setManualGroups({
        ...manualGroups,
        [selectedGroup]: currentTeams.filter(id => id !== teamId),
      });
      return;
    }

    let newGroups = { ...manualGroups };
    for (const [groupName, teamIds] of Object.entries(newGroups)) {
      if (teamIds.includes(teamId)) {
        newGroups[groupName] = teamIds.filter(id => id !== teamId);
        break;
      }
    }

    if (newGroups[selectedGroup].length >= teamsPerGroup) {
      setError(`${selectedGroup} is full (max ${teamsPerGroup} teams)`);
      return;
    }

    newGroups[selectedGroup] = [...newGroups[selectedGroup], teamId];
    setManualGroups(newGroups);
    setError('');
  };

  const getTeamGroup = (teamId: string): string | null => {
    for (const [groupName, teamIds] of Object.entries(manualGroups)) {
      if (teamIds.includes(teamId)) return groupName;
    }
    return null;
  };

  // Save Manual Draw
  const saveManualDraw = async () => {
    setError('');
    setSuccess('');
    setSavingManual(true);

    try {
      const res = await fetch('/api/groups/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: manualGroups }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('Groups saved!');
      setManualMode(false);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSavingManual(false);
    }
  };

  // Reset Groups
  const handleReset = async () => {
    if (!confirm('Reset all groups and matches?')) return;
    
    setError('');
    setSuccess('');
    setResetting(true);

    try {
      const res = await fetch('/api/groups/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset');
      setSuccess('Groups and matches reset');
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setResetting(false);
    }
  };

  // Edit existing group
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setSelectedTeams(group.teams.map(t => t._id));
    setEditMode(true);
  };

  const handleSaveGroup = async () => {
    if (!editingGroup) return;
    
    try {
      const res = await fetch(`/api/groups/${editingGroup._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: selectedTeams }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setSuccess('Group updated');
      setEditMode(false);
      setEditingGroup(null);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Tiebreaker
  const openTiebreaker = (group: Group) => {
    setTiebreakerGroup(group);
    const ranks: Record<string, number> = {};
    group.teams.forEach((t, i) => {
      ranks[t._id] = t.manualRank || (i + 1);
    });
    setTeamRanks(ranks);
    setTiebreakerMode(true);
  };

  const saveTiebreaker = async () => {
    if (!tiebreakerGroup) return;
    setError('');
    setSuccess('');

    try {
      // Update each team's manualRank
      for (const team of tiebreakerGroup.teams) {
        await fetch(`/api/teams/${team._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manualRank: teamRanks[team._id] }),
        });
      }

      setSuccess('Tiebreaker saved!');
      setTiebreakerMode(false);
      setTiebreakerGroup(null);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const clearTiebreaker = async () => {
    if (!tiebreakerGroup) return;
    
    try {
      for (const team of tiebreakerGroup.teams) {
        await fetch(`/api/teams/${team._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manualRank: null }),
        });
      }

      setSuccess('Tiebreaker cleared');
      setTiebreakerMode(false);
      setTiebreakerGroup(null);
      fetchData();
    } catch (error: any) {
      setError(error.message);
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Group Draw</h2>
        {groups.length > 0 && !manualMode && (
          <button onClick={handleReset} disabled={resetting} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">
            {resetting ? '...' : '🗑️ Reset All'}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Draw Settings */}
      {groups.length === 0 && !manualMode && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold mb-3">🎲 Draw Settings</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Groups</label>
              <select value={groupCount} onChange={(e) => setGroupCount(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teams/Group</label>
              <select value={teamsPerGroup} onChange={(e) => setTeamsPerGroup(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={handleAutoDraw} disabled={drawing || allTeams.length < groupCount * teamsPerGroup} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {drawing ? '...' : '🎲 Auto'}
            </button>
            <button onClick={startManualDraw} disabled={allTeams.length === 0} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              ✏️ Manual
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Required: {groupCount * teamsPerGroup} | Registered: {allTeams.length}
          </p>
        </div>
      )}

      {/* Manual Draw Mode */}
      {manualMode && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Select Group:</span>
              {Object.keys(manualGroups).map(groupName => (
                <button
                  key={groupName}
                  onClick={() => setSelectedGroup(groupName)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedGroup === groupName
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {groupName} ({manualGroups[groupName]?.length || 0}/{teamsPerGroup})
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mb-3">
              Click a team to add to <strong>{selectedGroup}</strong>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {allTeams.map(team => {
                const assignedGroup = getTeamGroup(team._id);
                const isInSelectedGroup = assignedGroup === selectedGroup;
                
                return (
                  <button
                    key={team._id}
                    onClick={() => handleTeamClick(team._id)}
                    className={`p-3 rounded-lg border-2 transition text-left ${
                      isInSelectedGroup
                        ? 'border-green-500 bg-green-50'
                        : assignedGroup
                        ? 'border-gray-300 bg-gray-100 opacity-60'
                        : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{team.name}</p>
                    {assignedGroup && (
                      <p className="text-xs text-gray-500 mt-1">{assignedGroup}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setManualMode(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancel</button>
            <button onClick={saveManualDraw} disabled={savingManual} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {savingManual ? 'Saving...' : '💾 Save Groups'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editMode && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-4 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Edit {editingGroup.name}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allTeams.filter(team => {
                const inOtherGroup = groups.some(g => g._id !== editingGroup._id && g.teams.some(t => t._id === team._id));
                return !inOtherGroup || editingGroup.teams.some(t => t._id === team._id);
              }).map((team) => (
                <label key={team._id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer text-sm ${
                  selectedTeams.includes(team._id) ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 border-2 border-transparent'
                }`}>
                  <input type="checkbox" checked={selectedTeams.includes(team._id)} onChange={() => {
                    setSelectedTeams(prev => prev.includes(team._id) ? prev.filter(id => id !== team._id) : [...prev, team._id]);
                  }} className="w-4 h-4" />
                  <span className="font-medium">{team.name}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => { setEditMode(false); setEditingGroup(null); }} className="px-4 py-2 bg-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSaveGroup} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Tiebreaker Modal */}
      {tiebreakerMode && tiebreakerGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-4 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">⚖️ Tiebreaker - {tiebreakerGroup.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Set manual rankings for tied teams (1 = first place)</p>
            
            <div className="space-y-2">
              {sortTeams(tiebreakerGroup.teams).map((team) => (
                <div key={team._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="number"
                    min="1"
                    max={tiebreakerGroup.teams.length}
                    value={teamRanks[team._id] || ''}
                    onChange={(e) => setTeamRanks({ ...teamRanks, [team._id]: parseInt(e.target.value) || 0 })}
                    className="w-14 text-center border rounded py-1 text-sm"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{team.name}</p>
                    <p className="text-xs text-gray-500">
                      {team.points}pts | GD:{team.goalsFor - team.goalsAgainst} | GF:{team.goalsFor}
                    </p>
                  </div>
                  {team.manualRank && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Manual</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={clearTiebreaker} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">Clear</button>
              <button onClick={() => { setTiebreakerMode(false); setTiebreakerGroup(null); }} className="px-4 py-2 bg-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={saveTiebreaker} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Groups Display - Full Table */}
      {groups.length > 0 && !manualMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.map((group) => {
            const sortedTeams = sortTeams(group.teams);
            
            return (
              <div key={group._id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-green-600 text-white px-3 py-2 flex justify-between items-center">
                  <h3 className="font-bold text-sm">{group.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => openTiebreaker(group)} className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs font-medium hover:bg-yellow-400" title="Tiebreaker">⚖️ Tiebreaker</button>
                    <button onClick={() => handleEditGroup(group)} className="text-green-100 hover:text-white text-xs">✏️</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-2 py-2 text-left">#</th>
                        <th className="px-2 py-2 text-left">Team</th>
                        <th className="px-1 py-2 text-center">P</th>
                        <th className="px-1 py-2 text-center">W</th>
                        <th className="px-1 py-2 text-center">D</th>
                        <th className="px-1 py-2 text-center">L</th>
                        <th className="px-1 py-2 text-center">GF</th>
                        <th className="px-1 py-2 text-center">GA</th>
                        <th className="px-1 py-2 text-center">GD</th>
                        <th className="px-2 py-2 text-center font-bold">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeams.map((team, idx) => {
                        const gd = team.goalsFor - team.goalsAgainst;
                        return (
                          <tr key={team._id} className={`border-t ${idx < 2 ? 'bg-green-50' : ''}`}>
                            <td className="px-2 py-2 font-medium text-gray-500">
                              {idx + 1}
                              {team.manualRank && <span className="text-purple-500 ml-1">⚖️</span>}
                            </td>
                            <td className="px-2 py-2 font-medium truncate max-w-[100px]">{team.name}</td>
                            <td className="px-1 py-2 text-center">{team.played}</td>
                            <td className="px-1 py-2 text-center text-green-600">{team.won}</td>
                            <td className="px-1 py-2 text-center text-gray-500">{team.drawn}</td>
                            <td className="px-1 py-2 text-center text-red-500">{team.lost}</td>
                            <td className="px-1 py-2 text-center">{team.goalsFor}</td>
                            <td className="px-1 py-2 text-center">{team.goalsAgainst}</td>
                            <td className="px-1 py-2 text-center">
                              <span className={gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-500' : ''}>
                                {gd > 0 ? '+' : ''}{gd}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center font-bold">{team.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {groups.length === 0 && !manualMode && (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <p className="text-4xl mb-4">🎲</p>
          <p>No groups yet</p>
        </div>
      )}
    </div>
  );
}

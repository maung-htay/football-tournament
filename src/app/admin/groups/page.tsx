'use client';

import { useState, useEffect } from 'react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
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

  useEffect(() => {
    fetchData();
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
    
    // Check if already in this group - remove it
    if (currentTeams.includes(teamId)) {
      setManualGroups({
        ...manualGroups,
        [selectedGroup]: currentTeams.filter(id => id !== teamId),
      });
      return;
    }

    // Check if in another group - move it
    let newGroups = { ...manualGroups };
    for (const [groupName, teamIds] of Object.entries(newGroups)) {
      if (teamIds.includes(teamId)) {
        newGroups[groupName] = teamIds.filter(id => id !== teamId);
        break;
      }
    }

    // Check group limit
    if (newGroups[selectedGroup].length >= teamsPerGroup) {
      setError(`${selectedGroup} is full (max ${teamsPerGroup} teams)`);
      return;
    }

    newGroups[selectedGroup] = [...newGroups[selectedGroup], teamId];
    setManualGroups(newGroups);
    setError('');
  };

  // Get team's current group assignment
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
    if (!confirm('Reset all groups?')) return;
    
    setError('');
    setSuccess('');
    setResetting(true);

    try {
      const res = await fetch('/api/groups/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset');
      setSuccess('Groups reset');
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
            {resetting ? '...' : '🗑️ Reset'}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Draw Settings - Only show when no groups exist */}
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
                {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
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
          {/* Group Selection */}
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
              Click a team to add to <strong>{selectedGroup}</strong>. Click again to remove.
            </p>

            {/* All Teams Grid - Show full team name */}
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

          {/* Preview Groups - Show full team name */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(manualGroups).map(([groupName, teamIds]) => (
              <div 
                key={groupName} 
                onClick={() => setSelectedGroup(groupName)}
                className={`bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition ${
                  selectedGroup === groupName ? 'border-green-500' : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className={`px-3 py-2 text-sm font-bold ${selectedGroup === groupName ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                  {groupName} ({teamIds.length}/{teamsPerGroup})
                </div>
                <div className="p-2 space-y-1 min-h-[80px]">
                  {teamIds.map(teamId => {
                    const team = allTeams.find(t => t._id === teamId);
                    return team ? (
                      <div key={teamId} className="text-xs bg-gray-50 rounded px-2 py-1 truncate">
                        {team.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={() => setManualMode(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancel</button>
            <button onClick={saveManualDraw} disabled={savingManual} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {savingManual ? 'Saving...' : '💾 Save Groups'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Group Modal - Show full team name */}
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

      {/* Existing Groups Display - Show full team name */}
      {groups.length > 0 && !manualMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {groups.map((group) => (
            <div key={group._id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-green-600 text-white px-3 py-2 flex justify-between items-center">
                <h3 className="font-bold text-sm">{group.name}</h3>
                <button onClick={() => handleEditGroup(group)} className="text-green-100 hover:text-white text-xs">✏️</button>
              </div>
              <ul className="divide-y">
                {group.teams.map((team, idx) => (
                  <li key={team._id} className="px-3 py-2 flex items-center text-sm">
                    <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">{idx + 1}</span>
                    <span className="font-medium truncate">{team.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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

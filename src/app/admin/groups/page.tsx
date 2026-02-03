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
  
  // Edit mode
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
      setGroups([]);
      setAllTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = async () => {
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
        throw new Error(data.error || 'Failed to draw groups');
      }

      setSuccess('Group draw completed!');
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDrawing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all groups? This will remove all group assignments and delete related matches.')) return;
    
    setError('');
    setSuccess('');
    setResetting(true);

    try {
      const res = await fetch('/api/groups/reset', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset groups');
      }

      setSuccess('Groups reset successfully');
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setResetting(false);
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setSelectedTeams(group.teams.map(t => t._id));
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleSaveGroup = async () => {
    if (!editingGroup) return;
    
    setError('');
    try {
      const res = await fetch(`/api/groups/${editingGroup._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: selectedTeams }),
      });

      if (!res.ok) throw new Error('Failed to update group');

      setSuccess('Group updated successfully');
      setEditMode(false);
      setEditingGroup(null);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Get teams not in any group (for editing)
  const unassignedTeams = allTeams.filter(team => {
    if (editingGroup) {
      // Include teams from the group being edited
      const inCurrentGroup = editingGroup.teams.some(t => t._id === team._id);
      if (inCurrentGroup) return true;
    }
    // Check if team is in any other group
    return !groups.some(g => 
      g._id !== editingGroup?._id && g.teams.some(t => t._id === team._id)
    );
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Group Draw</h2>
        {groups.length > 0 && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {resetting ? 'Resetting...' : '🗑️ Reset All Groups'}
          </button>
        )}
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

      {/* Draw Settings */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">🎲 Draw Settings</h3>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Groups
            </label>
            <select
              value={groupCount}
              onChange={(e) => setGroupCount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} Groups</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teams per Group
            </label>
            <select
              value={teamsPerGroup}
              onChange={(e) => setTeamsPerGroup(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {[3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} Teams</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDraw}
            disabled={drawing || allTeams.length < groupCount * teamsPerGroup}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {drawing ? 'Drawing...' : '🎲 Start Draw'}
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Required: {groupCount * teamsPerGroup} teams / Registered: {allTeams.length} teams
          {allTeams.length < groupCount * teamsPerGroup && (
            <span className="text-red-500 ml-2">
              ※ Not enough teams
            </span>
          )}
        </p>
      </div>

      {/* Edit Group Modal */}
      {editMode && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit {editingGroup.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Select teams for this group:</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unassignedTeams.map((team) => (
                <label 
                  key={team._id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                    selectedTeams.includes(team._id) 
                      ? 'bg-green-100 border-2 border-green-500' 
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team._id)}
                    onChange={() => toggleTeamSelection(team._id)}
                    className="w-5 h-5"
                  />
                  {team.logoUrl && (
                    <img src={team.logoUrl} alt="" className="w-8 h-8 object-contain" />
                  )}
                  <div>
                    <p className="font-medium">{team.shortName}</p>
                    <p className="text-xs text-gray-500">{team.name}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Selected: {selectedTeams.length} teams
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditingGroup(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups Display */}
      {groups.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map((group) => (
            <div key={group._id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-green-600 text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-bold">{group.name}</h3>
                <button
                  onClick={() => handleEditGroup(group)}
                  className="text-green-100 hover:text-white text-sm"
                >
                  ✏️ Edit
                </button>
              </div>
              <ul className="divide-y">
                {group.teams.map((team, idx) => (
                  <li key={team._id} className="px-4 py-3 flex items-center">
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm mr-3">
                      {idx + 1}
                    </span>
                    {team.logoUrl && (
                      <img src={team.logoUrl} alt="" className="w-8 h-8 object-contain mr-2" />
                    )}
                    <div>
                      <p className="font-medium">{team.shortName}</p>
                      <p className="text-xs text-gray-500">{team.name}</p>
                    </div>
                  </li>
                ))}
                {group.teams.length === 0 && (
                  <li className="px-4 py-6 text-center text-gray-400">
                    No teams assigned
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <p className="text-4xl mb-4">🎲</p>
          <p>No groups drawn yet</p>
          <p className="text-sm mt-2">Configure settings above and start the draw</p>
        </div>
      )}
    </div>
  );
}

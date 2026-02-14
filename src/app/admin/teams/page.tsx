'use client';

import { useState, useEffect } from 'react';

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  groupId?: { name: string };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', shortName: '', logoUrl: '' });
  const [bulkText, setBulkText] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', shortName: '', logoUrl: '' });
    setEditingTeam(null);
    setShowForm(false);
    setShowBulkAdd(false);
    setBulkText('');
    setError('');
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl || '',
    });
    setShowForm(true);
    setShowBulkAdd(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.shortName) {
      setError('Please fill in required fields');
      return;
    }

    if (formData.shortName.length > 5) {
      setError('Short name must be 5 characters or less');
      return;
    }

    try {
      const url = editingTeam ? `/api/teams/${editingTeam._id}` : '/api/teams';
      const method = editingTeam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save team');
      }

      setSuccess(editingTeam ? 'Team updated' : 'Team added');
      resetForm();
      fetchTeams();
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Bulk Add Teams
  const handleBulkAdd = async () => {
    if (!bulkText.trim()) {
      setError('Please enter team names');
      return;
    }

    setError('');
    setSuccess('');
    setBulkAdding(true);

    const lines = bulkText.trim().split('\n').filter(line => line.trim());
    let added = 0;
    let failed = 0;

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      const name = parts[0];
      const shortName = parts[1] || name.slice(0, 5).toUpperCase();

      if (!name) continue;

      try {
        const res = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, shortName }),
        });

        if (res.ok) {
          added++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }
    }

    setBulkAdding(false);
    setBulkText('');
    setShowBulkAdd(false);
    fetchTeams();

    if (failed > 0) {
      setSuccess(`Added ${added} teams, ${failed} failed`);
    } else {
      setSuccess(`Added ${added} teams`);
    }
  };

  // Delete single team
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Team deleted');
      fetchTeams();
    } catch (error) {
      setError('Failed to delete team');
    }
  };

  // Delete ALL teams, groups, and matches
  const handleDeleteAll = async () => {
    if (!confirm('⚠️ Delete ALL teams, groups, and matches? This cannot be undone!')) return;
    if (!confirm('Are you absolutely sure? Everything will be deleted!')) return;

    setError('');
    setSuccess('');
    setDeletingAll(true);

    try {
      const res = await fetch('/api/teams/delete-all', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete all');
      
      setSuccess('All teams, groups, and matches deleted');
      fetchTeams();
    } catch (error) {
      setError('Failed to delete all');
    } finally {
      setDeletingAll(false);
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Team Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setShowBulkAdd(!showBulkAdd); setShowForm(false); }}
            className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            📋 Bulk Add
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowBulkAdd(false); setEditingTeam(null); setFormData({ name: '', shortName: '', logoUrl: '' }); }}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            + Add
          </button>
          {teams.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="flex-1 sm:flex-none bg-red-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {deletingAll ? '...' : '🗑️ Delete All'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Bulk Add Form */}
      {showBulkAdd && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-lg font-bold mb-2">📋 Bulk Add Teams</h3>
          <p className="text-sm text-gray-600 mb-3">
            Enter one team per line. Format: <code className="bg-gray-200 px-1 rounded">Team Name</code> or <code className="bg-gray-200 px-1 rounded">Team Name, SHORT</code>
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm h-40 font-mono"
            placeholder={`Tokyo United\nOsaka FC, OSK\nNagoya Stars\nKyoto Dragons, KYOTO`}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleBulkAdd}
              disabled={bulkAdding}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {bulkAdding ? 'Adding...' : 'Add All Teams'}
            </button>
            <button onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Single Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold mb-3">{editingTeam ? 'Edit Team' : 'Add Team'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Tokyo United"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Name * (max 5)</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value.slice(0, 5).toUpperCase() })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. TKY"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
              {editingTeam ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {teams.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">No teams yet</div>
        ) : teams.map((team) => (
          <div key={team._id} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-3">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt="" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">⚽</div>
              )}
              <div className="flex-1">
                <p className="font-bold">{team.name}</p>
                <p className="text-sm text-gray-500">{team.shortName}</p>
              </div>
              {team.groupId && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{(team.groupId as any).name}</span>
              )}
            </div>
            <div className="mt-2 flex gap-2 justify-end">
              <button onClick={() => handleEdit(team)} className="text-blue-600 text-sm">Edit</button>
              <button onClick={() => handleDelete(team._id, team.name)} className="text-red-600 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teams.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No teams yet</td></tr>
            ) : teams.map((team) => (
              <tr key={team._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt="" className="w-10 h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">⚽</div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{team.name}</td>
                <td className="px-4 py-3 text-gray-600">{team.shortName}</td>
                <td className="px-4 py-3">
                  {team.groupId ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{(team.groupId as any).name}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handleEdit(team)} className="text-blue-600 text-sm">Edit</button>
                  <button onClick={() => handleDelete(team._id, team.name)} className="text-red-600 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">Total: {teams.length} teams</div>
    </div>
  );
}

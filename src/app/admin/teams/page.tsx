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
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', shortName: '', logoUrl: '' });
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

      setSuccess(editingTeam ? 'Team updated successfully' : 'Team registered successfully');
      resetForm();
      fetchTeams();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Team deleted successfully');
      fetchTeams();
    } catch (error) {
      setError('Failed to delete team');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setEditingTeam(null);
              setFormData({ name: '', shortName: '', logoUrl: '' });
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add Team'}
        </button>
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

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">
            {editingTeam ? 'Edit Team' : 'Register New Team'}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Tokyo United"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Name * (max 5)
              </label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value.slice(0, 5).toUpperCase() })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. TKY"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL (optional)
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          {formData.logoUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Logo Preview:</p>
              <img 
                src={formData.logoUrl} 
                alt="Logo preview" 
                className="w-16 h-16 object-contain border rounded"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {editingTeam ? 'Update' : 'Register'}
            </button>
            {editingTeam && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Teams List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Logo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Team Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Short Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Group
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No teams registered yet
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        ⚽
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{team.name}</td>
                  <td className="px-6 py-4 text-gray-600">{team.shortName}</td>
                  <td className="px-6 py-4">
                    {team.groupId ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {(team.groupId as any).name || 'Assigned'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(team)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team._id, team.name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">
        Total Teams: {teams.length}
      </div>
    </div>
  );
}

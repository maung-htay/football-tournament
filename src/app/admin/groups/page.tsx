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

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [groupCount, setGroupCount] = useState(4);
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setGroups([]);
      setTeams([]);
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

      setSuccess('グループ抽選が完了しました！');
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDrawing(false);
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
      <h2 className="text-2xl font-bold text-gray-800">グループ抽選</h2>

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
        <h3 className="text-lg font-bold mb-4">🎲 抽選設定</h3>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              グループ数
            </label>
            <select
              value={groupCount}
              onChange={(e) => setGroupCount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}グループ</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1グループあたりのチーム数
            </label>
            <select
              value={teamsPerGroup}
              onChange={(e) => setTeamsPerGroup(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {[3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}チーム</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDraw}
            disabled={drawing || teams.length < groupCount * teamsPerGroup}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {drawing ? '抽選中...' : '🎲 抽選実行'}
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          必要チーム数: {groupCount * teamsPerGroup}チーム / 登録チーム数: {teams.length}チーム
          {teams.length < groupCount * teamsPerGroup && (
            <span className="text-red-500 ml-2">
              ※ チームが不足しています
            </span>
          )}
        </p>
      </div>

      {/* Groups Display */}
      {groups.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map((group) => (
            <div key={group._id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-green-600 text-white px-4 py-3">
                <h3 className="font-bold">{group.name}</h3>
              </div>
              <ul className="divide-y">
                {group.teams.map((team, idx) => (
                  <li key={team._id} className="px-4 py-3 flex items-center">
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm mr-3">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium">{team.shortName}</p>
                      <p className="text-xs text-gray-500">{team.name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <p className="text-4xl mb-4">🎲</p>
          <p>グループ抽選がまだ行われていません</p>
          <p className="text-sm mt-2">上の設定で抽選を実行してください</p>
        </div>
      )}
    </div>
  );
}

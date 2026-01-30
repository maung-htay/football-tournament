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
    defaultVenue: '',
    startDate: '',
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
      setMatches([]);
      setTeams([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create match');

      setSuccess('試合を作成しました');
      setShowForm(false);
      setFormData({
        homeTeam: '',
        awayTeam: '',
        groupId: '',
        round: 'group',
        venue: '',
        matchDate: '',
        matchTime: '',
      });
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
        throw new Error(data.error || 'Failed to generate matches');
      }

      setSuccess('グループステージの試合を自動生成しました');
      setShowGenerate(false);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この試合を削除しますか？')) return;

    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('試合を削除しました');
      fetchData();
    } catch (error) {
      setError('削除に失敗しました');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoundLabel = (round: string) => {
    const labels: Record<string, string> = {
      group: 'グループ',
      round16: 'R16',
      quarter: '準々',
      semi: '準決',
      third: '3位',
      final: '決勝',
    };
    return labels[round] || round;
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
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800">試合管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowGenerate(!showGenerate); setShowForm(false); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            ⚡ 自動生成
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowGenerate(false); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + 試合追加
          </button>
        </div>
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

      {/* Auto Generate Form */}
      {showGenerate && (
        <form onSubmit={handleGenerate} className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">⚡ グループステージ自動生成</h3>
          <p className="text-sm text-gray-600 mb-4">
            既存のグループ分けに基づいて、総当たり戦の試合を自動生成します。
            既存のグループステージ試合は削除されます。
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会場名
              </label>
              <input
                type="text"
                value={generateData.defaultVenue}
                onChange={(e) => setGenerateData({ ...generateData, defaultVenue: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="例: 中央グラウンド"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                value={generateData.startDate}
                onChange={(e) => setGenerateData({ ...generateData, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={generating || groups.length === 0}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {generating ? '生成中...' : '生成する'}
          </button>
          {groups.length === 0 && (
            <p className="mt-2 text-sm text-red-500">
              ※ 先にグループ抽選を行ってください
            </p>
          )}
        </form>
      )}

      {/* Manual Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">試合を手動追加</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ホームチーム
              </label>
              <select
                value={formData.homeTeam}
                onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">選択...</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アウェイチーム
              </label>
              <select
                value={formData.awayTeam}
                onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">選択...</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ラウンド
              </label>
              <select
                value={formData.round}
                onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="group">グループステージ</option>
                <option value="round16">ラウンド16</option>
                <option value="quarter">準々決勝</option>
                <option value="semi">準決勝</option>
                <option value="third">3位決定戦</option>
                <option value="final">決勝</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会場
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="例: Aグラウンド"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日付
              </label>
              <input
                type="date"
                value={formData.matchDate}
                onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                時間
              </label>
              <input
                type="time"
                value={formData.matchTime}
                onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            登録
          </button>
        </form>
      )}

      {/* Matches List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  日時
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  対戦
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  スコア
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ラウンド
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  会場
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    試合がまだ登録されていません
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={match._id} className="hover:bg-gray-50">
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
                      {match.status === 'completed' ? (
                        <span className="font-bold">{match.homeScore} - {match.awayScore}</span>
                      ) : (
                        <span className="text-gray-400">- : -</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {getRoundLabel(match.round)}
                        {match.groupId && ` ${match.groupId.name}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{match.venue}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(match._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        総試合数: {matches.length}
      </div>
    </div>
  );
}

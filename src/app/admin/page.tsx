'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalTeams: number;
  totalGroups: number;
  totalMatches: number;
  completedMatches: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTeams: 0,
    totalGroups: 0,
    totalMatches: 0,
    completedMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [teamsRes, groupsRes, matchesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/groups'),
        fetch('/api/matches'),
      ]);
      const teams = await teamsRes.json();
      const groups = await groupsRes.json();
      const matches = await matchesRes.json();

      const teamsArr = Array.isArray(teams) ? teams : [];
      const groupsArr = Array.isArray(groups) ? groups : [];
      const matchesArr = Array.isArray(matches) ? matches : [];

      setStats({
        totalTeams: teamsArr.length,
        totalGroups: groupsArr.length,
        totalMatches: matchesArr.length,
        completedMatches: matchesArr.filter((m: any) => m.status === 'completed').length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Registered Teams', value: stats.totalTeams, color: 'bg-blue-500', link: '/admin/teams' },
    { label: 'Groups', value: stats.totalGroups, color: 'bg-green-500', link: '/admin/groups' },
    { label: 'Total Matches', value: stats.totalMatches, color: 'bg-purple-500', link: '/admin/matches' },
    { label: 'Completed', value: stats.completedMatches, color: 'bg-orange-500', link: '/admin/scores' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.link}>
            <div className={`${stat.color} text-white rounded-xl p-6 shadow-lg hover:opacity-90 transition`}>
              <p className="text-sm opacity-80">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/teams"
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <span className="text-3xl mb-2">👥</span>
            <span className="text-sm font-medium text-blue-800">Add Teams</span>
          </Link>
          <Link
            href="/admin/groups"
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <span className="text-3xl mb-2">🎲</span>
            <span className="text-sm font-medium text-green-800">Group Draw</span>
          </Link>
          <Link
            href="/admin/matches"
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            <span className="text-3xl mb-2">📅</span>
            <span className="text-sm font-medium text-purple-800">Create Matches</span>
          </Link>
          <Link
            href="/admin/scores"
            className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
          >
            <span className="text-3xl mb-2">⚽</span>
            <span className="text-sm font-medium text-orange-800">Update Scores</span>
          </Link>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-yellow-800 mb-3">📋 Tournament Setup Guide</h3>
        <ol className="space-y-2 text-yellow-900">
          <li className="flex items-start">
            <span className="bg-yellow-200 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">1</span>
            <span><strong>Register Teams</strong> - Add all participating teams</span>
          </li>
          <li className="flex items-start">
            <span className="bg-yellow-200 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">2</span>
            <span><strong>Group Draw</strong> - Randomly assign teams to groups</span>
          </li>
          <li className="flex items-start">
            <span className="bg-yellow-200 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">3</span>
            <span><strong>Generate Matches</strong> - Auto-generate group stage fixtures</span>
          </li>
          <li className="flex items-start">
            <span className="bg-yellow-200 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">4</span>
            <span><strong>Update Scores</strong> - Enter results to auto-update standings</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalTeams: number;
  totalGroups: number;
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  visitors: number;  // ADD THIS
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTeams: 0,
    totalGroups: 0,
    totalMatches: 0,
    completedMatches: 0,
    liveMatches: 0,
    visitors: 0,  // ADD THIS
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto refresh only when live matches exist
  useEffect(() => {
    if (stats.liveMatches === 0) return;

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [stats.liveMatches]);

  const fetchStats = async () => {
    try {
      const [teamsRes, groupsRes, matchesRes, visitorsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/groups'),
        fetch('/api/matches'),
        fetch('/api/visitors'),  // ADD THIS
      ]);
      const teams = await teamsRes.json();
      const groups = await groupsRes.json();
      const matches = await matchesRes.json();
      const visitors = await visitorsRes.json();

      const teamsArr = Array.isArray(teams) ? teams : [];
      const groupsArr = Array.isArray(groups) ? groups : [];
      const matchesArr = Array.isArray(matches) ? matches : [];


      setStats({
        totalTeams: teamsArr.length,
        totalGroups: groupsArr.length,
        totalMatches: matchesArr.length,
        completedMatches: matchesArr.filter((m: any) => m.status === 'completed').length,
        liveMatches: matchesArr.filter((m: any) => m.status === 'live').length,
        visitors: visitors.count || 0,  // ADD THIS
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
    { label: 'Visitors', value: stats.visitors, color: 'bg-pink-500', link: '#' },  // ADD THIS
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-b-2 border-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.link}>
            <div className={`${stat.color} text-white rounded-xl p-6 shadow-lg hover:opacity-90 transition`}>
              <p className="text-sm opacity-80">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-white shadow rounded-xl">
        <h3 className="mb-4 text-lg font-bold text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/admin/teams"
            className="flex flex-col items-center p-4 transition rounded-lg bg-blue-50 hover:bg-blue-100"
          >
            <span className="mb-2 text-3xl">👥</span>
            <span className="text-sm font-medium text-blue-800">Add Teams</span>
          </Link>
          <Link
            href="/admin/groups"
            className="flex flex-col items-center p-4 transition rounded-lg bg-green-50 hover:bg-green-100"
          >
            <span className="mb-2 text-3xl">🎲</span>
            <span className="text-sm font-medium text-green-800">Group Draw</span>
          </Link>
          <Link
            href="/admin/matches"
            className="flex flex-col items-center p-4 transition rounded-lg bg-purple-50 hover:bg-purple-100"
          >
            <span className="mb-2 text-3xl">📅</span>
            <span className="text-sm font-medium text-purple-800">Create Matches</span>
          </Link>
          <Link
            href="/admin/scores"
            className="flex flex-col items-center p-4 transition rounded-lg bg-orange-50 hover:bg-orange-100"
          >
            <span className="mb-2 text-3xl">⚽</span>
            <span className="text-sm font-medium text-orange-800">Update Scores</span>
          </Link>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="p-6 border border-yellow-200 bg-yellow-50 rounded-xl">
        <h3 className="mb-3 text-lg font-bold text-yellow-800">📋 Tournament Setup Guide</h3>
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

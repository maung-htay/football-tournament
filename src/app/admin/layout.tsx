'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/teams', label: 'Teams', icon: '👥' },
    { href: '/admin/groups', label: 'Groups', icon: '🎲' },
    { href: '/admin/matches', label: 'Matches', icon: '📅' },
    { href: '/admin/scores', label: 'Scores', icon: '⚽' },
    { href: '/admin/standings', label: 'Standings', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-lg sm:text-xl font-bold">⚽ Admin Panel</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  pathname === item.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">{item.icon} </span>{item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">{children}</main>
    </div>
  );
}

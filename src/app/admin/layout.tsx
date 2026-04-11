'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'volunteer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Pages volunteer can access
  const volunteerPages = ['/admin', '/admin/scores', '/admin/standings'];

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem('adminAuth');
    const role = sessionStorage.getItem('adminRole') as 'admin' | 'volunteer' | null;
    if (auth === 'true' && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      
      // Redirect volunteer if trying to access restricted page
      if (role === 'volunteer' && !volunteerPages.includes(pathname)) {
        router.push('/admin/scores');
      }
    }
    setIsLoading(false);
  }, [pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminRole', data.role);
        setIsAuthenticated(true);
        setUserRole(data.role);
        
        // Redirect volunteer to scores page
        if (data.role === 'volunteer') {
          router.push('/admin/scores');
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminRole');
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername('');
    setPassword('');
  };

  const allNavItems = [
    { href: '/admin', label: 'Dashboard', icon: '🏠', roles: ['admin', 'volunteer'] },
    { href: '/admin/teams', label: 'Teams', icon: '👥', roles: ['admin'] },
    { href: '/admin/groups', label: 'Groups', icon: '🎲', roles: ['admin'] },
    { href: '/admin/matches', label: 'Matches', icon: '📅', roles: ['admin'] },
    { href: '/admin/scores', label: 'Scores', icon: '⚽', roles: ['admin', 'volunteer'] },
    { href: '/admin/standings', label: 'Standings', icon: '📊', roles: ['admin', 'volunteer'] },
  ];

  // Filter nav items based on role
  const navItems = allNavItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">⚽ Admin Login</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-green-600 hover:text-green-700 text-sm">
              ← Back to Tournament
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold">⚽ Admin Panel</h1>
            {userRole === 'volunteer' && (
              <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded">Volunteer</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-white text-sm"
          >
            Logout →
          </button>
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

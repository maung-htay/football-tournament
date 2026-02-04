'use client';

import Link from 'next/link';

export default function ContactPage() {
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || '';
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL || '';
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL || '';

  const socialLinks = [
    {
      name: 'Facebook',
      url: facebookUrl,
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'TikTok',
      url: tiktokUrl,
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
      color: 'bg-black hover:bg-gray-800',
    },
    {
      name: 'YouTube',
      url: youtubeUrl,
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: 'bg-red-600 hover:bg-red-700',
    },
  ].filter(link => link.url); // Only show links that have URLs

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold">⚽ Football Tournament</Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
          <p className="text-gray-500 mb-8">Follow us on social media!</p>

          {socialLinks.length > 0 ? (
            <div className="space-y-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-4 ${link.color} text-white rounded-xl py-4 px-6 transition transform hover:scale-105`}
                >
                  {link.icon}
                  <span className="text-lg font-medium">{link.name}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No social links configured</p>
          )}

          <div className="mt-8 pt-8 border-t">
            <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
              ← Back to Tournament
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

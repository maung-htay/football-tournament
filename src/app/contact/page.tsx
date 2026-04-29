'use client';

import Link from 'next/link';

export default function ContactPage() {
  const messengerUrl = process.env.NEXT_PUBLIC_MESSENGER_URL || '';

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Contact Us</h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            ဒီ website ကို သုံးချင်တဲ့ ညီအကိုမောင်နှမများခင်ဗျာ<br />
            ဘယ်နိုင်ငံကဖြစ်ဖြစ် ဆက်သွယ်မေးမြန်းနိုင်ပါတယ် ခင်ဗျာ
          </p>

          {messengerUrl ? (
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-4 px-8 transition transform hover:scale-105 shadow-lg"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.906 1.453 5.502 3.728 7.202V22l3.405-1.868c.91.252 1.87.388 2.867.388 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.07 12.47l-2.547-2.72-4.97 2.72 5.47-5.808 2.612 2.72 4.9-2.72-5.465 5.808z"/>
              </svg>
              <span className="text-lg font-medium">Messenger မှာ ဆက်သွယ်ရန်</span>
            </a>
          ) : (
            <p className="text-gray-400">Contact link not configured</p>
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

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');

    // Valid credentials
    const validUsername = 'admin';
    const validPassword = 'admin123!';
    const validAuth = 'Basic ' + Buffer.from(`${validUsername}:${validPassword}`).toString('base64');

    if (!authHeader || authHeader !== validAuth) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};

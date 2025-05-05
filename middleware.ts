import { NextRequest, NextResponse } from 'next/server';

// Protected routes - just the homepage which contains all functionality
const protectedRoutes = ['/'];
const publicRoutes = ['/login'];

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);
  
  // Check for authentication token in cookies
  const authToken = req.cookies.get('firebase-auth-token')?.value;
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Redirect to home if accessing login while already authenticated
  if (isPublicRoute && authToken) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}



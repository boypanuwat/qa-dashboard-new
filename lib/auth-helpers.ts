import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';

/**
 * Get the current session on server side
 * Use this in Server Components or API Routes
 */
export async function getServerSession() {
  return getNextAuthSession(authOptions);
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

/**
 * Require admin role - redirect to dashboard if not admin
 * Use this in admin-only pages
 */
export async function requireAdmin() {
  const session = await requireAuth();
  
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }
  
  return session;
}

/**
 * Check if user is authenticated (for API routes)
 * Returns session or throws error
 */
export async function apiRequireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

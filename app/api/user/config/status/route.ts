import { NextResponse } from 'next/server';
import { apiRequireAuth } from '@/lib/auth-helpers';
import { getConfigStatus } from '@/lib/config-check';

// GET /api/user/config/status - Check if user has configured their credentials
export async function GET() {
  try {
    const session = await apiRequireAuth();
    const status = await getConfigStatus(session.user.email);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking config status:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to check configuration status' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAuth } from '@/lib/auth-helpers';
import { getUserConfig, updateUserConfig } from '@/lib/google-sheets-auth';

// GET /api/user/config - Get user's configuration
export async function GET() {
  try {
    const session = await apiRequireAuth();
    const config = await getUserConfig(session.user.email);

    if (!config) {
      return NextResponse.json(
        {
          aioApiUrl: '',
          aioProjectId: '',
          aioToken: '',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      aioApiUrl: config.aioApiUrl,
      aioProjectId: config.aioProjectId,
      aioToken: config.aioToken,
    });
  } catch (error) {
    console.error('Error fetching user config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/user/config - Update user's configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await apiRequireAuth();
    const body = await request.json();

    const { aioApiUrl, aioProjectId, aioToken } = body;

    // Validate required fields
    if (!aioApiUrl || !aioProjectId || !aioToken) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Update configuration in Google Sheets
    const updatedConfig = await updateUserConfig(session.user.email, {
      aioApiUrl,
      aioProjectId,
      aioToken,
    });

    return NextResponse.json({
      message: 'Configuration updated successfully',
      config: {
        aioApiUrl: updatedConfig.aioApiUrl,
        aioProjectId: updatedConfig.aioProjectId,
        aioToken: updatedConfig.aioToken,
      },
    });
  } catch (error) {
    console.error('Error updating user config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

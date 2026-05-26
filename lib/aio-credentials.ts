import { getUserConfig } from './google-sheets-auth';

export interface AIOCredentials {
  apiUrl: string;
  projectId: string;
  apiToken: string;
}

/**
 * Get AIO credentials for a specific user
 * Falls back to environment variables if user config not found
 */
export async function getAIOCredentials(userEmail: string): Promise<AIOCredentials> {
  try {
    // Try to get user-specific config from Google Sheets
    const userConfig = await getUserConfig(userEmail);

    if (userConfig && userConfig.aioApiUrl && userConfig.aioProjectId && userConfig.aioToken) {
      return {
        apiUrl: userConfig.aioApiUrl,
        projectId: userConfig.aioProjectId,
        apiToken: userConfig.aioToken,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch user config, falling back to environment variables:', error);
  }

  // Fallback to environment variables
  const apiUrl = process.env.NEXT_PUBLIC_AIO_API_URL;
  const projectId = process.env.NEXT_PUBLIC_AIO_PROJECT_ID;
  const apiToken = process.env.NEXT_PUBLIC_AIO_API_TOKEN;

  if (!apiUrl || !projectId || !apiToken) {
    const error = new Error(
      'AIO credentials not configured. Please set up your credentials in Settings or configure environment variables.'
    ) as Error & { code?: string };
    error.code = 'NO_CREDENTIALS';
    throw error;
  }

  return {
    apiUrl,
    projectId,
    apiToken,
  };
}

/**
 * Get AIO credentials from environment variables only (for backward compatibility)
 */
export function getAIOCredentialsFromEnv(): AIOCredentials {
  const apiUrl = process.env.NEXT_PUBLIC_AIO_API_URL;
  const projectId = process.env.NEXT_PUBLIC_AIO_PROJECT_ID;
  const apiToken = process.env.NEXT_PUBLIC_AIO_API_TOKEN;

  if (!apiUrl || !projectId || !apiToken) {
    throw new Error(
      'AIO environment variables not configured. Please check your .env.local file.'
    );
  }

  return {
    apiUrl,
    projectId,
    apiToken,
  };
}

/**
 * Make authenticated request to AIO API
 */
export async function fetchAIO(
  endpoint: string,
  credentials: AIOCredentials
): Promise<any> {
  const fullUrl = `${credentials.apiUrl}${endpoint}`;

  try {
    const response = await fetch(fullUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `AioAuth ${credentials.apiToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AIO API Error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error('AIO API fetch error:', error);
    throw error;
  }
}

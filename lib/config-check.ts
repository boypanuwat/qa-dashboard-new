import { getUserConfig } from './google-sheets-auth';

export interface ConfigStatus {
  hasConfig: boolean;
  hasApiUrl: boolean;
  hasProjectId: boolean;
  hasApiToken: boolean;
  isComplete: boolean;
}

/**
 * Check if user has configured their AIO credentials
 */
export async function checkUserHasConfig(userEmail: string): Promise<boolean> {
  try {
    const config = await getUserConfig(userEmail);
    
    if (!config) {
      return false;
    }

    // Check if all required fields are present and not empty
    return !!(
      config.aioApiUrl &&
      config.aioProjectId &&
      config.aioToken &&
      config.aioApiUrl.trim() !== '' &&
      config.aioProjectId.trim() !== '' &&
      config.aioToken.trim() !== ''
    );
  } catch (error) {
    console.error('Error checking user config:', error);
    return false;
  }
}

/**
 * Get detailed config status for a user
 */
export async function getConfigStatus(userEmail: string): Promise<ConfigStatus> {
  try {
    const config = await getUserConfig(userEmail);

    if (!config) {
      return {
        hasConfig: false,
        hasApiUrl: false,
        hasProjectId: false,
        hasApiToken: false,
        isComplete: false,
      };
    }

    const hasApiUrl = !!(config.aioApiUrl && config.aioApiUrl.trim() !== '');
    const hasProjectId = !!(config.aioProjectId && config.aioProjectId.trim() !== '');
    const hasApiToken = !!(config.aioToken && config.aioToken.trim() !== '');
    const isComplete = hasApiUrl && hasProjectId && hasApiToken;

    return {
      hasConfig: true,
      hasApiUrl,
      hasProjectId,
      hasApiToken,
      isComplete,
    };
  } catch (error) {
    console.error('Error getting config status:', error);
    return {
      hasConfig: false,
      hasApiUrl: false,
      hasProjectId: false,
      hasApiToken: false,
      isComplete: false,
    };
  }
}

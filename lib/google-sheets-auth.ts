import { google } from 'googleapis';

// Types
export interface User {
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface UserConfig {
  email: string;
  aioApiUrl: string;
  aioProjectId: string;
  aioToken: string;
  updatedAt: string;
}

// Google Sheets configuration
const SPREADSHEET_ID = process.env.AUTH_SPREADSHEET_ID || '';
const USERS_SHEET = 'Users';
const CONFIGS_SHEET = 'Configs';

// Initialize Google Sheets API
function getGoogleSheetsClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  let parsedCredentials;
  try {
    parsedCredentials = JSON.parse(credentials);
  } catch (error) {
    console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:', error);
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: parsedCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// User operations
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USERS_SHEET}!A2:E`, // Skip header row
    });

    const rows = response.data.values || [];
    const userRow = rows.find((row) => row[0] === email);

    if (!userRow) {
      return null;
    }

    return {
      email: userRow[0],
      passwordHash: userRow[1],
      name: userRow[2],
      role: userRow[3] as 'admin' | 'user',
      createdAt: userRow[4],
    };
  } catch (error) {
    console.error('Error fetching user from Google Sheets:', error);
    throw error;
  }
}

export async function createUser(user: Omit<User, 'createdAt'>): Promise<User> {
  try {
    const sheets = getGoogleSheetsClient();
    const createdAt = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USERS_SHEET}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[user.email, user.passwordHash, user.name, user.role, createdAt]],
      },
    });

    return { ...user, createdAt };
  } catch (error) {
    console.error('Error creating user in Google Sheets:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USERS_SHEET}!A2:E`,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      email: row[0],
      passwordHash: row[1],
      name: row[2],
      role: row[3] as 'admin' | 'user',
      createdAt: row[4],
    }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

// Config operations
export async function getUserConfig(email: string): Promise<UserConfig | null> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CONFIGS_SHEET}!A2:E`,
    });

    const rows = response.data.values || [];
    const configRow = rows.find((row) => row[0] === email);

    if (!configRow) {
      return null;
    }

    return {
      email: configRow[0],
      aioApiUrl: configRow[1],
      aioProjectId: configRow[2],
      aioToken: configRow[3],
      updatedAt: configRow[4],
    };
  } catch (error) {
    console.error('Error fetching user config:', error);
    throw error;
  }
}

export async function updateUserConfig(
  email: string,
  config: Omit<UserConfig, 'email' | 'updatedAt'>
): Promise<UserConfig> {
  try {
    const sheets = getGoogleSheetsClient();
    const updatedAt = new Date().toISOString();

    // First, try to find existing config
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CONFIGS_SHEET}!A2:E`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === email);

    if (rowIndex >= 0) {
      // Update existing row
      const actualRowNumber = rowIndex + 2; // +2 because: 1-indexed + header row
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${CONFIGS_SHEET}!A${actualRowNumber}:E${actualRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[email, config.aioApiUrl, config.aioProjectId, config.aioToken, updatedAt]],
        },
      });
    } else {
      // Create new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${CONFIGS_SHEET}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[email, config.aioApiUrl, config.aioProjectId, config.aioToken, updatedAt]],
        },
      });
    }

    return {
      email,
      ...config,
      updatedAt,
    };
  } catch (error) {
    console.error('Error updating user config:', error);
    throw error;
  }
}

export async function deleteUserConfig(email: string): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CONFIGS_SHEET}!A2:E`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === email);

    if (rowIndex >= 0) {
      const actualRowNumber = rowIndex + 2;
      
      // Clear the row
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${CONFIGS_SHEET}!A${actualRowNumber}:E${actualRowNumber}`,
      });
    }
  } catch (error) {
    console.error('Error deleting user config:', error);
    throw error;
  }
}

// Only import fs and path in Node.js environment
const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;

const MAPPING_FILE = typeof window === 'undefined' ? path?.join(process.cwd(), 'data', 'user-mapping.json') : null;

export interface UserInfo {
  userId: string;
  displayName: string;
}

// In-memory cache for fast lookup
const userCache = new Map<string, UserInfo>();

export class UserMapping {
  // โหลด mapping จาก JSON file
  static loadMapping(): Map<string, UserInfo> {
    // Only works in Node.js environment
    if (!fs || !MAPPING_FILE) {
      return new Map();
    }

    // Check if file exists
    try {
      if (!fs.existsSync(MAPPING_FILE)) {
        console.warn(`User mapping file not found: ${MAPPING_FILE}`);
        return new Map();
      }
    } catch (err) {
      console.error('Error checking file existence:', err);
      return new Map();
    }

    try {
      const content = fs.readFileSync(MAPPING_FILE, 'utf-8');
      const jsonData = JSON.parse(content);

      const mapping = new Map<string, UserInfo>();
      
      // Convert JSON object to Map
      Object.entries(jsonData).forEach(([userId, displayName]) => {
        if (userId && displayName && typeof displayName === 'string') {
          mapping.set(userId, {
            userId,
            displayName,
          });
        }
      });

      // โหลดเข้า cache
      userCache.clear();
      mapping.forEach((value, key) => userCache.set(key, value));

      console.log(`✅ Loaded ${mapping.size} user mappings from JSON`);
      return mapping;
    } catch (error) {
      console.error('Error loading user mapping:', error);
      return new Map();
    }
  }

  // ดึงข้อมูล user จาก cache
  static getUserInfo(userId: string | null | undefined): UserInfo {
    if (!userId) {
      return {
        userId: 'Unknown',
        displayName: 'Unknown',
      };
    }

    // โหลด cache ครั้งแรก
    if (userCache.size === 0) {
      this.loadMapping();
    }

    // Lookup จาก cache
    const cached = userCache.get(userId);
    if (cached) {
      return cached;
    }

    // Fallback: แสดง userId แทน
    return {
      userId,
      displayName: userId,
    };
  }

  // ดึง displayName
  static getUserName(userId: string | null | undefined): string {
    return this.getUserInfo(userId).displayName;
  }

  // เก็บ user IDs จาก test cycles
  static collectUserIds(cycles: any[]): Set<string> {
    const userIds = new Set<string>();
    
    cycles.forEach((cycle) => {
      if (cycle.ownedByID) userIds.add(cycle.ownedByID);
      if (cycle.createdByID) userIds.add(cycle.createdByID);
    });
    
    return userIds;
  }

  // สร้าง template file
  static createTemplate(userIds: Set<string>): void {
    if (!fs || !path) {
      console.error('createTemplate only works in Node.js environment');
      return;
    }

    const dataDir = path.join(process.cwd(), 'data');
    const templateFile = path.join(dataDir, 'user-mapping-template.json');

    // สร้าง directory ถ้ายังไม่มี
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // สร้าง template object
    const template: Record<string, string> = {};
    userIds.forEach((userId) => {
      template[userId] = ''; // Empty string for user to fill in
    });

    // เขียนไฟล์
    fs.writeFileSync(templateFile, JSON.stringify(template, null, 2), 'utf-8');
    console.log(`✅ Template created: ${templateFile}`);
    console.log(`   Fill in the display names and save as user-mapping.json`);
  }
}

// Export shorthand functions (with error handling)
export const getUserInfo = (userId: string | null | undefined): UserInfo => {
  try {
    return UserMapping.getUserInfo(userId);
  } catch (error) {
    console.error('Error getting user info:', error);
    return {
      userId: userId || 'Unknown',
      displayName: userId || 'Unknown',
    };
  }
};

export const getUserName = (userId: string | null | undefined): string => {
  try {
    return UserMapping.getUserName(userId);
  } catch (error) {
    console.error('Error getting user name:', error);
    return userId || 'Unknown';
  }
};

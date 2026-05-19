/**
 * Fast JSON-based Test Run Cache (เร็วกว่า Excel 10x)
 * 
 * Structure:
 * data/testruns/
 * ├── folder-729.json      # Test runs ของ folder 729
 * ├── folder-730.json      # Test runs ของ folder 730
 * └── index.json           # Track cache metadata
 */

import { TestRunItem } from './types';

// Only import fs and path in Node.js environment
const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;

const DATA_DIR = typeof window === 'undefined' ? path?.join(process.cwd(), 'data', 'testruns') : null;
const INDEX_FILE = typeof window === 'undefined' ? path?.join(process.cwd(), 'data', 'testruns', 'index.json') : null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Cache metadata
interface CacheMetadata {
  lastSync: number;
  expiresAt: number;
  testCount: number;
  cycleKeys: string[];
  folderId: number;
  folderName: string;
}

interface TestRunCacheIndex {
  folders: {
    [folderId: string]: CacheMetadata;
  };
  version: string;
}

export class TestRunJsonCache {
  // Ensure directory exists
  private static ensureDirectory(): void {
    if (!fs || !DATA_DIR) return;
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  // Load index
  private static loadIndex(): TestRunCacheIndex {
    if (!fs || !INDEX_FILE) {
      return { folders: {}, version: '1.0' };
    }

    this.ensureDirectory();

    if (!fs.existsSync(INDEX_FILE)) {
      return { folders: {}, version: '1.0' };
    }

    try {
      const content = fs.readFileSync(INDEX_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading cache index:', error);
      return { folders: {}, version: '1.0' };
    }
  }

  // Save index
  private static saveIndex(index: TestRunCacheIndex): void {
    if (!fs || !INDEX_FILE) return;
    
    this.ensureDirectory();
    
    try {
      fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving cache index:', error);
    }
  }

  // Check if cache is valid
  static isCacheValid(folderId: number): boolean {
    if (!fs || !DATA_DIR) return false;
    
    const index = this.loadIndex();
    const metadata = index.folders[folderId.toString()];
    
    if (!metadata) return false;
    
    const now = Date.now();
    const isExpired = now > metadata.expiresAt;
    
    if (isExpired) {
      console.log(`❌ Cache expired for folder ${folderId}`);
      return false;
    }
    
    // Check if file exists
    const fileName = `folder-${folderId}.json`;
    const filePath = path.join(DATA_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Cache file not found for folder ${folderId}`);
      return false;
    }
    
    const timeLeft = Math.round((metadata.expiresAt - now) / 1000);
    console.log(`✅ Cache valid for folder ${folderId} (expires in ${timeLeft}s)`);
    return true;
  }

  // Load cached test runs
  static load(folderId: number): TestRunItem[] | null {
    if (!fs || !DATA_DIR) return null;
    
    if (!this.isCacheValid(folderId)) {
      return null;
    }
    
    const fileName = `folder-${folderId}.json`;
    const filePath = path.join(DATA_DIR, fileName);
    
    try {
      const startTime = Date.now();
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Loaded ${data.length} test runs from JSON cache in ${duration}ms`);
      return data;
    } catch (error) {
      console.error(`Error loading cache for folder ${folderId}:`, error);
      return null;
    }
  }

  // Save test runs to cache (async in background)
  static save(folderId: number, folderName: string, testRuns: TestRunItem[], cycleKeys: string[]): void {
    if (!fs || !DATA_DIR) return;
    
    this.ensureDirectory();
    
    const fileName = `folder-${folderId}.json`;
    const filePath = path.join(DATA_DIR, fileName);
    
    try {
      const startTime = Date.now();
      
      // Save test runs to JSON
      fs.writeFileSync(filePath, JSON.stringify(testRuns, null, 2), 'utf-8');
      
      // Update index
      const index = this.loadIndex();
      const now = Date.now();
      
      index.folders[folderId.toString()] = {
        lastSync: now,
        expiresAt: now + CACHE_DURATION,
        testCount: testRuns.length,
        cycleKeys,
        folderId,
        folderName,
      };
      
      this.saveIndex(index);
      
      const duration = Date.now() - startTime;
      console.log(`💾 Saved ${testRuns.length} test runs to JSON cache in ${duration}ms`);
    } catch (error) {
      console.error(`Error saving cache for folder ${folderId}:`, error);
    }
  }

  // Get cache info
  static getCacheInfo(folderId: number): CacheMetadata | null {
    const index = this.loadIndex();
    return index.folders[folderId.toString()] || null;
  }

  // Clear cache for a folder
  static clear(folderId: number): void {
    if (!fs || !DATA_DIR) return;
    
    const fileName = `folder-${folderId}.json`;
    const filePath = path.join(DATA_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    const index = this.loadIndex();
    delete index.folders[folderId.toString()];
    this.saveIndex(index);
    
    console.log(`🗑️ Cleared cache for folder ${folderId}`);
  }

  // Clear all cache
  static clearAll(): void {
    if (!fs || !DATA_DIR) return;
    
    const index = this.loadIndex();
    
    Object.keys(index.folders).forEach(folderId => {
      const fileName = `folder-${folderId}.json`;
      const filePath = path.join(DATA_DIR, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    this.saveIndex({ folders: {}, version: '1.0' });
    console.log('🗑️ Cleared all cache');
  }
}

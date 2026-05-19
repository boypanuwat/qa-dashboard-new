/**
 * Test Run Cache System - แยกไฟล์ตาม Folder
 * 
 * Structure:
 * data/testruns/
 * ├── folder-729.xlsx           # Test runs ของ folder 729
 * ├── folder-730.xlsx           # Test runs ของ folder 730
 * └── index.json                # Track cache metadata
 */

import * as XLSX from 'xlsx';
import { TestRunItem } from './types';
import { getUserName } from './user-mapping';

// Only import fs and path in Node.js environment
const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;

const DATA_DIR = typeof window === 'undefined' ? path?.join(process.cwd(), 'data', 'testruns') : null;
const INDEX_FILE = typeof window === 'undefined' ? path?.join(process.cwd(), 'data', 'testruns', 'index.json') : null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Index structure
interface CacheMetadata {
  lastSync: number;
  file: string;
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

// Flattened test run for Excel
interface TestRunFlat {
  // Test Run info
  runID: number;
  testRunKey: string;
  status: string;
  executionDate: Date | null;
  updatedDate: Date | null;
  executionTime: number;
  environment: string;
  buildNumber: string;
  comment: string;
  
  // Test Case info (denormalized)
  testCaseID: number;
  testCaseKey: string;
  testCaseTitle: string;
  testCaseDescription: string;
  testCasePriority: string;
  testCaseType: string;
  testCaseStatus: string;
  
  // Assignment info
  testRunItemID: number;
  assignedToID: string;
  assignedToName: string;
  executedByID: string;
  executedByName: string;
  assignmentDate: Date;
  
  // Folder context
  testCaseFolderID: number | null;
  testCaseFolderName: string;
  
  // Full JSON
  fullTestCase: string;
  fullTestRun: string;
}

export class TestRunCache {
  // Create data directory if not exists
  private static ensureDirectory(): void {
    if (!fs || !DATA_DIR) return;
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  // Load index file
  private static loadIndex(): TestRunCacheIndex {
    if (!fs || !INDEX_FILE) {
      return { folders: {}, version: '1.0' };
    }

    this.ensureDirectory();

    if (!fs.existsSync(INDEX_FILE)) {
      return { folders: {}, version: '1.0' };
    }

    try {
      const data = fs.readFileSync(INDEX_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading cache index:', error);
      return { folders: {}, version: '1.0' };
    }
  }

  // Save index file
  private static saveIndex(index: TestRunCacheIndex): void {
    if (!fs || !INDEX_FILE) return;

    this.ensureDirectory();

    try {
      fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving cache index:', error);
    }
  }

  // Get cache file path for folder
  private static getFolderCacheFile(folderId: number): string | null {
    if (!DATA_DIR) return null;
    return path?.join(DATA_DIR, `folder-${folderId}.xlsx`);
  }

  // Check if cache is valid
  static isCacheValid(folderId: number): boolean {
    const index = this.loadIndex();
    const cached = index.folders[folderId];

    if (!cached) return false;

    const now = Date.now();
    const age = now - cached.lastSync;

    return age < CACHE_DURATION;
  }

  // Load test runs from cache
  static load(folderId: number): TestRunItem[] | null {
    if (!fs) return null;

    const index = this.loadIndex();
    const cached = index.folders[folderId];

    if (!cached) {
      console.log(`❌ No cache found for folder ${folderId}`);
      return null;
    }

    const filePath = this.getFolderCacheFile(folderId);
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`❌ Cache file not found: ${filePath}`);
      return null;
    }

    try {
      const wb = XLSX.readFile(filePath);
      const ws = wb.Sheets['TestRuns'];
      const flatData = XLSX.utils.sheet_to_json(ws) as TestRunFlat[];

      // Group by testRunItemID and reconstruct TestRunItem[]
      const itemMap = new Map<number, TestRunItem>();

      flatData.forEach((row) => {
        if (!itemMap.has(row.testRunItemID)) {
          itemMap.set(row.testRunItemID, {
            ID: row.testRunItemID,
            testCase: JSON.parse(row.fullTestCase),
            assignedToID: row.assignedToID,
            assignmentDate: new Date(row.assignmentDate).getTime(),
            runs: [],
          });
        }

        const item = itemMap.get(row.testRunItemID)!;
        item.runs.push(JSON.parse(row.fullTestRun));
      });

      const testRunItems = Array.from(itemMap.values());
      console.log(`✅ Loaded ${testRunItems.length} test run items from cache (folder ${folderId})`);
      return testRunItems;
    } catch (error) {
      console.error('❌ Error loading test runs from cache:', error);
      return null;
    }
  }

  // Save test runs to cache
  static save(folderId: number, folderName: string, testRunItems: TestRunItem[]): void {
    if (!fs || !DATA_DIR) {
      console.log('⚠️ Cache only works in Node.js environment');
      return;
    }

    this.ensureDirectory();

    console.log(`💾 Saving ${testRunItems.length} test run items to cache (folder ${folderId})...`);

    // Convert to flat structure
    const flatData: TestRunFlat[] = [];
    const cycleKeys = new Set<string>();

    testRunItems.forEach((item) => {
      item.runs.forEach((run) => {
        flatData.push({
          // Test Run
          runID: run.ID,
          testRunKey: run.testRunKey,
          status: run.status,
          executionDate: run.executionDate ? new Date(run.executionDate) : null,
          updatedDate: run.updatedDate ? new Date(run.updatedDate) : null,
          executionTime: run.executionTime,
          environment: run.environment,
          buildNumber: run.buildNumber,
          comment: run.comment,
          
          // Test Case
          testCaseID: item.testCase.ID,
          testCaseKey: item.testCase.key,
          testCaseTitle: item.testCase.title,
          testCaseDescription: item.testCase.description,
          testCasePriority: item.testCase.priority?.name || '',
          testCaseType: (item.testCase as any).type?.name || '',
          testCaseStatus: item.testCase.status?.name || '',
          
          // Assignment
          testRunItemID: item.ID,
          assignedToID: item.assignedToID,
          assignedToName: getUserName(item.assignedToID),
          executedByID: run.executedByID,
          executedByName: getUserName(run.executedByID),
          assignmentDate: new Date(item.assignmentDate),
          
          // Folder
          testCaseFolderID: (item.testCase as any).folder?.ID || null,
          testCaseFolderName: (item.testCase as any).folder?.name || '',
          
          // Full data
          fullTestCase: JSON.stringify(item.testCase),
          fullTestRun: JSON.stringify(run),
        });

        // Track cycle keys (ถ้ามี)
        // cycleKeys.add(run.cycleKey);
      });
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Test Runs
    const ws = XLSX.utils.json_to_sheet(flatData);
    ws['!cols'] = [
      { wch: 10 }, // runID
      { wch: 18 }, // testRunKey
      { wch: 12 }, // status
      { wch: 12 }, // executionDate
      { wch: 12 }, // updatedDate
      { wch: 12 }, // executionTime
      { wch: 15 }, // environment
      { wch: 15 }, // buildNumber
      { wch: 30 }, // comment
      { wch: 10 }, // testCaseID
      { wch: 18 }, // testCaseKey
      { wch: 40 }, // testCaseTitle
      { wch: 30 }, // testCaseDescription
      { wch: 12 }, // testCasePriority
      { wch: 12 }, // testCaseType
      { wch: 12 }, // testCaseStatus
      { wch: 10 }, // testRunItemID
      { wch: 25 }, // assignedToID
      { wch: 20 }, // assignedToName
      { wch: 25 }, // executedByID
      { wch: 20 }, // executedByName
      { wch: 12 }, // assignmentDate
      { wch: 10 }, // testCaseFolderID
      { wch: 25 }, // testCaseFolderName
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'TestRuns');

    // Sheet 2: Metadata
    const metadata = [
      {
        folderId,
        folderName,
        lastSync: new Date(),
        totalRecords: flatData.length,
        totalTestCases: testRunItems.length,
        cacheDurationMinutes: 10,
        version: '1.0',
      },
    ];
    const wsMetadata = XLSX.utils.json_to_sheet(metadata);
    XLSX.utils.book_append_sheet(wb, wsMetadata, 'Metadata');

    // Save file
    const filePath = this.getFolderCacheFile(folderId);
    if (filePath) {
      XLSX.writeFile(wb, filePath);
      console.log(`✅ Saved to ${path?.basename(filePath)}`);
    }

    // Update index
    const index = this.loadIndex();
    index.folders[folderId] = {
      lastSync: Date.now(),
      file: `folder-${folderId}.xlsx`,
      testCount: testRunItems.length,
      cycleKeys: Array.from(cycleKeys),
      folderId,
      folderName,
    };
    this.saveIndex(index);
  }

  // Clear cache for specific folder
  static clearFolder(folderId: number): void {
    if (!fs) return;

    const filePath = this.getFolderCacheFile(folderId);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleared cache for folder ${folderId}`);
    }

    // Remove from index
    const index = this.loadIndex();
    delete index.folders[folderId];
    this.saveIndex(index);
  }

  // Clear all cache
  static clearAll(): void {
    if (!fs || !DATA_DIR) return;

    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      files.forEach((file: string) => {
        if (file.endsWith('.xlsx')) {
          fs.unlinkSync(path?.join(DATA_DIR, file));
        }
      });
      console.log('🗑️ Cleared all test run caches');
    }

    // Reset index
    this.saveIndex({ folders: {}, version: '1.0' });
  }

  // Clean up old cache (> 1 day)
  static cleanupOld(maxAgeHours: number = 24): void {
    if (!fs) return;

    const index = this.loadIndex();
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    let cleaned = 0;
    Object.entries(index.folders).forEach(([id, info]) => {
      if (now - info.lastSync > maxAge) {
        this.clearFolder(parseInt(id));
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old cache files`);
    }
  }

  // Get cache status
  static getStatus(): void {
    const index = this.loadIndex();
    const folders = Object.values(index.folders);

    console.log('\n📊 Test Runs Cache Status:');
    console.log('==========================');
    
    if (folders.length === 0) {
      console.log('No cached folders');
      return;
    }

    folders.forEach((info) => {
      const age = Date.now() - info.lastSync;
      const ageMinutes = Math.floor(age / (1000 * 60));
      const isValid = age < CACHE_DURATION;

      console.log(`\nFolder ${info.folderId}: ${info.folderName}`);
      console.log(`  File: ${info.file}`);
      console.log(`  Tests: ${info.testCount}`);
      console.log(`  Age: ${ageMinutes} min (${isValid ? '✅ Valid' : '❌ Expired'})`);
      console.log(`  Last Sync: ${new Date(info.lastSync).toLocaleString()}`);
    });

    console.log('\n');
  }
}

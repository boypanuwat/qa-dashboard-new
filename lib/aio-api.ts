import { TestCycle, TestRunItem, FolderWithStats } from "./types";
import {
  mockTestCycles,
  mockTestRuns,
  mockFoldersWithStats,
} from "./aio-mock-data";

// Test run cache - only available in server-side (Node.js)
let TestRunCache: any = null;

// Dynamically import test run cache only in Node.js environment
if (typeof window === 'undefined') {
  try {
    const testRunCacheModule = require('./testrun-cache');
    TestRunCache = testRunCacheModule.TestRunCache;
  } catch (error) {
    console.log('Test run cache not available');
  }
}

// In-memory cache for test runs by cycle (10 minutes TTL)
const testRunsCycleCache = new Map<string, { data: TestRunItem[]; timestamp: number }>();
const CYCLE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Toggle this to switch between mock and real API
const USE_MOCK_DATA = false;

// API Configuration - อ่านแบบ dynamic แทนการ cache
function getProjectID() {
  const projectId = process.env.NEXT_PUBLIC_AIO_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "NEXT_PUBLIC_AIO_PROJECT_ID is missing. Check your .env.local file and restart the server."
    );
  }
  return projectId;
}

// In-Memory Cache for ultra-fast access (2 minutes)
let memoryCachedCycles: TestCycle[] | null = null;
let memoryCacheTimestamp: number = 0;
const MEMORY_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Detect if running in Node.js (script) or Browser/Next.js
const isNodeScript = typeof window === 'undefined' && process.env.NODE_ENV !== 'production';

// Helper function to make API calls
// Uses Next.js proxy in browser, direct API in Node.js scripts
async function fetchAIO(endpoint: string) {
  const PROJECT_ID = getProjectID();

  // Node.js script mode: เรียก AIO API โดยตรง
  if (isNodeScript) {
    const API_URL = process.env.NEXT_PUBLIC_AIO_API_URL;
    const API_TOKEN = process.env.NEXT_PUBLIC_AIO_API_TOKEN;

    if (!API_URL || !API_TOKEN) {
      throw new Error(
        "NEXT_PUBLIC_AIO_API_URL and NEXT_PUBLIC_AIO_API_TOKEN are required for scripts"
      );
    }

    const fullUrl = `${API_URL}${endpoint}`;
    console.log("Fetching directly:", fullUrl);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          accept: "application/json",
          Authorization: `AioAuth ${API_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  // Browser/Next.js mode: ใช้ Next.js API proxy
  const url = `/api/aio${endpoint}`;
  console.log("Fetching via proxy:", url);

  try {
    const response = await fetch(url, {
      cache: "no-store", // Disable caching for fresh data
    });

    console.log("Proxy response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.status} ${response.statusText}\n${JSON.stringify(errorData)}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Transform AIO API response to our format
function transformTestCycles(items: any[]): TestCycle[] {
  return items.map((item) => ({
    ID: item.ID,
    key: item.key,
    title: item.title,
    objective: item.objective,
    folder: item.folder
      ? {
          ID: item.folder.ID,
          name: item.folder.name,
          description: item.folder.description,
          parentID: item.folder.parentID,
        }
      : null,
    ownedByID: item.ownedByID || '',
    closedByID: item.closedByID || null,
    startDate: item.startDate,
    endDate: item.endDate,
    createdDate: item.createdDate,
    updatedDate: item.updatedDate,
    isClosed: item.isClosed,
    isArchived: item.isArchived,
  }));
}

// Transform test runs from AIO API
function transformTestRuns(items: any[]): TestRunItem[] {
  return items.map((item) => ({
    ID: item.ID,
    testCase: {
      ID: item.testCase.ID,
      key: item.testCase.key,
      title: item.testCase.title,
      description: item.testCase.description || "",
      precondition: item.testCase.precondition || "",
      status: item.testCase.status || { name: "Ready", description: "" },
      priority: item.testCase.priority || { name: "Medium" },
    },
    assignedToID: item.assignedToID,
    assignmentDate: item.assignmentDate,
    runs: item.runs.map((run: any) => ({
      ID: run.ID,
      testRunKey: run.testRunKey || `RUN-${run.ID}`,
      testCaseID: run.testCaseID,
      status: run.testRunStatus?.name || "Not Run", // Extract status from testRunStatus.name
      executedByID: run.executedByID,
      executionDate: run.executionDate || run.createdDate,      updatedDate: run.updatedDate || run.createdDate,      executionTime: run.executionTime || run.effort || 0,
      environment: run.environment || "",
      buildNumber: run.buildNumber || "",
      comment: run.comment || "",
    })),
  }));
}

// Calculate statistics for folders (unused - kept for compatibility)
function calculateFolderStats(
  cycles: TestCycle[],
  allTestRuns: TestRunItem[]
): FolderWithStats[] {
  const folderMap = new Map<number, FolderWithStats>();

  cycles.forEach((cycle) => {
    if (!cycle.folder) return;

    const folderId = cycle.folder.ID;
    if (!folderMap.has(folderId)) {
      folderMap.set(folderId, {
        ID: cycle.folder.ID,
        name: cycle.folder.name,
        description: cycle.folder.description || '',
        parentID: cycle.folder.parentID,
        cyclesCount: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        notRun: 0,
      });
    }

    const folderStats = folderMap.get(folderId)!;
    folderStats.cyclesCount++;
  });

  // Calculate test stats for each folder
  folderMap.forEach((folderStats) => {
    const folderTestRuns = allTestRuns; // In real scenario, filter by cycle IDs

    folderTestRuns.forEach((testRun) => {
      const latestRun = testRun.runs[0];
      if (latestRun) {
        if (latestRun.status === "Passed") folderStats.passed++;
        else if (latestRun.status === "Failed") folderStats.failed++;
        else if (latestRun.status === "Blocked") folderStats.blocked++;
        else folderStats.notRun++;
      }
    });
  });

  return Array.from(folderMap.values());
}

// Helper function to fetch all test cycles with 3-tier caching
// Tier 1: Memory (2 min) - fastest
// Tier 2: Excel (10 min) - persistent
// Tier 3: API - slowest but most up-to-date
async function fetchAllTestCycles(): Promise<TestCycle[]> {
  const now = Date.now();

  // Tier 1: Check in-memory cache (fastest)
  if (memoryCachedCycles && (now - memoryCacheTimestamp) < MEMORY_CACHE_DURATION) {
    console.log("✅ Using in-memory cache (< 1ms)");
    return memoryCachedCycles;
  }

  // Tier 2: Fetch from AIO API
  console.log("📡 Fetching from AIO API...");
  let allCycles: TestCycle[] = [];
  let startAt = 0;
  const maxResults = 100;
  let hasMore = true;

  console.log("Fetching all test cycles with pagination...");
  
  const PROJECT_ID = getProjectID();
  
  while (hasMore) {
    const data = await fetchAIO(
      `/project/${PROJECT_ID}/testcycle?maxResults=${maxResults}&startAt=${startAt}`
    );
    const cycles = transformTestCycles(data.items);
    allCycles = allCycles.concat(cycles);
    
    console.log(`Fetched ${cycles.length} cycles (startAt: ${startAt}, total so far: ${allCycles.length})`);
    
    if (cycles.length < maxResults) {
      hasMore = false;
    } else {
      startAt += maxResults;
    }
  }

  console.log(`✅ Total cycles fetched: ${allCycles.length}`);
  
  // Save to in-memory cache
  memoryCachedCycles = allCycles;
  memoryCacheTimestamp = now;
  
  return allCycles;
}

export const aioApi = {
  // Get all test cycles (with 3-tier caching)
  async getTestCycles(): Promise<TestCycle[]> {
    if (USE_MOCK_DATA) {
      await delay(500);
      return mockTestCycles;
    }

    try {
      return await fetchAllTestCycles();
    } catch (error) {
      console.error("Error fetching test cycles:", error);
      throw error;
    }
  },

  // Get all folders with statistics
  async getFolders(): Promise<FolderWithStats[]> {
    if (USE_MOCK_DATA) {
      await delay(400);
      return mockFoldersWithStats;
    }

    try {
      // Use cached function to fetch all test cycles
      const allCycles = await fetchAllTestCycles();

      // Group cycles by folder and track latest createdDate
      const folderMap = new Map<number, FolderWithStats & { latestCreatedDate: number }>();
      
      allCycles.forEach((cycle) => {
        if (!cycle.folder) return;
        
        const folderId = cycle.folder.ID;
        // Use createdDate to find most recently created cycles
        const createdDate = cycle.createdDate || 0;
        
        if (!folderMap.has(folderId)) {
          folderMap.set(folderId, {
            ID: cycle.folder.ID,
            name: cycle.folder.name,
            description: cycle.folder.description || '',
            parentID: cycle.folder.parentID,
            cyclesCount: 0,
            passed: 0,
            failed: 0,
            blocked: 0,
            notRun: 0,
            latestCreatedDate: createdDate,
          });
        }
        
        const folder = folderMap.get(folderId)!;
        folder.cyclesCount++;
        
        // Track the latest created date in this folder
        if (createdDate > folder.latestCreatedDate) {
          folder.latestCreatedDate = createdDate;
        }
      });

      // Convert to array, sort by latest created date descending (newest first), and take top 100
      const allFolders = Array.from(folderMap.values());
      allFolders.sort((a, b) => b.latestCreatedDate - a.latestCreatedDate);
      
      console.log("Top 5 folders by latest created cycle:", allFolders.slice(0, 5).map(f => ({
        name: f.name,
        cyclesCount: f.cyclesCount,
        latestCreated: new Date(f.latestCreatedDate).toLocaleString()
      })));
      
      // Remove latestCreatedDate from result and return top 100
      return allFolders.slice(0, 100).map(({ latestCreatedDate, ...folder }) => folder);
    } catch (error) {
      console.error("Error fetching folders:", error);
      throw error;
    }
  },

  // Get test cycles by folder ID
  async getTestCyclesByFolder(folderID: number): Promise<TestCycle[]> {
    if (USE_MOCK_DATA) {
      await delay(500);
      return mockTestCycles.filter((c) => c.folder?.ID === folderID);
    }

    try {
      // Use cached function to fetch all test cycles
      const allCycles = await fetchAllTestCycles();
      return allCycles.filter((c) => c.folder?.ID === folderID);
    } catch (error) {
      console.error("Error fetching test cycles:", error);
      throw error;
    }
  },

  // Get test runs by cycle key (e.g., "SCRUM-CY-123")
  async getTestRunsByCycle(cycleKey: string): Promise<TestRunItem[]> {
    if (USE_MOCK_DATA) {
      await delay(600);
      return mockTestRuns;
    }

    // Check in-memory cache first
    const cached = testRunsCycleCache.get(cycleKey);
    if (cached && (Date.now() - cached.timestamp) < CYCLE_CACHE_TTL) {
      const remainingSeconds = Math.round((CYCLE_CACHE_TTL - (Date.now() - cached.timestamp)) / 1000);
      console.log(`✅ Cache hit for cycle ${cycleKey} (expires in ${remainingSeconds}s)`);
      return cached.data;
    }

    try {
      // Fetch all test runs with pagination
      let allTestRuns: TestRunItem[] = [];
      let startAt = 0;
      const maxResults = 100;
      let hasMore = true;

      const PROJECT_ID = getProjectID();

      while (hasMore) {
        const data = await fetchAIO(
          `/project/${PROJECT_ID}/testcycle/${cycleKey}/testrun?maxResults=${maxResults}&startAt=${startAt}`
        );
        const testRuns = transformTestRuns(data.items);
        allTestRuns = allTestRuns.concat(testRuns);
        
        if (testRuns.length < maxResults) {
          hasMore = false;
        } else {
          startAt += maxResults;
        }
      }

      // Store in cache
      testRunsCycleCache.set(cycleKey, {
        data: allTestRuns,
        timestamp: Date.now()
      });

      return allTestRuns;
    } catch (error) {
      console.error("Error fetching test runs:", error);
      throw error;
    }
  },

  // Get all test runs for all cycles in a folder (with cache)
  async getTestRunsByFolder(folderID: number): Promise<TestRunItem[]> {
    if (USE_MOCK_DATA) {
      await delay(800);
      return mockTestRuns;
    }

    try {
      // Check cache first (if in Node.js environment)
      if (TestRunCache && TestRunCache.isCacheValid(folderID)) {
        console.log(`✅ Using cached test runs for folder ${folderID}`);
        const cached = TestRunCache.load(folderID);
        if (cached) {
          return cached;
        }
      }

      // First, get all cycles in this folder
      const cycles = await this.getTestCyclesByFolder(folderID);
      
      if (cycles.length === 0) {
        return [];
      }

      // Get folder name for cache
      const folderName = cycles[0]?.folder?.name || `Folder ${folderID}`;

      // Then, fetch test runs for each cycle from API
      console.log(`📡 Fetching test runs for ${cycles.length} cycles in folder ${folderID} from API...`);
      const allTestRunsPromises = cycles.map((cycle) =>
        this.getTestRunsByCycle(cycle.key).catch((error) => {
          console.error(`Failed to load test runs for cycle ${cycle.key}:`, error);
          return []; // Return empty array if a cycle fails
        })
      );

      const allTestRunsArrays = await Promise.all(allTestRunsPromises);
      
      // Flatten and deduplicate test runs
      const allTestRuns = allTestRunsArrays.flat();
      
      // Deduplicate by test case ID (keep the one with most recent run)
      const testRunMap = new Map<number, TestRunItem>();
      allTestRuns.forEach((testRun) => {
        const existing = testRunMap.get(testRun.testCase.ID);
        if (!existing || 
            (testRun.runs[0]?.executionDate > (existing.runs[0]?.executionDate || 0))) {
          testRunMap.set(testRun.testCase.ID, testRun);
        }
      });

      const uniqueTestRuns = Array.from(testRunMap.values());
      console.log(`✅ Loaded ${uniqueTestRuns.length} unique test runs from ${allTestRuns.length} total runs`);
      
      // Save to cache
      if (TestRunCache) {
        TestRunCache.save(folderID, folderName, uniqueTestRuns);
      }
      
      return uniqueTestRuns;
    } catch (error) {
      console.error("Error fetching test runs by folder:", error);
      throw error;
    }
  },

  // Get all test cycles
  async getAllTestCycles(): Promise<TestCycle[]> {
    if (USE_MOCK_DATA) {
      await delay(400);
      return mockTestCycles;
    }

    try {
      // Use cached function to fetch all test cycles
      return await fetchAllTestCycles();
    } catch (error) {
      console.error("Error fetching test cycles:", error);
      throw error;
    }
  },

  // Clear the cache to force refresh data
  clearCache() {
    console.log("Clearing test cycles cache");
    memoryCachedCycles = null;
    memoryCacheTimestamp = 0;
  },
  
  // Clear test run cache for specific folder
  clearTestRunCache(folderId?: number) {
    if (TestRunCache) {
      if (folderId) {
        TestRunCache.clearFolder(folderId);
      } else {
        TestRunCache.clearAll();
      }
    }
  },
  
  // Get test run cache status
  getTestRunCacheStatus() {
    if (TestRunCache) {
      TestRunCache.getStatus();
    }
  },
};

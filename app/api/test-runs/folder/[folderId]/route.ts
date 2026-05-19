import { NextRequest, NextResponse } from 'next/server';
import { TestRunItem, TestCycle } from '@/lib/types';
import { TestRunJsonCache } from '@/lib/testrun-json-cache';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_AIO_API_URL;
const API_TOKEN = process.env.NEXT_PUBLIC_AIO_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_AIO_PROJECT_ID;

// Transform test runs from AIO API
function transformTestRuns(items: any[]): TestRunItem[] {
  return items.map((item) => ({
    ID: item.ID,
    testCase: {
      ID: item.testCase.ID,
      key: item.testCase.key,
      title: item.testCase.title,
      description: item.testCase.description || '',
      precondition: item.testCase.precondition || '',
      status: item.testCase.status || { name: 'Ready', description: '' },
      priority: item.testCase.priority || { name: 'Medium' },
    },
    assignedToID: item.assignedToID,
    assignmentDate: item.assignmentDate,
    runs: item.runs.map((run: any) => ({
      ID: run.ID,
      testRunKey: run.testRunKey || `RUN-${run.ID}`,
      testCaseID: run.testCaseID,
      status: run.testRunStatus?.name || 'Not Run',
      executedByID: run.executedByID,
      executionDate: run.executionDate || run.createdDate,
      updatedDate: run.updatedDate || run.createdDate,
      executionTime: run.executionTime || run.effort || 0,
      environment: run.environment || '',
      buildNumber: run.buildNumber || '',
      comment: run.comment || '',
    })),
  }));
}

// Fetch test runs from AIO API
async function fetchTestRunsFromAPI(cycleKey: string): Promise<TestRunItem[]> {
  let allTestRuns: TestRunItem[] = [];
  let startAt = 0;
  const maxResults = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${API_URL}/project/${PROJECT_ID}/testcycle/${cycleKey}/testrun?maxResults=${maxResults}&startAt=${startAt}`;
    
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        Authorization: `AioAuth ${API_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const testRuns = transformTestRuns(data.items);
    allTestRuns = allTestRuns.concat(testRuns);

    if (testRuns.length < maxResults) {
      hasMore = false;
    } else {
      startAt += maxResults;
    }
  }

  return allTestRuns;
}

// Fetch cycles by folder
async function fetchCyclesByFolder(folderId: number): Promise<TestCycle[]> {
  const url = `${API_URL}/project/${PROJECT_ID}/testcycle?maxResults=1000`;
  
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      Authorization: `AioAuth ${API_TOKEN}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  
  // Filter by folder and transform
  const cycles = data.items
    .filter((item: any) => item.folder?.ID === folderId)
    .map((item: any) => ({
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

  return cycles;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId: folderIdStr } = await context.params;
    const folderId = parseInt(folderIdStr, 10);

    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: 'Invalid folder ID' },
        { status: 400 }
      );
    }

    // Check if force refresh is requested
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') !== null;

    console.log(`\n📊 Request: Test runs for folder ${folderId} ${forceRefresh ? '(force refresh)' : ''}`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = TestRunJsonCache.load(folderId);
      if (cached) {
        const cacheInfo = TestRunJsonCache.getCacheInfo(folderId);
        console.log(`✅ Returning cached data (${cached.length} test runs)`);
        
        return NextResponse.json({
          data: cached,
          cached: true,
          cacheInfo,
        });
      }
    } else {
      console.log('🔄 Force refresh - bypassing cache');
    }

    // Cache miss - fetch from API
    console.log(`❌ Cache miss - fetching from API...`);
    const startTime = Date.now();

    // Fetch cycles for this folder
    const cycles = await fetchCyclesByFolder(folderId);
    console.log(`📦 Found ${cycles.length} cycles in folder ${folderId}`);

    if (cycles.length === 0) {
      return NextResponse.json({
        data: [],
        cached: false,
        message: 'No cycles found in this folder',
      });
    }

    // Fetch test runs for all cycles
    const folderName = cycles[0]?.folder?.name || `Folder ${folderId}`;
    const cycleKeys = cycles.map(c => c.key);
    
    console.log(`🔄 Fetching test runs for ${cycles.length} cycles...`);
    
    const allTestRunsPromises = cycles.map((cycle) =>
      fetchTestRunsFromAPI(cycle.key).catch((error) => {
        console.error(`Failed to fetch test runs for cycle ${cycle.key}:`, error);
        return [];
      })
    );

    const testRunsArrays = await Promise.all(allTestRunsPromises);
    const allTestRuns = testRunsArrays.flat();

    const duration = Date.now() - startTime;
    console.log(`✅ Fetched ${allTestRuns.length} test runs in ${duration}ms`);

    // Save to cache in background (non-blocking)
    setImmediate(() => {
      try {
        TestRunJsonCache.save(folderId, folderName, allTestRuns, cycleKeys);
        console.log(`💾 Background save completed for folder ${folderId}`);
      } catch (error) {
        console.error(`Error saving cache for folder ${folderId}:`, error);
      }
    });

    // Return data immediately
    return NextResponse.json({
      data: allTestRuns,
      cached: false,
      fetchTime: duration,
      folderName,
      cycleCount: cycles.length,
    });

  } catch (error) {
    console.error('Error in test runs API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch test runs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

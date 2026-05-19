import { NextRequest, NextResponse } from 'next/server';
import { TestRunItem } from '@/lib/types';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_AIO_API_URL;
const API_TOKEN = process.env.NEXT_PUBLIC_AIO_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_AIO_PROJECT_ID;

// In-memory cache with TTL (10 minutes)
const cache = new Map<string, { data: TestRunItem[]; expiresAt: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cycleKey: string }> }
) {
  try {
    const { cycleKey } = await context.params;

    if (!cycleKey) {
      return NextResponse.json(
        { error: 'Invalid cycle key' },
        { status: 400 }
      );
    }

    // Check if force refresh is requested
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') !== null;

    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cache.get(cycleKey);
      if (cached && cached.expiresAt > now) {
        const timeLeft = Math.round((cached.expiresAt - now) / 1000);
        console.log(`✅ Cache hit for cycle ${cycleKey} (expires in ${timeLeft}s)`);
        
        return NextResponse.json({
          data: cached.data,
          cached: true,
          cycleKey,
        });
      }
    }

    // Cache miss - fetch from API
    console.log(`📡 Fetching test runs for cycle ${cycleKey}...`);
    const startTime = Date.now();

    const testRuns = await fetchTestRunsFromAPI(cycleKey);

    const duration = Date.now() - startTime;
    console.log(`✅ Fetched ${testRuns.length} test runs for cycle ${cycleKey} in ${duration}ms`);

    // Save to cache
    cache.set(cycleKey, {
      data: testRuns,
      expiresAt: now + CACHE_DURATION,
    });

    // Return data
    return NextResponse.json({
      data: testRuns,
      cached: false,
      fetchTime: duration,
      cycleKey,
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

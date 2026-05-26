import { NextRequest, NextResponse } from 'next/server';
import { TestRunItem } from '@/lib/types';
import { apiRequireAuth } from '@/lib/auth-helpers';
import { getAIOCredentials, AIOCredentials } from '@/lib/aio-credentials';
import { mockTestRuns } from '@/lib/aio-mock-data';

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
async function fetchTestRunsFromAPI(
  cycleKey: string,
  credentials: AIOCredentials
): Promise<TestRunItem[]> {
  let allTestRuns: TestRunItem[] = [];
  let startAt = 0;
  const maxResults = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${credentials.apiUrl}/project/${credentials.projectId}/testcycle/${cycleKey}/testrun?maxResults=${maxResults}&startAt=${startAt}`;
    
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        Authorization: `AioAuth ${credentials.apiToken}`,
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
    // Require authentication
    const session = await apiRequireAuth();
    
    const { cycleKey } = await context.params;

    if (!cycleKey) {
      return NextResponse.json(
        { error: 'Invalid cycle key' },
        { status: 400 }
      );
    }

    // Try to get user-specific credentials FIRST
    let credentials: AIOCredentials | null = null;
    let usingMockData = false;
    
    try {
      credentials = await getAIOCredentials(session.user.email);
    } catch (error) {
      // If no credentials, return mock data (don't cache it)
      if (error instanceof Error && (error as any).code === 'NO_CREDENTIALS') {
        console.log(`ℹ️ User ${session.user.email} using mock data (credentials not configured)`);
        usingMockData = true;
      } else {
        throw error;
      }
    }
    
    // If using mock data, return immediately without caching
    if (usingMockData) {
      return NextResponse.json({
        data: mockTestRuns,
        cached: false,
        mock: true,
        cycleKey,
      });
    }

    // At this point, credentials must be valid (not null)
    if (!credentials) {
      return NextResponse.json({
        data: mockTestRuns,
        cached: false,
        mock: true,
        cycleKey,
      });
    }

    // Check if force refresh is requested
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') !== null;

    const now = Date.now();

    // Check cache only if we have credentials (not force refresh)
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

    const testRuns = await fetchTestRunsFromAPI(cycleKey, credentials);

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
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Handle missing credentials - return mock data instead of error
    if (error instanceof Error && (error as any).code === 'NO_CREDENTIALS') {
      console.log('ℹ️ Using mock data (credentials not configured)');
      
      const { cycleKey } = await context.params;
      return NextResponse.json({
        data: mockTestRuns,
        cached: false,
        mock: true,
        cycleKey,
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch test runs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

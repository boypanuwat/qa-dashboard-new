import { DashboardStats, TestExecution, ChartData } from "./types";
import { mockStats, mockExecutions, mockChartData } from "./mock-data";
import { aioApi } from "./aio-api";

// Helper to get last 14 days data from real test runs
async function getLast14DaysData() {
  try {
    console.log('📊 Dashboard: Fetching data for last 14 days...');
    
    // STEP 1: Get top 5 folders (same as Test Execution page)
    const allFolders = await aioApi.getFolders();
    console.log(`📊 Dashboard: Found ${allFolders.length} total folders`);
    
    // getFolders() already sorts by latestCreatedDate (newest first)
    // Just take the first 5 folders
    const top5Folders = allFolders.slice(0, 5);
    
    console.log(`📊 Dashboard: Using top 5 folders: ${top5Folders.map(f => f.name).join(', ')}`);

    if (top5Folders.length === 0) {
      console.log('⚠️ Dashboard: No folders found, using mock data');
      return null;
    }

    // STEP 2: Get cycles from these 5 folders
    console.log(`📊 Dashboard: Fetching cycles from 5 folders...`);
    const cyclesArrays = await Promise.all(
      top5Folders.map(folder => aioApi.getTestCyclesByFolder(folder.ID))
    );
    
    const allCycles = cyclesArrays.flat();
    console.log(`📊 Dashboard: Found ${allCycles.length} cycles from 5 folders`);

    if (allCycles.length === 0) {
      console.log('⚠️ Dashboard: No cycles found, using mock data');
      return null;
    }

    // STEP 3: Fetch test runs with progressive loading + in-memory cache
    console.log(`📊 Dashboard: Fetching test runs for ${allCycles.length} cycles (with cache)...`);
    
    const BATCH_SIZE = 6;
    const allTestRuns: Awaited<ReturnType<typeof aioApi.getTestRunsByCycle>>[] = [];
    let completedCount = 0;
    const startTime = Date.now();

    // Process in batches (progressive loading)
    for (let i = 0; i < allCycles.length; i += BATCH_SIZE) {
      const batch = allCycles.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(cycle => aioApi.getTestRunsByCycle(cycle.key))
      );
      
      allTestRuns.push(...batchResults);
      completedCount += batch.length;
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const progress = Math.round((completedCount / allCycles.length) * 100);
      console.log(`  ⏳ Progress: ${completedCount}/${allCycles.length} cycles (${progress}%) - ${elapsed}s`);
    }

    const totalTestRunItems = allTestRuns.reduce((sum, items) => sum + items.length, 0);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`📊 Dashboard: ✅ Fetched ${totalTestRunItems} test run items in ${totalTime}s`);

    // Flatten all runs - use updatedDate instead of executionDate
    const allRuns = allTestRuns
      .flat()
      .flatMap(item => item.runs.map((run: import('./types').TestRun) => ({
        testCase: item.testCase,
        run: run,
        assignedTo: item.assignedToID,
      })));

    // Debug: Check updated dates
    const runsWithDates = allRuns.filter(({ run }) => run.updatedDate);
    console.log(`📊 Dashboard: ${runsWithDates.length}/${allRuns.length} runs have updatedDate`);
    
    if (runsWithDates.length > 0) {
      const dates = runsWithDates.map(({ run }) => run.updatedDate).sort((a, b) => b - a);
      const mostRecent = new Date(dates[0]).toLocaleDateString('th-TH');
      const oldest = new Date(dates.at(-1) ?? dates[0]).toLocaleDateString('th-TH');
      console.log(`📊 Dashboard: Date range: ${oldest} to ${mostRecent}`);
    }

    // Filter to last 14 days only
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const filteredRuns = allRuns.filter(({ run }) => 
      run.updatedDate && run.updatedDate >= fourteenDaysAgo
    );
    
    console.log(`📊 Dashboard: Filtered to ${filteredRuns.length}/${allRuns.length} test runs from last 14 days`);
    
    if (filteredRuns.length > 0) {
      const dates = filteredRuns.map(({ run }) => run.updatedDate).sort((a, b) => b - a);
      const mostRecent = new Date(dates[0]).toLocaleDateString('th-TH');
      const oldest = new Date(dates.at(-1) ?? dates[0]).toLocaleDateString('th-TH');
      console.log(`📊 Dashboard: 14-day range: ${oldest} to ${mostRecent}`);
    }

    if (filteredRuns.length === 0) {
      console.log('⚠️ Dashboard: No test runs found in last 14 days, using mock data');
      return null;
    }

    return { cycles: allCycles, runs: filteredRuns };
  } catch (error) {
    console.error('❌ Dashboard: Error fetching data:', error);
    return null;
  }
}

// Format date range for display - last 14 days
function getDateRangeText(): string {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  
  const endDate = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const startDate = fourteenDaysAgo.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  
  return `${startDate} - ${endDate}`;
}

// API service for dashboard data
export const dashboardApi = {
  // Get dashboard statistics from real data
  async getStats(): Promise<DashboardStats & { dateRange?: string }> {
    const data = await getLast14DaysData();
    
    if (!data || data.runs.length === 0) {
      // Fallback to mock data if no real data
      return { ...mockStats, dateRange: getDateRangeText() };
    }

    const { runs } = data;
    
    // Count statuses
    const statusCounts = runs.reduce((acc, { run }) => {
      const status = run.status.toLowerCase();
      if (status === 'passed') acc.passed++;
      else if (status === 'failed') acc.failed++;
      else if (status === 'blocked') acc.blocked++;
      else acc.notRun++;
      return acc;
    }, { passed: 0, failed: 0, blocked: 0, notRun: 0 });

    const totalTestCases = runs.length;
    const passRate = totalTestCases > 0 
      ? Math.round((statusCounts.passed / totalTestCases) * 100) 
      : 0;

    return {
      totalTestCases,
      ...statusCounts,
      passRate,
      dateRange: getDateRangeText(),
    };
  },

  // Get recent test executions from real data
  async getRecentExecutions(): Promise<TestExecution[]> {
    const data = await getLast14DaysData();
    
    if (!data || data.runs.length === 0) {
      return mockExecutions;
    }

    const { runs } = data;
    
    // Sort by updatedDate (most recent first) and take top 10
    const sortedRuns = runs
      .toSorted((a, b) => (b.run.updatedDate || 0) - (a.run.updatedDate || 0))
      .slice(0, 10);

    const mapStatus = (status: string): TestExecution["status"] => {
      const normalizedStatus = status.toLowerCase();
      if (normalizedStatus === 'passed') return 'passed';
      if (normalizedStatus === 'failed') return 'failed';
      if (normalizedStatus === 'blocked') return 'blocked';
      return 'not_run';
    };

    // Map assignedToID to displayName using user-mapping.csv
    return sortedRuns.map(({ testCase, run, assignedTo }) => ({
      id: testCase.key,
      name: testCase.title,
      status: mapStatus(run.status),
      executedDate: new Date(run.updatedDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      duration: run.executionTime ? `${Math.round(run.executionTime / 1000)}s` : '-',
      assignee: assignedTo ?? 'Unassigned',
    }));
  },

  // Get chart data grouped by day for last 7 days (from 14 days data)
  async getChartData(): Promise<ChartData[]> {
    const data = await getLast14DaysData();
    
    if (!data || data.runs.length === 0) {
      return mockChartData;
    }

    const { runs } = data;
    
    // Group by day using updatedDate
    const dayGroups = new Map<string, { passed: number; failed: number; blocked: number }>();
    
    // Initialize all 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dayKey = date.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      });
      dayGroups.set(dayKey, { passed: 0, failed: 0, blocked: 0 });
    }
    
    // Count executions by day using updatedDate
    runs.forEach(({ run }) => {
      if (!run.updatedDate) return;
      
      const date = new Date(run.updatedDate);
      const dayKey = date.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const group = dayGroups.get(dayKey);
      if (group) {
        const status = run.status.toLowerCase();
        if (status === 'passed') group.passed++;
        else if (status === 'failed') group.failed++;
        else if (status === 'blocked') group.blocked++;
      }
    });

    return Array.from(dayGroups.entries()).map(([name, counts]) => ({
      name,
      ...counts,
    }));
  },
};

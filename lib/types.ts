// Type definitions for QA Dashboard

export interface TestExecution {
  id: string;
  name: string;
  status: "passed" | "failed" | "blocked" | "not_run";
  executedDate: string;
  duration: string;
  assignee: string;
}

export interface DashboardStats {
  totalTestCases: number;
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
  passRate: number;
  dateRange?: string; // Optional date range text (e.g., "1 มี.ค. 2569 - 7 มี.ค. 2569")
}

export interface ChartData {
  name: string;
  passed: number;
  failed: number;
  blocked: number;
}

// AIO Test Management API Types
export interface TestCycleFolder {
  ID: number;
  name: string;
  description: string | null;
  parentID: number | null;
}

export interface TestCycle {
  ID: number;
  key: string;
  title: string;
  objective: string | null;
  folder: TestCycleFolder | null;
  ownedByID: string;
  closedByID: string | null;
  startDate: number | null;
  endDate: number | null;
  createdDate: number;
  updatedDate: number | null;
  isClosed: boolean;
  isArchived: boolean;
}

export interface TestCase {
  ID: number;
  key: string;
  title: string;
  description: string;
  precondition: string;
  status: {
    name: string;
    description: string;
  };
  priority: {
    name: string;
  };
}

export interface TestRun {
  ID: number;
  testRunKey: string;
  testCaseID: number;
  status: string;
  executedByID: string;
  executionDate: number;
  updatedDate: number;
  executionTime: number;
  environment: string;
  buildNumber: string;
  comment: string;
}

export interface TestRunItem {
  ID: number;
  testCase: TestCase;
  assignedToID: string;
  assignmentDate: number;
  runs: TestRun[];
}

export interface FolderWithStats {
  ID: number;
  name: string;
  description: string;
  parentID: number | null;
  cyclesCount: number;
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
}

export interface TestCycleWithStats extends TestCycle {
  stats?: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    notRun: number;
  };
}

export interface TestCycleWithRuns extends TestCycleWithStats {
  testRuns: TestRunItem[];
}

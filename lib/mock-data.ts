import { DashboardStats, TestExecution, ChartData } from "./types";

// Mock statistics data
export const mockStats: DashboardStats = {
  totalTestCases: 250,
  passed: 180,
  failed: 45,
  blocked: 15,
  notRun: 10,
  passRate: 72,
};

// Mock test executions data
export const mockExecutions: TestExecution[] = [
  {
    id: "TC-001",
    name: "Login with valid credentials",
    status: "passed",
    executedDate: "2026-05-07 10:30",
    duration: "2m 15s",
    assignee: "John Doe",
  },
  {
    id: "TC-002",
    name: "Add item to cart",
    status: "passed",
    executedDate: "2026-05-07 10:45",
    duration: "1m 30s",
    assignee: "Jane Smith",
  },
  {
    id: "TC-003",
    name: "Checkout process",
    status: "failed",
    executedDate: "2026-05-07 11:00",
    duration: "3m 45s",
    assignee: "Bob Johnson",
  },
  {
    id: "TC-004",
    name: "Payment integration",
    status: "blocked",
    executedDate: "2026-05-07 11:15",
    duration: "0m 30s",
    assignee: "Alice Brown",
  },
  {
    id: "TC-005",
    name: "User profile update",
    status: "passed",
    executedDate: "2026-05-07 11:30",
    duration: "1m 45s",
    assignee: "John Doe",
  },
  {
    id: "TC-006",
    name: "Password reset flow",
    status: "failed",
    executedDate: "2026-05-07 11:45",
    duration: "2m 00s",
    assignee: "Jane Smith",
  },
  {
    id: "TC-007",
    name: "Search functionality",
    status: "passed",
    executedDate: "2026-05-07 12:00",
    duration: "1m 20s",
    assignee: "Bob Johnson",
  },
  {
    id: "TC-008",
    name: "Filter products",
    status: "passed",
    executedDate: "2026-05-07 12:15",
    duration: "1m 50s",
    assignee: "Alice Brown",
  },
];

// Mock chart data
export const mockChartData: ChartData[] = [
  { name: "Mon", passed: 35, failed: 8, blocked: 2 },
  { name: "Tue", passed: 42, failed: 6, blocked: 3 },
  { name: "Wed", passed: 38, failed: 10, blocked: 4 },
  { name: "Thu", passed: 30, failed: 12, blocked: 3 },
  { name: "Fri", passed: 35, failed: 9, blocked: 3 },
];

// Mock trend data for reports
export const mockTrendData = [
  { date: "Apr 8", passed: 32, failed: 10, blocked: 3, passRate: 71 },
  { date: "Apr 11", passed: 35, failed: 8, blocked: 2, passRate: 78 },
  { date: "Apr 14", passed: 38, failed: 9, blocked: 4, passRate: 75 },
  { date: "Apr 17", passed: 40, failed: 7, blocked: 3, passRate: 80 },
  { date: "Apr 20", passed: 36, failed: 11, blocked: 3, passRate: 72 },
  { date: "Apr 23", passed: 42, failed: 6, blocked: 2, passRate: 84 },
  { date: "Apr 26", passed: 38, failed: 8, blocked: 4, passRate: 76 },
  { date: "Apr 29", passed: 41, failed: 7, blocked: 2, passRate: 82 },
  { date: "May 2", passed: 39, failed: 9, blocked: 2, passRate: 78 },
  { date: "May 5", passed: 43, failed: 5, blocked: 2, passRate: 86 },
];

// Mock pie chart data
export const mockStatusDistribution = [
  { name: "Passed", value: 180, color: "#10b981" },
  { name: "Failed", value: 45, color: "#ef4444" },
  { name: "Blocked", value: 15, color: "#f59e0b" },
  { name: "Not Run", value: 10, color: "#6b7280" },
];

// Mock assignee performance data
export const mockAssigneePerformance = [
  { name: "John Doe", total: 65, passed: 52, failed: 10, blocked: 3, passRate: 80 },
  { name: "Jane Smith", total: 58, passed: 47, failed: 8, blocked: 3, passRate: 81 },
  { name: "Bob Johnson", total: 52, passed: 38, failed: 11, blocked: 3, passRate: 73 },
  { name: "Alice Brown", total: 48, passed: 35, failed: 10, blocked: 3, passRate: 73 },
];

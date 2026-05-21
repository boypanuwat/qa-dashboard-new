"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { aioApi } from "@/lib/aio-api";
import { TestCycleWithRuns, FolderWithStats } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

function PrintPageContent() {
  const searchParams = useSearchParams();
  const folderIdsParam = searchParams.get("folderIds");
  const cycleKeysParam = searchParams.get("cycleKeys");

  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [testCycles, setTestCycles] = useState<TestCycleWithRuns[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!folderIdsParam) return;

      try {
        const folderIds = folderIdsParam.split(',').map(id => parseInt(id));
        const cycleKeys = cycleKeysParam?.split(',') || [];
        
        const allFolders = await aioApi.getFolders();
        const selectedFolders = allFolders.filter((f) => folderIds.includes(f.ID));
        
        if (selectedFolders.length > 0) {
          setFolders(selectedFolders);
          
          // Load cycles for all selected folders
          const allCycles: any[] = [];
          for (const folder of selectedFolders) {
            const cycles = await aioApi.getTestCyclesByFolder(folder.ID);
            allCycles.push(...cycles);
          }
          
          // Load test runs for each cycle
          const cyclesWithRuns: TestCycleWithRuns[] = [];
          for (const cycle of allCycles) {
            // Skip if not in selected cycle keys
            if (cycleKeys.length > 0 && !cycleKeys.includes(cycle.key)) {
              continue;
            }
            
            const response = await fetch(`/api/test-runs/cycle/${cycle.key}`);
            if (response.ok) {
              const data = await response.json();
              const testRuns = data.data || [];
              
              // Calculate stats
              let passed = 0, failed = 0, blocked = 0, notRun = 0;
              testRuns.forEach((testRun: any) => {
                const latestRun = testRun.runs?.[0];
                if (latestRun) {
                  const status = latestRun.status?.toUpperCase() || "";
                  if (status === "PASS" || status === "PASSED") passed++;
                  else if (status === "FAIL" || status === "FAILED") failed++;
                  else if (status === "BLOCKED" || status === "BLOCK") blocked++;
                  else notRun++;
                } else {
                  notRun++;
                }
              });
              
              cyclesWithRuns.push({
                ...cycle,
                stats: { total: testRuns.length, passed, failed, blocked, notRun },
                testRuns,
              });
            }
          }
          
          setTestCycles(cyclesWithRuns);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [folderIdsParam, cycleKeysParam]);

  useEffect(() => {
    // Auto-print when data is loaded
    if (!loading && folders.length > 0 && testCycles.length > 0) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, folders, testCycles]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading report data...</div>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">No folders found</div>
      </div>
    );
  }

  // Calculate combined stats from all selected cycles
  const combinedStats = testCycles.reduce(
    (acc, cycle) => ({
      passed: acc.passed + (cycle.stats?.passed || 0),
      failed: acc.failed + (cycle.stats?.failed || 0),
      blocked: acc.blocked + (cycle.stats?.blocked || 0),
      notRun: acc.notRun + (cycle.stats?.notRun || 0),
    }),
    { passed: 0, failed: 0, blocked: 0, notRun: 0 }
  );

  const chartData = [
    { name: "Passed", value: combinedStats.passed, color: "#10b981" },
    { name: "Failed", value: combinedStats.failed, color: "#ef4444" },
    { name: "Blocked", value: combinedStats.blocked, color: "#f59e0b" },
    { name: "Not Run", value: combinedStats.notRun, color: "#6b7280" },
  ];

  const totalTests = combinedStats.passed + combinedStats.failed + combinedStats.blocked + combinedStats.notRun;

  return (
    <div className="print-report">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 20px;
            background: white;
          }
          .print-report {
            width: 100%;
            max-width: none;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
        
        @media screen {
          .print-report {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            background: white;
            min-height: 100vh;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Execution Report</h1>
        <p className="text-gray-600">
          Generated on {new Date().toLocaleString("th-TH")}
        </p>
      </div>

      {/* Folder Info */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Selected Folders</h2>
        <div className="space-y-2">
          {folders.map((folder) => (
            <div key={folder.ID} className="flex items-center gap-2">
              <span className="font-medium">{folder.name}</span>
              {folder.description && (
                <span className="text-sm text-gray-600">- {folder.description}</span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-4">
            <span className="font-medium">Test Projects:</span>
            <span>{testCycles.length}</span>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Summary</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalTests}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{combinedStats.passed}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{combinedStats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{combinedStats.blocked}</div>
            <div className="text-sm text-gray-600">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{combinedStats.notRun}</div>
            <div className="text-sm text-gray-600">Not Run</div>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Status Distribution</h2>
        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Test Runs Table - Grouped by Cycle */}
      <div className="page-break">
        <h2 className="text-xl font-semibold mb-4">Test Execution Details</h2>
        {testCycles.map((cycle, cycleIndex) => (
          <div key={cycle.ID} className={cycleIndex > 0 ? "mt-8" : ""}>
            {/* Cycle Header */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-blue-600">
                {cycle.key} - {cycle.title}
              </h3>
              <p className="text-sm text-gray-600">
                Total: {cycle.stats?.total || 0} | Passed: {cycle.stats?.passed || 0} | Failed: {cycle.stats?.failed || 0} | Blocked: {cycle.stats?.blocked || 0} | Not Run: {cycle.stats?.notRun || 0}
              </p>
            </div>

            {/* Cycle Test Runs Table */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 border-b">Test Case</th>
                    <th className="text-left p-3 border-b">Title</th>
                    <th className="text-left p-3 border-b">Priority</th>
                    <th className="text-left p-3 border-b">Status</th>
                    <th className="text-left p-3 border-b">Duration</th>
                    <th className="text-left p-3 border-b">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {cycle.testRuns.map((item) => {
                    const latestRun = item.runs[0];
                    const status = latestRun?.status || "Not Run";
                    
                    return (
                      <tr key={item.ID} className="border-b">
                        <td className="p-3">{item.testCase.key}</td>
                        <td className="p-3">{item.testCase.title}</td>
                        <td className="p-3">{item.testCase.priority.name}</td>
                        <td className="p-3">
                          <Badge
                            className={
                              status === "Passed"
                                ? "bg-green-100 text-green-800"
                                : status === "Failed"
                                ? "bg-red-100 text-red-800"
                                : status === "Blocked"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {latestRun?.executionTime
                            ? (() => {
                                const seconds = latestRun.executionTime;
                                if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
                                if (seconds < 60) return `${seconds.toFixed(1)}s`;
                                const minutes = Math.floor(seconds / 60);
                                const secs = Math.floor(seconds % 60);
                                return `${minutes}m ${secs}s`;
                              })()
                            : "-"}
                        </td>
                        <td className="p-3">{latestRun?.comment || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>End of Report - Total {totalTests} test cases across {testCycles.length} projects</p>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <PrintPageContent />
    </Suspense>
  );
}

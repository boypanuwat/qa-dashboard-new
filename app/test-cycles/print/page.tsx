"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { aioApi } from "@/lib/aio-api";
import { TestRunItem, FolderWithStats } from "@/lib/types";
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
  const folderId = searchParams.get("folderId");

  const [folder, setFolder] = useState<FolderWithStats | null>(null);
  const [testRuns, setTestRuns] = useState<TestRunItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!folderId) return;

      try {
        const folders = await aioApi.getFolders();
        const selectedFolder = folders.find((f) => f.ID === parseInt(folderId));
        
        if (selectedFolder) {
          setFolder(selectedFolder);
          const runs = await aioApi.getTestRunsByFolder(selectedFolder.ID);
          setTestRuns(runs);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [folderId]);

  useEffect(() => {
    // Auto-print when data is loaded
    if (!loading && folder && testRuns.length > 0) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, folder, testRuns]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading report data...</div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Folder not found</div>
      </div>
    );
  }

  const chartData = [
    { name: "Passed", value: folder.passed, color: "#10b981" },
    { name: "Failed", value: folder.failed, color: "#ef4444" },
    { name: "Blocked", value: folder.blocked, color: "#f59e0b" },
    { name: "Not Run", value: folder.notRun, color: "#6b7280" },
  ];

  const totalTests = folder.passed + folder.failed + folder.blocked + folder.notRun;

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
        <h2 className="text-xl font-semibold mb-4">Test Cycle Folder</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Folder:</span>
            <span>{folder.name}</span>
          </div>
          {folder.description && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Description:</span>
              <span>{folder.description}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium">Cycles Count:</span>
            <span>{folder.cyclesCount}</span>
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
            <div className="text-2xl font-bold text-green-600">{folder.passed}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{folder.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{folder.blocked}</div>
            <div className="text-sm text-gray-600">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{folder.notRun}</div>
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

      {/* Test Runs Table */}
      <div className="page-break">
        <h2 className="text-xl font-semibold mb-4">Test Execution Details</h2>
        <div className="border rounded-lg overflow-hidden">
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
              {testRuns.map((item) => {
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
                      {latestRun
                        ? `${Math.floor(latestRun.executionTime / 1000 / 60)}m ${Math.floor(
                            (latestRun.executionTime / 1000) % 60
                          )}s`
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

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>End of Report - Total {testRuns.length} test cases</p>
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

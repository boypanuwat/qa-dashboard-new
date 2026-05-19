"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestCycleWithRuns } from "@/lib/types";
import { CheckCircle2, XCircle, AlertCircle, MinusCircle, ChevronDown, ChevronRight } from "lucide-react";

interface TestRunsTableProps {
  testCycles: TestCycleWithRuns[];
}

const statusColors = {
  Passed: "bg-green-500/10 text-green-700 dark:text-green-400",
  Failed: "bg-red-500/10 text-red-700 dark:text-red-400",
  Blocked: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "Not Run": "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const priorityColors = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "-";
  
  // Handle very small durations (less than 1 second)
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  
  // Less than 1 minute - show in seconds
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  
  // 1 minute or more - show in minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}m ${secs}s`;
}

export function TestRunsTable({ testCycles }: Readonly<TestRunsTableProps>) {
  const totalTestRuns = testCycles.reduce((acc, cycle) => acc + cycle.testRuns.length, 0);
  
  // Track which cycles are expanded (default: all expanded)
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(
    new Set(testCycles.map(cycle => cycle.ID))
  );
  
  const toggleCycle = (cycleId: number) => {
    setExpandedCycles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cycleId)) {
        newSet.delete(cycleId);
      } else {
        newSet.add(cycleId);
      }
      return newSet;
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Execution Details</CardTitle>
      </CardHeader>
      <CardContent>
        {totalTestRuns === 0 ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            No test runs found.
          </div>
        ) : (
          <div className="space-y-3">
            {testCycles.map((cycle) => {
              const isExpanded = expandedCycles.has(cycle.ID);
              
              return (
                <div key={cycle.ID} className="space-y-3">
                  {/* Cycle Header */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted/70 transition-colors text-left"
                    onClick={() => toggleCycle(cycle.ID)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-6 w-6 flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-blue-600">
                            {cycle.key}
                          </span>
                          <span className="text-base font-semibold">
                            {cycle.title}
                          </span>
                          {cycle.isClosed && (
                            <Badge variant="secondary" className="text-xs">
                              Closed
                            </Badge>
                          )}
                        </div>
                        {cycle.objective && isExpanded && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {cycle.objective}
                          </p>
                        )}
                      </div>
                    </div>
                    {cycle.stats && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Total: <span className="font-semibold">{cycle.stats.total}</span>
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-semibold">{cycle.stats.passed}</span>
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="font-semibold">{cycle.stats.failed}</span>
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-semibold">{cycle.stats.blocked}</span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <MinusCircle className="h-4 w-4" />
                          <span className="font-semibold">{cycle.stats.notRun}</span>
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Test Runs Table for this cycle */}
                  {isExpanded && cycle.testRuns.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test Case</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Executed Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cycle.testRuns.map((item) => {
                          const latestRun = item.runs[0];
                          return (
                            <TableRow key={item.ID}>
                              <TableCell className="font-medium">
                                {item.testCase.key}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate" title={item.testCase.title}>
                                  {item.testCase.title}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={
                                    priorityColors[
                                      item.testCase.priority.name as keyof typeof priorityColors
                                    ]
                                  }
                                >
                                  {item.testCase.priority.name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={
                                    statusColors[
                                      latestRun?.status as keyof typeof statusColors
                                    ] || statusColors["Not Run"]
                                  }
                                >
                                  {latestRun?.status || "Not Run"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDuration(latestRun?.executionTime)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {latestRun ? formatDate(latestRun.updatedDate) : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

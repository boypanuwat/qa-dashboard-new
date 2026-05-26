"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { aioApi } from "@/lib/aio-api";
import { FolderWithStats, TestCycle, TestExecution, TestRunItem } from "@/lib/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TestExecutionChart } from "@/components/dashboard/test-execution-chart";
import { ExecutionTable } from "@/components/dashboard/execution-table";
import { useConfigStatus } from "@/hooks/use-config-status";
import { mockFoldersWithStats, mockTestRuns } from "@/lib/aio-mock-data";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Loader2,
  X,
  FolderOpen,
  Users,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Client-side user name lookup - just return userId as-is
const getUserName = (userId: string | null | undefined): string => {
  if (!userId) return "Unassigned";
  return userId;
};

type FlatRun = {
  testCaseKey: string;
  testCaseName: string;
  status: string;
  assignedToID: string;
  executedByID: string;
  updatedDate: number;
  executionTime: number;
};

const normalizeStatus = (
  status: string
): "passed" | "failed" | "blocked" | "not_run" => {
  const s = status.toLowerCase();
  if (s === "passed" || s === "pass") return "passed";
  if (s === "failed" || s === "fail") return "failed";
  if (s === "blocked" || s === "block") return "blocked";
  return "not_run";
};

// Extract flat runs from a TestRunItem (avoids deep nesting inside effects)
function flattenTestRunItem(item: TestRunItem): FlatRun[] {
  return item.runs.map((run) => ({
    testCaseKey: item.testCase.key,
    testCaseName: item.testCase.title,
    status: run.status,
    assignedToID: item.assignedToID,
    executedByID: run.executedByID,
    updatedDate: run.updatedDate,
    executionTime: run.executionTime,
  }));
}

// Fetch test runs for one cycle via the cached API route (same as Test Cycles page)
async function fetchCycleRuns(cycleKey: string): Promise<TestRunItem[]> {
  try {
    const res = await fetch(`/api/test-runs/cycle/${cycleKey}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: TestRunItem[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

// Stable keys for loading skeleton cards
const SKELETON_IDS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e"];

// Convert timestamp to "YYYY-MM-DD" format for date input
function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert "YYYY-MM-DD" to start-of-day timestamp
function toStartOfDay(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Convert "YYYY-MM-DD" to end-of-day timestamp
function toEndOfDay(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export default function DashboardPage() {
  const { status, isLoading: isLoadingConfig } = useConfigStatus();
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [allRuns, setAllRuns] = useState<FlatRun[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");

  // Capture "today" once on mount so useMemo chart stays stable across re-renders
  const [today] = useState<number>(() => Date.now());

  // Local cycle cache — avoids re-fetching when switching folders
  const cyclesCacheRef = useRef<Map<number, TestCycle[]>>(new Map());

  // --- Filter state ---
  const [testerFilter, setTesterFilter] = useState<string>("");
  const [dateStart, setDateStart] = useState<string>(() => 
    formatDate(today - 13 * 86400000) // 13 days ago
  );
  const [dateEnd, setDateEnd] = useState<string>(() => 
    formatDate(today) // today
  );

  const hasActiveFilter =
    testerFilter !== "" || dateStart !== "" || dateEnd !== "";

  // Load folders on mount - use mock data if no credentials
  useEffect(() => {
    // Wait for config check to complete
    if (isLoadingConfig) return;

    // If no config, use mock data directly without API call
    if (!status?.hasConfig) {
      console.log("ℹ️ No credentials configured, using mock folders");
      
      // Schedule state updates to avoid cascading renders
      queueMicrotask(() => {
        setFolders(mockFoldersWithStats);
        setLoadingFolders(false);
        
        // Auto-select latest folder (first one since mock is pre-sorted)
        if (mockFoldersWithStats.length > 0) {
          setSelectedFolderIds([mockFoldersWithStats[0].ID]);
        }
      });
      return;
    }

    // Has credentials - call API
    aioApi
      .getFolders()
      .then((data) => {
        setFolders(data);
        setLoadingFolders(false);
        
        // Auto-select latest folder (highest ID)
        if (data.length > 0) {
          const latestFolder = data.reduce((latest, folder) => 
            folder.ID > latest.ID ? folder : latest,
            data[0] // initial value
          );
          setSelectedFolderIds([latestFolder.ID]);
        }
      })
      .catch(() => setLoadingFolders(false));
  }, [status, isLoadingConfig]);

  // Listen for config updates and reload folders
  useEffect(() => {
    const handleConfigUpdate = () => {
      console.log('🔄 Config updated, clearing cache and reloading folders...');
      
      // Clear API cache
      aioApi.clearCache();
      
      setLoadingFolders(true);
      
      // Clear selected folders and runs
      setSelectedFolderIds([]);
      setAllRuns([]);
      
      // Reload folders based on new config
      aioApi.getFolders()
        .then((data) => {
          setFolders(data);
          setLoadingFolders(false);
          
          // Auto-select latest folder
          if (data.length > 0) {
            const latestFolder = data.reduce((latest, folder) => 
              folder.ID > latest.ID ? folder : latest,
              data[0]
            );
            setSelectedFolderIds([latestFolder.ID]);
          }
        })
        .catch(() => {
          setLoadingFolders(false);
        });
    };
    
    globalThis.window?.addEventListener('config-updated', handleConfigUpdate);
    
    return () => {
      globalThis.window?.removeEventListener('config-updated', handleConfigUpdate);
    };
  }, []);

  // Load test runs whenever selected folders change
  useEffect(() => {
    let cancelled = false;

    async function loadRuns() {
      if (selectedFolderIds.length === 0) {
        setAllRuns([]);
        setLoadingProgress("");
        setLoadingRuns(false);
        return;
      }

      // If no credentials, use mock data directly without API calls
      if (!status?.hasConfig) {
        setLoadingRuns(true);
        setLoadingProgress("กำลังโหลดข้อมูล...");
        
        // Simulate loading delay for UX consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!cancelled) {
          const flatRuns: FlatRun[] = [];
          mockTestRuns.forEach((item) => {
            flatRuns.push(...flattenTestRunItem(item));
          });
          
          setAllRuns(flatRuns);
          setLoadingProgress(`✅ โหลด ${mockTestRuns.length} test runs สำเร็จ`);
          setLoadingRuns(false);
        }
        return;
      }

      // Has credentials - call API
      setLoadingRuns(true);
      setLoadingProgress("กำลังโหลด cycles...");

      try {
        // Resolve cycles (use local cache when available)
        const allCycles: TestCycle[] = [];
        const toFetch: number[] = [];

        selectedFolderIds.forEach((id) => {
          const cached = cyclesCacheRef.current.get(id);
          if (cached) allCycles.push(...cached);
          else toFetch.push(id);
        });

        if (toFetch.length > 0) {
          const results = await Promise.all(
            toFetch.map((id) => aioApi.getTestCyclesByFolder(id))
          );
          toFetch.forEach((id, i) =>
            cyclesCacheRef.current.set(id, results[i])
          );
          allCycles.push(...results.flat());
        }

        if (cancelled) return;

        // Progressive batch loading (same pattern as Test Cycles page)
        const BATCH_SIZE = 6;
        const flatRuns: FlatRun[] = [];
        let done = 0;

        for (let i = 0; i < allCycles.length; i += BATCH_SIZE) {
          if (cancelled) return;

          const batch = allCycles.slice(i, i + BATCH_SIZE);
          const pct = Math.round((done / allCycles.length) * 100);
          setLoadingProgress(`⏳ ${done}/${allCycles.length} cycles (${pct}%)...`);

          const batchItems = await Promise.all(
            batch.map((cycle) => fetchCycleRuns(cycle.key))
          );

          batchItems.flat().forEach((item) => {
            flatRuns.push(...flattenTestRunItem(item));
          });

          done += batch.length;
          if (!cancelled) setAllRuns([...flatRuns]);
        }

        if (!cancelled)
          setLoadingProgress(`✅ โหลด ${allCycles.length} cycles สำเร็จ`);
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoadingProgress("❌ เกิดข้อผิดพลาด");
      } finally {
        if (!cancelled) setLoadingRuns(false);
      }
    }

    loadRuns();
    return () => {
      cancelled = true;
    };
  }, [selectedFolderIds, status]);

  // --- Available testers derived from loaded data ---
  const availableTesters = useMemo(() => {
    const seen = new Set<string>();
    const testers: { id: string; name: string }[] = [];
    allRuns.forEach((run) => {
      const id = run.executedByID;
      if (id && !seen.has(id)) {
        seen.add(id);
        testers.push({ id, name: getUserName(id) });
      }
    });
    return testers.sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [allRuns]);

  // --- Filtered runs: applies tester + date filters on top of allRuns ---
  const filteredRuns = useMemo(() => {
    let runs = allRuns;
    if (testerFilter) {
      runs = runs.filter((r) => r.executedByID === testerFilter);
    }
    if (dateStart) {
      const startTs = toStartOfDay(dateStart);
      runs = runs.filter((r) => r.updatedDate >= startTs);
    }
    if (dateEnd) {
      const endTs = toEndOfDay(dateEnd);
      runs = runs.filter((r) => r.updatedDate <= endTs);
    }
    return runs;
  }, [allRuns, testerFilter, dateStart, dateEnd]);

  // Stats: count by latest run per test case
  const stats = useMemo(() => {
    if (filteredRuns.length === 0) return null;

    const latestByCase = new Map<string, FlatRun>();
    filteredRuns.forEach((run) => {
      const ex = latestByCase.get(run.testCaseKey);
      if (!ex || run.updatedDate > ex.updatedDate) {
        latestByCase.set(run.testCaseKey, run);
      }
    });

    const latest = Array.from(latestByCase.values());
    let passed = 0,
      failed = 0,
      blocked = 0,
      notRun = 0;
    latest.forEach((r) => {
      const s = normalizeStatus(r.status);
      if (s === "passed") passed++;
      else if (s === "failed") failed++;
      else if (s === "blocked") blocked++;
      else notRun++;
    });

    const total = latest.length;
    return {
      total,
      passed,
      failed,
      blocked,
      notRun,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  }, [filteredRuns]);

  // Chart data: range adapts to date filter, otherwise last 14 days
  const chartData = useMemo(() => {
    const endTs = dateEnd ? toEndOfDay(dateEnd) : today;
    const startTs = dateStart
      ? toStartOfDay(dateStart)
      : endTs - 13 * 86400000;
    const dayCount = Math.min(
      Math.ceil((endTs - startTs) / 86400000) + 1,
      31
    );

    const dayGroups = new Map<
      string,
      { passed: number; failed: number; blocked: number }
    >();
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(endTs - i * 86400000);
      const key = date.toLocaleDateString("th-TH", {
        month: "short",
        day: "numeric",
      });
      dayGroups.set(key, { passed: 0, failed: 0, blocked: 0 });
    }

    filteredRuns.forEach((run) => {
      if (!run.updatedDate) return;
      const key = new Date(run.updatedDate).toLocaleDateString("th-TH", {
        month: "short",
        day: "numeric",
      });
      const group = dayGroups.get(key);
      if (!group) return;
      const s = normalizeStatus(run.status);
      if (s === "passed") group.passed++;
      else if (s === "failed") group.failed++;
      else if (s === "blocked") group.blocked++;
    });

    return Array.from(dayGroups.entries()).map(([name, counts]) => ({
      name,
      ...counts,
    }));
  }, [filteredRuns, dateStart, dateEnd, today]);

  // Recent executions: latest 10 sorted by updatedDate
  const recentExecutions = useMemo((): TestExecution[] => {
    return filteredRuns
      .filter((r) => r.updatedDate)
      .sort((a, b) => b.updatedDate - a.updatedDate)
      .slice(0, 10)
      .map(
        (r): TestExecution => ({
          id: r.testCaseKey,
          name: r.testCaseName,
          status: normalizeStatus(r.status),
          executedDate: new Date(r.updatedDate).toLocaleString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          duration: r.executionTime ? `${Math.round(r.executionTime)}s` : "-",
          assignee: getUserName(r.assignedToID),
        })
      );
  }, [filteredRuns]);

  const clearAllFilters = () => {
    setTesterFilter("");
    setDateStart("");
    setDateEnd("");
  };

  const addFolder = (folderIdStr: string) => {
    const id = Number.parseInt(folderIdStr, 10);
    if (!selectedFolderIds.includes(id)) {
      setSelectedFolderIds((prev) => [...prev, id]);
    }
  };

  const removeFolder = (id: number) => {
    setSelectedFolderIds((prev) => prev.filter((f) => f !== id));
  };

  const selectedFolders = folders.filter((f) =>
    selectedFolderIds.includes(f.ID)
  );
  const availableFolders = folders.filter(
    (f) => !selectedFolderIds.includes(f.ID)
  );
  const hasSelectedFolders = selectedFolderIds.length > 0;

  // Render stats cards section (extracted to avoid nested ternary)
  function renderStatsSection() {
    if (stats) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Test Cases"
            value={stats.total}
            description="Latest run per test case"
            icon={FileText}
          />
          <StatsCard
            title="Passed"
            value={stats.passed}
            description={
              stats.total > 0
                ? `${((stats.passed / stats.total) * 100).toFixed(1)}% of total`
                : "-"
            }
            icon={CheckCircle2}
          />
          <StatsCard
            title="Failed"
            value={stats.failed}
            description={
              stats.total > 0
                ? `${((stats.failed / stats.total) * 100).toFixed(1)}% of total`
                : "-"
            }
            icon={XCircle}
          />
          <StatsCard
            title="Blocked"
            value={stats.blocked}
            description={
              stats.total > 0
                ? `${((stats.blocked / stats.total) * 100).toFixed(1)}% of total`
                : "-"
            }
            icon={AlertCircle}
          />
          <StatsCard
            title="Pass Rate"
            value={`${stats.passRate}%`}
            description="Overall success rate"
            icon={TrendingUp}
          />
        </div>
      );
    }
    if (loadingRuns) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {SKELETON_IDS.map((id) => (
            <div
              key={id}
              className="h-28 rounded-lg border bg-muted animate-pulse"
            />
          ))}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground border rounded-lg border-dashed text-sm">
        ไม่มีข้อมูลที่ตรงกับ filter ที่เลือก
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          ภาพรวมผลการทดสอบและคุณภาพซอฟต์แวร์
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Sprint / Folder */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                Sprint / Folder
                {loadingFolders && (
                  <Loader2 className="h-3 w-3 animate-spin ml-1" />
                )}
              </label>
              {!loadingFolders && (
                <Select onValueChange={addFolder} value="">
                  <SelectTrigger className="h-9 w-[200px]">
                    <SelectValue placeholder="+ เพิ่ม folder" />
                  </SelectTrigger>
                  <SelectContent className="!max-h-[240px] max-w-[280px]" position="popper" sideOffset={4}>
                    {availableFolders.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        เลือกครบทุก folder แล้ว
                      </div>
                    ) : (
                      availableFolders.map((f) => (
                        <SelectItem key={f.ID} value={String(f.ID)}>
                          <span className="block truncate max-w-[230px] ">{f.name}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tester filter */}
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Tester
              </label>
              <Select
                value={testerFilter || "__all__"}
                onValueChange={(v) => setTesterFilter(v === "__all__" ? "" : v)}
                disabled={availableTesters.length === 0}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent className="!max-h-[240px] max-w-[280px]" position="popper" sideOffset={4}>
                  <SelectItem value="__all__">ทั้งหมด</SelectItem>
                  {availableTesters.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className={`h-9 w-[148px] rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark] ${dateStart ? "text-foreground" : "text-transparent"}`}
                  />
                  {!dateStart && (
                    <span className="absolute inset-0 flex items-center pl-3 pointer-events-none text-muted-foreground/60 text-sm">
                      เลือกวันที่
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground text-sm shrink-0">–</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateEnd}
                    min={dateStart}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className={`h-9 w-[148px] rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark] ${dateEnd ? "text-foreground" : "text-transparent"}`}
                  />
                  {!dateEnd && (
                    <span className="absolute inset-0 flex items-center pl-3 pointer-events-none text-muted-foreground/60 text-sm">
                      เลือกวันที่
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilter && (
              <button
                onClick={clearAllFilters}
                className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors self-end"
              >
                <X className="h-3.5 w-3.5" />
                ล้าง filter
              </button>
            )}

            {/* Loading progress */}
            {loadingProgress && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground self-end pb-2">
                {loadingRuns && <Loader2 className="h-3 w-3 animate-spin" />}
                {loadingProgress}
              </div>
            )}
          </div>

          {/* Selected folder badges */}
          {selectedFolders.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
              {selectedFolders.map((f) => (
                <Badge
                  key={f.ID}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {f.name}
                  <button
                    onClick={() => removeFolder(f.ID)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Active filter summary */}
          {hasActiveFilter && (
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-muted-foreground items-center">
              <SlidersHorizontal className="h-3 w-3" />
              Filter ที่ใช้งาน:
              {testerFilter && (
                <Badge variant="outline" className="text-xs h-5">
                  Tester: {getUserName(testerFilter)}
                </Badge>
              )}
              {dateStart && (
                <Badge variant="outline" className="text-xs h-5">
                  จาก: {new Date(dateStart).toLocaleDateString("th-TH")}
                </Badge>
              )}
              {dateEnd && (
                <Badge variant="outline" className="text-xs h-5">
                  ถึง: {new Date(dateEnd).toLocaleDateString("th-TH")}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty state — no folder selected */}
      {!hasSelectedFolders && (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground border rounded-lg border-dashed">
          <FolderOpen className="h-10 w-10 opacity-40" />
          <p className="text-sm">เลือก Sprint / Folder เพื่อดูข้อมูล Dashboard</p>
        </div>
      )}

      {/* Main content */}
      {hasSelectedFolders && (
        <>
          {/* Stats Cards */}
          {renderStatsSection()}

          {/* Chart */}
          <TestExecutionChart data={chartData} />

          {/* Recent executions table */}
          {recentExecutions.length > 0 && (
            <ExecutionTable executions={recentExecutions} />
          )}
        </>
      )}
    </div>
  );
}

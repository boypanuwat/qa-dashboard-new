"use client";

import { useState, useEffect, useRef } from "react";
import { aioApi } from "@/lib/aio-api";
import { FolderWithStats, TestCycleWithRuns } from "@/lib/types";
import { FolderSelector } from "@/components/test-cycles/folder-selector";
import { TestRunsTable } from "@/components/test-cycles/test-runs-table";
import { CustomPieChart } from "@/components/dashboard/pie-chart";
import { FileDown, FileText, Loader2, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTestRunsToExcel, exportTestRunsToPDF } from "@/lib/export-utils";

export default function TestCyclesPage() {
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [testCycles, setTestCycles] = useState<TestCycleWithRuns[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>("");
  
  // Use ref to track force refresh to avoid triggering useEffect twice
  const forceRefreshRef = useRef(false);
  
  // Cache cycles to avoid re-fetching on refresh
  const cyclesCacheRef = useRef<Map<number, any[]>>(new Map());

  // Load folders on mount
  useEffect(() => {
    async function loadFolders() {
      try {
        const data = await aioApi.getFolders();
        setFolders(data);
        // Don't auto-select any folder - let user choose
      } catch (error) {
        console.error("Error loading folders:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFolders();
  }, []);

  // Load test cycles and test runs when folders are selected
  useEffect(() => {
    async function loadData() {
      if (selectedFolderIds.length === 0) {
        setTestCycles([]);
        setCacheStatus("");
        return;
      }

      setLoadingCycles(true);
      setCacheStatus("Preparing...");
      
      // Capture forceRefresh flag and reset it immediately
      const shouldForceRefresh = forceRefreshRef.current;
      forceRefreshRef.current = false;
      
      try {
        // Get cycles from cache first, or fetch if not cached
        let allCycles: any[] = [];
        const cyclesToFetch: number[] = [];
        
        selectedFolderIds.forEach(folderId => {
          const cached = cyclesCacheRef.current.get(folderId);
          if (cached) {
            allCycles.push(...cached);
            console.log(`📦 Using cached cycles for folder ${folderId}`);
          } else {
            cyclesToFetch.push(folderId);
          }
        });
        
        // Fetch cycles that aren't cached
        if (cyclesToFetch.length > 0) {
          console.log(`🔄 Fetching cycles for ${cyclesToFetch.length} folders...`);
          const cyclesPromises = cyclesToFetch.map(folderId => 
            aioApi.getTestCyclesByFolder(folderId)
          );
          const cyclesArrays = await Promise.all(cyclesPromises);
          
          // Cache the results
          cyclesToFetch.forEach((folderId, index) => {
            cyclesCacheRef.current.set(folderId, cyclesArrays[index]);
          });
          
          allCycles.push(...cyclesArrays.flat());
        }

        console.log(`📦 Loading test runs for ${allCycles.length} cycles...`);
        
        // Progressive loading: Process in batches and update UI incrementally
        const BATCH_SIZE = 6;
        const testRunsByCycleKey = new Map<string, any[]>();
        let completedCount = 0;
        let cachedCount = 0;
        const startTime = Date.now();
        
        const fetchCycleTestRuns = async (cycle: typeof allCycles[0]) => {
          try {
            // Only add refresh param if force refresh was requested
            const refreshParam = shouldForceRefresh ? `?refresh=1` : '';
            const response = await fetch(`/api/test-runs/cycle/${cycle.key}${refreshParam}`);
            if (!response.ok) {
              console.error(`Failed to fetch test runs for cycle ${cycle.key}`);
              return { cycleKey: cycle.key, testRuns: [], cached: false };
            }
            
            const data = await response.json();
            return {
              cycleKey: cycle.key,
              testRuns: data.data || [],
              cached: data.cached || false,
            };
          } catch (error) {
            console.error(`Error fetching test runs for cycle ${cycle.key}:`, error);
            return { cycleKey: cycle.key, testRuns: [], cached: false };
          }
        };
        
        const calculateCycleStats = (cycle: typeof allCycles[0], runs: any[]) => {
          let passed = 0, failed = 0, blocked = 0, notRun = 0;
          
          runs.forEach((testRun) => {
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
          
          return {
            ...cycle,
            stats: { total: runs.length, passed, failed, blocked, notRun },
            testRuns: runs,
          };
        };
        
        // Process cycles in batches with progressive updates
        for (let i = 0; i < allCycles.length; i += BATCH_SIZE) {
          const batch = allCycles.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(allCycles.length / BATCH_SIZE);
          
          // Update progress
          setCacheStatus(`⏳ Loading batch ${batchNum}/${totalBatches}... (${completedCount}/${allCycles.length} cycles)`);
          
          // Fetch batch
          const batchResults = await Promise.all(batch.map(fetchCycleTestRuns));
          
          // Store results
          batchResults.forEach(({ cycleKey, testRuns, cached }) => {
            testRunsByCycleKey.set(cycleKey, testRuns);
            if (cached) cachedCount++;
          });
          
          completedCount += batch.length;
          
          // Calculate stats for all cycles loaded so far
          const cyclesWithRuns = allCycles.slice(0, completedCount).map((cycle) => {
            const runs = testRunsByCycleKey.get(cycle.key) || [];
            return calculateCycleStats(cycle, runs);
          });
          
          // Update UI with partial results (progressive loading!)
          setTestCycles(cyclesWithRuns);
          
          // Update progress status
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const percentage = Math.round((completedCount / allCycles.length) * 100);
          setCacheStatus(`⏳ Loading... ${completedCount}/${allCycles.length} cycles (${percentage}%) - ${elapsed}s`);
          
          console.log(`✅ Batch ${batchNum}/${totalBatches} completed (${completedCount}/${allCycles.length})`);
        }
        
        // Final update
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        if (cachedCount === allCycles.length) {
          setCacheStatus(`✅ Loaded from cache (~10ms)`);
        } else if (cachedCount > 0) {
          setCacheStatus(`⚡ ${cachedCount}/${allCycles.length} from cache, ${allCycles.length - cachedCount} from API (~${totalTime}s)`);
        } else {
          setCacheStatus(`📡 Fetched from API (~${totalTime}s)`);
        }
        
        // Calculate combined stats from cycle stats (not from testRuns to avoid double counting)
        const finalCyclesWithRuns = allCycles.map((cycle) => {
          const runs = testRunsByCycleKey.get(cycle.key) || [];
          return calculateCycleStats(cycle, runs);
        });
        
        // Sum up stats from all cycles
        let passed = 0, failed = 0, blocked = 0, notRun = 0;
        finalCyclesWithRuns.forEach(cycle => {
          passed += cycle.stats.passed;
          failed += cycle.stats.failed;
          blocked += cycle.stats.blocked;
          notRun += cycle.stats.notRun;
        });

        console.log(`📊 Final stats: passed=${passed}, failed=${failed}, blocked=${blocked}, notRun=${notRun}`);

        // Update folder stats
        setFolders((prevFolders) =>
          prevFolders.map((f) => {
            if (selectedFolderIds.includes(f.ID)) {
              return { ...f, passed, failed, blocked, notRun };
            }
            return f;
          })
        );
        
        setLoadingCycles(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setTestCycles([]);
        setCacheStatus("❌ Error loading data");
        setLoadingCycles(false);
      }
    }
    loadData();
  }, [selectedFolderIds]); // Only depend on selectedFolderIds, not forceRefresh

  const handleExportPDF = async () => {
    if (selectedFolderIds.length === 0 || testCycles.length === 0) return;

    console.log("Starting PDF export with screenshots...");
    setExportingPDF(true);
    try {
      // Use first selected folder for export (can be enhanced later)
      const firstFolder = folders.find((f) => f.ID === selectedFolderIds[0]);
      if (firstFolder) {
        await exportTestRunsToPDF(firstFolder, testCycles, {
          folderSelector: "folder-selector-card",
          chartContainer: "chart-container",
          summaryContainer: "summary-container",
        });
      }
      console.log("PDF export completed");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please check the console for details.");
    } finally {
      setExportingPDF(false);
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Forcing refresh from API...");
    if (!loadingCycles && selectedFolderIds.length > 0) {
      forceRefreshRef.current = true;
      // Trigger re-render by creating new array reference
      setSelectedFolderIds([...selectedFolderIds]);
    }
  };

  const handlePrintPreview = () => {
    if (selectedFolderIds.length === 0) return;
    const folderIdsParam = selectedFolderIds.join(',');
    window.open(`/test-cycles/print?folderIds=${folderIdsParam}`, "_blank");
  };

  const handleExportExcel = () => {
    if (selectedFolderIds.length === 0 || testCycles.length === 0) return;

    // Use first selected folder for export (can be enhanced later)
    const firstFolder = folders.find((f) => f.ID === selectedFolderIds[0]);
    if (firstFolder) {
      exportTestRunsToExcel(firstFolder, testCycles);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const selectedFolders = folders.filter((f) => selectedFolderIds.includes(f.ID));
  
  // Calculate combined stats from testCycles directly (avoid double counting)
  const combinedStats = testCycles.reduce(
    (acc, cycle) => ({
      passed: acc.passed + (cycle.stats?.passed || 0),
      failed: acc.failed + (cycle.stats?.failed || 0),
      blocked: acc.blocked + (cycle.stats?.blocked || 0),
      notRun: acc.notRun + (cycle.stats?.notRun || 0),
      cyclesCount: acc.cyclesCount + 1,
    }),
    { passed: 0, failed: 0, blocked: 0, notRun: 0, cyclesCount: 0 }
  );
  
  const chartData = selectedFolderIds.length > 0
    ? [
        { name: "Passed", value: combinedStats.passed, color: "#10b981" },
        { name: "Failed", value: combinedStats.failed, color: "#ef4444" },
        { name: "Blocked", value: combinedStats.blocked, color: "#f59e0b" },
        { name: "Not Run", value: combinedStats.notRun, color: "#6b7280" },
      ]
    : [];

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Test Execution Report</h2>
          <p className="text-muted-foreground">
            รายงานสรุปผลการทดสอบประจำ Sprint
          </p>
          {cacheStatus && selectedFolderIds.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {cacheStatus}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={selectedFolderIds.length === 0 || loadingCycles}
            title="Refresh data from API"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingCycles ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={selectedFolderIds.length === 0 || testCycles.length === 0 || exportingPDF}
          >
            {exportingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrintPreview}
            disabled={selectedFolderIds.length === 0 || testCycles.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Preview
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={selectedFolderIds.length === 0 || testCycles.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Folder Selector */}
      <div id="folder-selector-card">
        <FolderSelector
          folders={folders}
          selectedFolderIds={selectedFolderIds}
          testCycles={testCycles}
          loadingCycles={loadingCycles}
          onSelectFolders={setSelectedFolderIds}
        />
      </div>

      {selectedFolderIds.length > 0 && (
        <>
          {/* Status Distribution Chart */}
          <div className="grid gap-4 md:grid-cols-2">
            <div id="chart-container" className="space-y-4">
              <CustomPieChart  data={chartData} title="Test Status Distribution" />
            </div>

            {/* Summary Card */}
            <div id="summary-container" className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <div className="space-y-3">
                  {/* <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Selected:</span>
                    <span className="font-medium">{selectedFolderIds.length}</span>
                  </div> */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Test Projects:</span>
                    <span className="font-medium">{combinedStats.cyclesCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Tests:</span>
                    <span className="font-medium">
                      {combinedStats.passed + combinedStats.failed + combinedStats.blocked + combinedStats.notRun}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Executed:</span>
                    <span className="font-medium">
                      {combinedStats.passed + combinedStats.failed + combinedStats.blocked}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-muted-foreground">Pass Rate:</span>
                    <span className="text-xl font-bold text-green-600">
                      {(() => {
                        const totalTests = combinedStats.passed + combinedStats.failed + combinedStats.blocked + combinedStats.notRun;
                        return totalTests > 0
                          ? Math.round((combinedStats.passed / totalTests) * 100)
                          : 0;
                      })()}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Failed Rate:</span>
                    <span className="text-lg font-semibold text-red-600">
                      {(() => {
                        const totalTests = combinedStats.passed + combinedStats.failed + combinedStats.blocked + combinedStats.notRun;
                        return totalTests > 0
                          ? Math.round((combinedStats.failed / totalTests) * 100)
                          : 0;
                      })()}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Blocked Rate:</span>
                    <span className="text-lg font-semibold text-yellow-600">
                      {(() => {
                        const totalTests = combinedStats.passed + combinedStats.failed + combinedStats.blocked + combinedStats.notRun;
                        return totalTests > 0
                          ? Math.round((combinedStats.blocked / totalTests) * 100)
                          : 0;
                      })()}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Not Run Rate:</span>
                    <span className="text-lg font-semibold text-gray-600">
                      {(() => {
                        const totalTests = combinedStats.passed + combinedStats.failed + combinedStats.blocked + combinedStats.notRun;
                        return totalTests > 0
                          ? Math.round((combinedStats.notRun / totalTests) * 100)
                          : 0;
                      })()}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Runs Table */}
          {loadingCycles ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <TestRunsTable testCycles={testCycles} />
          )}
        </>
      )}
    </div>
  );
}

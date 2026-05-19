"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderWithStats, TestCycleWithStats } from "@/lib/types";
import { Folder, CheckCircle2, XCircle, AlertCircle, FolderOpen, MinusCircle, Loader2, Edit2, X } from "lucide-react";

interface FolderSelectorProps {
  folders: FolderWithStats[];
  selectedFolderIds: number[];
  testCycles: TestCycleWithStats[];
  loadingCycles: boolean;
  onSelectFolders: (folderIds: number[]) => void;
}

export function FolderSelector({
  folders,
  selectedFolderIds,
  testCycles,
  loadingCycles,
  onSelectFolders,
}: Readonly<FolderSelectorProps>) {
  // Temporary state for selection before applying
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedFolderIds);
  const [isEditingManual, setIsEditingManual] = useState<boolean | null>(null);
  const prevSelectedIdsRef = useRef<number[]>(selectedFolderIds);
  
  // Automatically determine if we should be in editing mode
  const isEditing = isEditingManual ?? (selectedFolderIds.length === 0);
  
  // Sync temp state when parent changes (e.g., initial load or after Apply)
  useEffect(() => {
    const prevSorted = [...prevSelectedIdsRef.current].sort((a, b) => a - b).join(',');
    const currentSorted = [...selectedFolderIds].sort((a, b) => a - b).join(',');
    
    if (prevSorted !== currentSorted) {
      setTempSelectedIds(selectedFolderIds);
      prevSelectedIdsRef.current = selectedFolderIds;
    }
  }, [selectedFolderIds]);
  
  const selectedFolders = folders.filter((f) => selectedFolderIds.includes(f.ID));
  
  // Combine stats from testCycles directly (avoid double counting)
  const combinedStats = testCycles.reduce(
    (acc, cycle) => ({
      passed: acc.passed + (cycle.stats?.passed || 0),
      failed: acc.failed + (cycle.stats?.failed || 0),
      blocked: acc.blocked + (cycle.stats?.blocked || 0),
      notRun: acc.notRun + (cycle.stats?.notRun || 0),
      totalExecutions: acc.totalExecutions + (cycle.stats?.total || 0),
    }),
    { passed: 0, failed: 0, blocked: 0, notRun: 0, totalExecutions: 0 }
  );
  
  const handleToggleFolder = (folderId: string) => {
    const id = parseInt(folderId, 10);
    if (tempSelectedIds.includes(id)) {
      setTempSelectedIds(tempSelectedIds.filter(existingId => existingId !== id));
    } else {
      setTempSelectedIds([...tempSelectedIds, id]);
    }
  };
  
  const handleRemoveFolder = (folderId: number) => {
    setTempSelectedIds(tempSelectedIds.filter(id => id !== folderId));
  };
  
  const handleApply = () => {
    onSelectFolders(tempSelectedIds);
    setIsEditingManual(false);
  };
  
  const handleEdit = () => {
    setTempSelectedIds(selectedFolderIds); // Reset temp to current selection
    setIsEditingManual(true);
  };
  
  const handleCancel = () => {
    setTempSelectedIds(selectedFolderIds); // Revert changes
    setIsEditingManual(false);
  };
  
  const hasChanges = (() => {
    const tempSorted = [...tempSelectedIds].sort((a, b) => a - b);
    const selectedSorted = [...selectedFolderIds].sort((a, b) => a - b);
    return JSON.stringify(tempSorted) !== JSON.stringify(selectedSorted);
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          รายงานสรุปผลการทดสอบประจำ Sprint
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Folder Selection with Dropdown */}
          <div className="space-y-3">
            {isEditing ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-[30%]">
                    <p className="text-sm font-medium mb-2">Select Sprints:</p>
                    <Select onValueChange={handleToggleFolder}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose folders..." />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map((folder) => (
                          <SelectItem key={folder.ID} value={folder.ID.toString()}>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4" />
                              <span>{folder.name}</span>
                              <span className="text-muted-foreground text-xs">
                                ({folder.cyclesCount} cycles)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 mt-7">
                    <Button 
                      onClick={handleApply}
                      disabled={!hasChanges || tempSelectedIds.length === 0}
                    >
                      Apply ({tempSelectedIds.length})
                    </Button>
                    {selectedFolderIds.length > 0 && (
                      <Button 
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Selected folders chips */}
                {tempSelectedIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                    {tempSelectedIds.map((folderId) => {
                      const folder = folders.find((f) => f.ID === folderId);
                      if (!folder) return null;
                      return (
                        <div
                          key={folderId}
                          className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          <Folder className="h-3 w-3" />
                          <span>{folder.name}</span>
                          <button
                            onClick={() => handleRemoveFolder(folderId)}
                            className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Selected Sprints:</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Change
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFolders.map((folder) => (
                    <div
                      key={folder.ID}
                      className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/30 text-sm"
                    >
                      <Folder className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{folder.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({folder.cyclesCount})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Summary Statistics - Horizontal Layout Below */}
          {selectedFolderIds.length > 0 && !loadingCycles && testCycles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Summary Statistics</p>
              <div className="grid grid-cols-5 gap-4">
                <div className="flex flex-col items-center gap-2 p-6 rounded-lg border bg-card">
                  <FolderOpen className="h-8 w-8 text-blue-600" />
                  <p className="text-xs text-muted-foreground font-medium">Total Executions</p>
                  <p className="text-4xl font-bold">{combinedStats.totalExecutions}</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-6 rounded-lg border bg-card">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Passed</p>
                  <p className="text-4xl font-bold text-green-600">{combinedStats.passed}</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-6 rounded-lg border bg-card">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <p className="text-xs text-red-600 font-medium">Failed</p>
                  <p className="text-4xl font-bold text-red-600">{combinedStats.failed}</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-6 rounded-lg border bg-card">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                  <p className="text-xs text-yellow-600 font-medium">Blocked</p>
                  <p className="text-4xl font-bold text-yellow-600">{combinedStats.blocked}</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-6 rounded-lg border bg-card">
                  <MinusCircle className="h-8 w-8 text-gray-600" />
                  <p className="text-xs text-gray-600 font-medium">Not Run</p>
                  <p className="text-4xl font-bold text-gray-600">{combinedStats.notRun}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Cycles List - Full Width Below */}
        {selectedFolderIds.length > 0 && (
          <div className="pt-4 mt-4 border-t">
            <p className="text-sm font-medium mb-3">Tested Projects:</p>
            {loadingCycles && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingCycles && testCycles.some(cycle => cycle.stats) && (
              <div className="space-y-3">
                {testCycles.filter(cycle => cycle.stats).map((cycle) => (
                  <div
                    key={cycle.ID}
                    className="text-sm p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{cycle.key}</span>
                      <span className="flex-1 font-medium">{cycle.title}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-medium">Total:</span> {cycle.stats!.total}
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {cycle.stats!.passed}
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          {cycle.stats!.failed}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          {cycle.stats!.blocked}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <MinusCircle className="h-4 w-4" />
                          {cycle.stats!.notRun}
                        </span>
                      </div>
                      {cycle.isClosed && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadingCycles && !testCycles.some(cycle => cycle.stats) && (
              <p className="text-sm text-muted-foreground py-4">No test cycles found in this folder.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

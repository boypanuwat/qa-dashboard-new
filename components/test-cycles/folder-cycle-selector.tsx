"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FolderWithStats, TestCycle } from "@/lib/types";
import { Folder, Loader2, ChevronDown, X, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FolderCycleSelectorProps {
  folders: FolderWithStats[];
  selectedFolderIds: number[];
  availableCycles: TestCycle[];
  selectedCycleKeys: string[];
  loadingCyclesList: boolean;
  loadingTestRuns: boolean;
  onSelectFolders: (folderIds: number[]) => void;
  onSelectCycles: (cycleKeys: string[]) => void;
  onApply: (cycleKeys: string[]) => void;
}

export function FolderCycleSelector({
  folders,
  selectedFolderIds,
  availableCycles,
  selectedCycleKeys,
  loadingCyclesList,
  loadingTestRuns,
  onSelectFolders,
  onSelectCycles,
  onApply,
}: Readonly<FolderCycleSelectorProps>) {
  const [tempSelectedCycleKeys, setTempSelectedCycleKeys] = useState<string[]>([]);
  const [folderPopoverOpen, setFolderPopoverOpen] = useState(false);
  const [cyclePopoverOpen, setCyclePopoverOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Use ref to track previous values and avoid cascading renders
  const prevAvailableCyclesLengthRef = useRef(0);
  const prevFolderIdsLengthRef = useRef(selectedFolderIds.length);

  // Initialize temp selection when available cycles change
  useEffect(() => {
    // Only auto-select when cycles first appear (length changes from 0 to >0)
    if (availableCycles.length > 0 && prevAvailableCyclesLengthRef.current === 0) {
      setTempSelectedCycleKeys(prev => {
        // Only auto-select if currently empty
        return prev.length === 0 ? availableCycles.map(c => c.key) : prev;
      });
    }
    prevAvailableCyclesLengthRef.current = availableCycles.length;
  }, [availableCycles]);

  // Reset collapsed state when folders change
  useEffect(() => {
    // Only reset when folders go from having items to empty
    if (selectedFolderIds.length === 0 && prevFolderIdsLengthRef.current > 0) {
      setIsCollapsed(false);
    }
    prevFolderIdsLengthRef.current = selectedFolderIds.length;
  }, [selectedFolderIds]);

  const handleToggleFolder = (folderId: number) => {
    if (selectedFolderIds.includes(folderId)) {
      onSelectFolders(selectedFolderIds.filter(existingId => existingId !== folderId));
    } else {
      onSelectFolders([...selectedFolderIds, folderId]);
    }
  };

  const handleToggleCycle = (cycleKey: string) => {
    if (tempSelectedCycleKeys.includes(cycleKey)) {
      setTempSelectedCycleKeys(tempSelectedCycleKeys.filter(k => k !== cycleKey));
    } else {
      setTempSelectedCycleKeys([...tempSelectedCycleKeys, cycleKey]);
    }
  };

  const handleSelectAllCycles = () => {
    setTempSelectedCycleKeys(availableCycles.map(c => c.key));
  };

  const handleDeselectAllCycles = () => {
    setTempSelectedCycleKeys([]);
  };

  const handleApply = () => {
    onSelectCycles(tempSelectedCycleKeys);
    setIsCollapsed(true);
    onApply(tempSelectedCycleKeys);
  };

  const handleEdit = () => {
    setIsCollapsed(false);
  };

  const selectedFolders = folders.filter(f => selectedFolderIds.includes(f.ID));
  const selectedCycles = availableCycles.filter(c => selectedCycleKeys.includes(c.key));

  return (
    <Card id="folder-selector-card">
      <CardHeader>
        <CardTitle>
          <Folder className="inline-block mr-2 h-5 w-5" />
          Select Sprints and Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Collapsed View - Show after Apply */}
        {isCollapsed && selectedCycleKeys.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected Sprints:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedFolders.map((folder) => (
                      <Badge key={folder.ID} variant="secondary" className="text-xs">
                        {folder.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Selected Projects:</div>
                  <div className="space-y-1 pl-2">
                    {selectedCycles.map((cycle) => (
                      <div key={cycle.key} className="text-sm text-muted-foreground">
                        {cycle.key} {cycle.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="ml-4"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        )}

        {/* Expanded View - Show before Apply or when editing */}
        {!isCollapsed && (
        <div className="space-y-4">
          {/* Folder and Cycle Selection - Side by Side with Apply Button */}
          <div className="flex gap-4 items-start">
            {/* Folder Selection - 30% width */}
            <div className="w-[30%] space-y-3">
              <div className="text-sm font-medium">1. Select Folders</div>
              <Popover open={folderPopoverOpen} onOpenChange={setFolderPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedFolderIds.length === 0 ? (
                      <span className="text-muted-foreground">Select folders...</span>
                    ) : (
                      <span>{selectedFolderIds.length} folder(s) selected</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {folders.map((folder) => (
                      <label
                        key={folder.ID}
                        className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedFolderIds.includes(folder.ID)}
                          onCheckedChange={(checked) => {
                            handleToggleFolder(folder.ID);
                          }}
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{folder.name}</div>
                          {folder.description && (
                            <div className="text-xs text-muted-foreground">
                              {folder.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Selected Folders Display */}
              {selectedFolderIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFolders.map((folder) => (
                    <Badge
                      key={folder.ID}
                      variant="secondary"
                      className="gap-1 text-xs"
                    >
                      {folder.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleFolder(folder.ID);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cycle Selection - 30% width */}
            {selectedFolderIds.length > 0 && (
              <div className="w-[30%] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    2. Select Test Projects
                    {loadingCyclesList && (
                      <span className="ml-2 text-muted-foreground">
                        <Loader2 className="inline h-4 w-4 animate-spin" />
                      </span>
                    )}
                  </div>
                </div>

                {loadingCyclesList && (
                  <div className="flex h-24 items-center justify-center border rounded-lg bg-muted/30">
                    <div className="text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  </div>
                )}
                
                {!loadingCyclesList && availableCycles.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg bg-muted/30">
                    No test projects found
                  </div>
                )}
                
                {!loadingCyclesList && availableCycles.length > 0 && (
                  <>
                    <Popover open={cyclePopoverOpen} onOpenChange={setCyclePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {tempSelectedCycleKeys.length === 0 ? (
                            <span className="text-muted-foreground">Select projects...</span>
                          ) : (
                            <span>{tempSelectedCycleKeys.length} selected</span>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        {/* Action buttons */}
                        <div className="flex gap-2 p-2 border-b">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectAllCycles();
                            }}
                            className="flex-1"
                          >
                            Select All
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeselectAllCycles();
                            }}
                            className="flex-1"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto p-2">
                          {availableCycles.map((cycle) => (
                            <label
                              key={cycle.key}
                              className="flex items-start gap-2 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={tempSelectedCycleKeys.includes(cycle.key)}
                                onCheckedChange={() => handleToggleCycle(cycle.key)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 text-sm">
                                <div className="font-medium">{cycle.key}</div>
                                {cycle.title && (
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {cycle.title}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Selected Cycles Display */}
                    {tempSelectedCycleKeys.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {availableCycles
                          .filter(c => tempSelectedCycleKeys.includes(c.key))
                          .slice(0, 3)
                          .map((cycle) => (
                            <Badge
                              key={cycle.key}
                              variant="secondary"
                              className="gap-1 text-xs"
                            >
                              {cycle.key}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleToggleCycle(cycle.key);
                                }}
                              />
                            </Badge>
                          ))}
                        {tempSelectedCycleKeys.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tempSelectedCycleKeys.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Apply Button - Right side */}
            {selectedFolderIds.length > 0 && availableCycles.length > 0 && !loadingCyclesList && (
              <div className="flex-1 flex items-start justify-end">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleApply();
                  }}
                  disabled={tempSelectedCycleKeys.length === 0 || loadingTestRuns}
                  size="lg"
                >
                  {loadingTestRuns ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Apply ({tempSelectedCycleKeys.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

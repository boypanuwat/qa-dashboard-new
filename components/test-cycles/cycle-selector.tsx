"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TestCycleWithRuns } from "@/lib/types";
import { CheckCircle2, XCircle, AlertCircle, MinusCircle, Edit2, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CycleSelectorProps {
  testCycles: TestCycleWithRuns[];
  selectedCycleKeys: string[];
  onSelectCycles: (cycleKeys: string[]) => void;
  onApply: () => void;
  loadingCycles: boolean;
  loadingTestRuns?: boolean;
}

export function CycleSelector({
  testCycles,
  selectedCycleKeys,
  onSelectCycles,
  onApply,
  loadingCycles,
  loadingTestRuns = false,
}: Readonly<CycleSelectorProps>) {
  const [tempSelectedKeys, setTempSelectedKeys] = useState<string[]>(selectedCycleKeys);
  const [isEditing, setIsEditing] = useState(selectedCycleKeys.length === 0);

  // Sync temp state when parent changes
  useEffect(() => {
    setTempSelectedKeys(selectedCycleKeys);
  }, [selectedCycleKeys]);

  const handleToggleCycle = (cycleKey: string) => {
    if (tempSelectedKeys.includes(cycleKey)) {
      setTempSelectedKeys(tempSelectedKeys.filter(k => k !== cycleKey));
    } else {
      setTempSelectedKeys([...tempSelectedKeys, cycleKey]);
    }
  };

  const handleSelectAll = () => {
    setTempSelectedKeys(testCycles.map(c => c.key));
  };

  const handleDeselectAll = () => {
    setTempSelectedKeys([]);
  };

  const handleApply = () => {
    onSelectCycles(tempSelectedKeys);
    setIsEditing(false);
    // Trigger data loading
    onApply();
  };

  const handleEdit = () => {
    setTempSelectedKeys(selectedCycleKeys);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempSelectedKeys(selectedCycleKeys);
    setIsEditing(false);
  };

  const hasChanges = JSON.stringify([...tempSelectedKeys].sort()) !== JSON.stringify([...selectedCycleKeys].sort());

  if (testCycles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Test Projects</CardTitle>
          {!isEditing && selectedCycleKeys.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleEdit} disabled={loadingCycles}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Selection
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All ({testCycles.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testCycles.map((cycle) => (
                <div
                  key={cycle.key}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={cycle.key}
                    checked={tempSelectedKeys.includes(cycle.key)}
                    onCheckedChange={() => handleToggleCycle(cycle.key)}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={cycle.key}
                      className="text-sm font-medium cursor-pointer block"
                    >
                      {cycle.key} - {cycle.title}
                    </label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                        {cycle.stats?.passed || 0}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <XCircle className="mr-1 h-3 w-3 text-red-500" />
                        {cycle.stats?.failed || 0}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <AlertCircle className="mr-1 h-3 w-3 text-yellow-500" />
                        {cycle.stats?.blocked || 0}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <MinusCircle className="mr-1 h-3 w-3 text-gray-500" />
                        {cycle.stats?.notRun || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button 
                onClick={handleApply} 
                disabled={!hasChanges || tempSelectedKeys.length === 0 || loadingTestRuns}
              >
                {loadingTestRuns ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Apply (${tempSelectedKeys.length} selected)`
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loadingTestRuns}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {selectedCycleKeys.length} of {testCycles.length} test projects selected
            </p>
            {selectedCycleKeys.length > 0 && selectedCycleKeys.length < 10 && (
              <div className="flex flex-wrap gap-2">
                {testCycles
                  .filter(c => selectedCycleKeys.includes(c.key))
                  .map(cycle => (
                    <Badge key={cycle.key} variant="secondary">
                      {cycle.key}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

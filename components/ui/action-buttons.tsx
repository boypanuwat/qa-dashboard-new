import { Button } from "@/components/ui/button";
import { FileDown, FileText, Loader2, RefreshCw } from "lucide-react";

// ========================================
// Export Excel Button
// ========================================
interface ExportExcelButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly size?: "default" | "sm" | "lg" | "icon";
}

export function ExportExcelButton({ 
  onClick, 
  disabled = false,
  size = "default"
}: ExportExcelButtonProps) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick} 
      disabled={disabled}
      size={size}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Export Excel
    </Button>
  );
}

// ========================================
// Export PDF Button
// ========================================
interface ExportPDFButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly size?: "default" | "sm" | "lg" | "icon";
}

export function ExportPDFButton({ 
  onClick, 
  disabled = false,
  loading = false,
  size = "default"
}: ExportPDFButtonProps) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick} 
      disabled={disabled || loading}
      size={size}
    >
      {loading ? (
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
  );
}

// ========================================
// Refresh Button
// ========================================
interface RefreshButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly size?: "default" | "sm" | "lg" | "icon";
  readonly title?: string;
}

export function RefreshButton({ 
  onClick, 
  disabled = false,
  loading = false,
  size = "default",
  title = "Refresh data from API"
}: RefreshButtonProps) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick} 
      disabled={disabled}
      size={size}
      title={title}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );
}

// ========================================
// Action Button Group
// ========================================
interface ActionButtonGroupProps {
  readonly children: React.ReactNode;
  readonly align?: "start" | "end" | "center";
}

export function ActionButtonGroup({ 
  children,
  align = "end"
}: ActionButtonGroupProps) {
  const alignmentClass = {
    start: "justify-start",
    end: "justify-end", 
    center: "justify-center"
  }[align];

  return (
    <div className={`flex flex-wrap gap-2 ${alignmentClass}`}>
      {children}
    </div>
  );
}

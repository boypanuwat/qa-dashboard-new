import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { domToPng } from "modern-screenshot";
import * as XLSX from "xlsx";
import { FolderWithStats, TestCycleWithRuns } from "./types";
import { sarabunFontBase64 } from "./sarabun-font";

// Add Sarabun font to jsPDF
function addSarabunFont(doc: jsPDF) {
  try {
    doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFontBase64);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "bold");
    doc.setFont("Sarabun");
    console.log("Sarabun Thai font loaded successfully");
  } catch (error) {
    console.error("Error loading Sarabun font:", error);
  }
}

// Export PDF with screenshots using modern-screenshot
export async function exportTestRunsToPDF(
  folder: FolderWithStats,
  testCycles: TestCycleWithRuns[],
  elementIds: {
    folderSelector: string;
    chartContainer: string;
    summaryContainer: string;
  }
): Promise<void> {
  console.log("Starting PDF export with screenshots...");
  console.log("Element IDs:", elementIds);

  const doc = new jsPDF();
  
  // Load Thai font
  addSarabunFont(doc);
  
  let currentY = 20;

  // Add title
  doc.setFontSize(20);
  doc.text("Test Execution Report", 14, currentY);
  
  // Add date (right-aligned at top)
  doc.setFontSize(10);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(`Generated: ${new Date().toLocaleString("th-TH")}`, pageWidth - 14, currentY, { align: 'right' });
  
  currentY += 5;

  // Monitor fetch requests during capture
  const fetchMonitor: { url: string; timestamp: number }[] = [];
  const originalFetch = window.fetch;
  
  // Override fetch globally to monitor and block chrome-extension
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    
    // Log all fetch attempts
    fetchMonitor.push({ url, timestamp: Date.now() });
    
    if (url.includes('chrome-extension://')) {
      console.log('🚫 BLOCKED chrome-extension fetch:', url);
      // Return mock successful response
      return Promise.resolve(new Response('', { 
        status: 200, 
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'text/css' })
      }));
    }
    
    console.log('✅ ALLOWED fetch:', url);
    return originalFetch.call(window, input, init);
  };

  // Helper function to capture element by cloning (isolated from Chrome extensions)
  const captureElementClean = async (elementId: string): Promise<string> => {
    console.log(`📸 Starting capture of: ${elementId}`);
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element ${elementId} not found`);
    }

    // Create isolated container outside viewport
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${element.offsetWidth}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '0';
    container.style.margin = '0';
    
    // Clone element (deep clone without Chrome extension injections)
    const clone = element.cloneNode(true) as HTMLElement;
    console.log(`  ✓ Cloned element (${clone.childElementCount} children)`);
    
    // Remove any chrome-extension links/styles from clone
    const chromeLinks = clone.querySelectorAll('link[href*="chrome-extension://"]');
    const chromeStyles = Array.from(clone.querySelectorAll('style')).filter(
      style => style.textContent?.includes('chrome-extension://')
    );
    
    if (chromeLinks.length > 0 || chromeStyles.length > 0) {
      console.log(`  🗑️ Removing ${chromeLinks.length} chrome links, ${chromeStyles.length} chrome styles from clone`);
      [...chromeLinks, ...chromeStyles].forEach(el => el.remove());
    }
    
    // Clean computed styles that reference chrome-extension
    let cleanedCount = 0;
    const cleanChromeExtensionStyles = (el: HTMLElement) => {
      const computed = window.getComputedStyle(el);
      
      // Check and clean font-family
      const fontFamily = computed.fontFamily;
      if (fontFamily && fontFamily.includes('chrome-extension')) {
        el.style.fontFamily = 'inherit';
        cleanedCount++;
      }
      
      // Check and clean background-image
      const bgImage = computed.backgroundImage;
      if (bgImage && bgImage.includes('chrome-extension')) {
        el.style.backgroundImage = 'none';
        cleanedCount++;
      }
      
      // Recursively clean children
      Array.from(el.children).forEach(child => {
        if (child instanceof HTMLElement) {
          cleanChromeExtensionStyles(child);
        }
      });
    };
    
    cleanChromeExtensionStyles(clone);
    if (cleanedCount > 0) {
      console.log(`  🧹 Cleaned ${cleanedCount} chrome-extension styles`);
    }
    
    container.appendChild(clone);
    document.body.appendChild(container);
    
    // Wait a bit for clone to settle
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      console.log(`  📷 Calling domToPng...`);
      const startFetchCount = fetchMonitor.length;
      
      // Capture the isolated clone - skip fonts to avoid fetching external fonts
      const png = await domToPng(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        skipFonts: true, // Don't fetch fonts from Chrome extensions
      });
      
      const fetchesDuringCapture = fetchMonitor.length - startFetchCount;
      console.log(`  ✅ Capture complete (${fetchesDuringCapture} fetches during capture)`);
      
      return png;
    } finally {
      // Always remove container
      document.body.removeChild(container);
    }
  };

  try {
    // Capture Folder Selector using clean clone
    console.log("Capturing folder selector...");
    try {
      const folderPng = await captureElementClean(elementIds.folderSelector);
      console.log("Folder selector captured successfully");

      const img = new Image();
      img.src = folderPng;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = 180;
      const imgHeight = (img.height * imgWidth) / img.width;

      doc.setFontSize(14);
      //doc.text("Test Cycle Folder", 14, currentY);
      currentY += 7;
      doc.addImage(folderPng, "PNG", 14, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
      console.log("Folder selector added to PDF");
    } catch (error) {
      console.warn("Folder selector element not found:", error);
    }

    // Add page break if needed
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Capture Chart using clean clone
    console.log("Capturing chart...");
    try {
      const chartPng = await captureElementClean(elementIds.chartContainer);
      console.log("Chart captured successfully");

      const img = new Image();
      img.src = chartPng;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = 90;
      const imgHeight = (img.height * imgWidth) / img.width;

      doc.setFontSize(14);
      doc.text("Test Status Distribution", 14, currentY);
      currentY += 7;
      doc.addImage(chartPng, "PNG", 14, currentY, imgWidth, imgHeight);
      console.log("Chart added to PDF");

      // Capture Summary using clean clone (side by side with chart)
      console.log("Capturing summary...");
      try {
        const summaryPng = await captureElementClean(elementIds.summaryContainer);
        console.log("Summary captured successfully");

        const sumImg = new Image();
        sumImg.src = summaryPng;
        await new Promise((resolve) => {
          sumImg.onload = resolve;
        });

        const sumImgWidth = 90;
        const sumImgHeight = (sumImg.height * sumImgWidth) / sumImg.width;

        doc.addImage(summaryPng, "PNG", 108, currentY, sumImgWidth, sumImgHeight);
        console.log("Summary added to PDF");

        currentY += Math.max(imgHeight, sumImgHeight) + 15;
      } catch (error) {
        console.warn("Summary element not found:", error);
      }
    } catch (error) {
      console.warn("Chart element not found:", error);
    }
  } catch (error) {
    console.error("Error capturing screenshots:", error);
    // Add fallback text-based summary
    doc.setFontSize(12);
    doc.text(`Folder: ${folder.name}`, 14, currentY);
    currentY += 10;
    doc.text(`Total: ${folder.passed + folder.failed + folder.blocked + folder.notRun}`, 14, currentY);
    currentY += 7;
    doc.text(`Passed: ${folder.passed}`, 14, currentY);
    currentY += 7;
    doc.text(`Failed: ${folder.failed}`, 14, currentY);
    currentY += 7;
    doc.text(`Blocked: ${folder.blocked}`, 14, currentY);
    currentY += 7;
    doc.text(`Not Run: ${folder.notRun}`, 14, currentY);
    currentY += 15;
  } finally {
    // Restore original fetch
    window.fetch = originalFetch;
    
    // Log fetch monitoring summary
    console.log('📊 Fetch Monitoring Summary:');
    console.log(`  Total fetches monitored: ${fetchMonitor.length}`);
    
    const chromeFetches = fetchMonitor.filter(f => f.url.includes('chrome-extension://'));
    if (chromeFetches.length > 0) {
      console.log(`  🚫 Chrome extension fetches BLOCKED: ${chromeFetches.length}`);
      chromeFetches.forEach(f => console.log(`    - ${f.url}`));
    } else {
      console.log(`  ✅ No chrome-extension fetches detected`);
    }
    
    const otherFetches = fetchMonitor.filter(f => !f.url.includes('chrome-extension://'));
    if (otherFetches.length > 0) {
      console.log(`  ℹ️ Other fetches: ${otherFetches.length}`);
      otherFetches.forEach(f => console.log(`    - ${f.url}`));
    }
  }

  // Add new page for Test Execution Details
  doc.addPage();
  currentY = 20;

  // Add Test Execution Details grouped by cycle
  doc.setFontSize(14);
  doc.text("Test Execution Details", 14, currentY);
  currentY += 10;

  // Loop through each cycle
  for (let i = 0; i < testCycles.length; i++) {
    const cycle = testCycles[i];
    
    // Start a new page for each cycle (except the first one)
    if (i > 0) {
      doc.addPage();
      currentY = 20;
    }

    // Add cycle header
    doc.setFontSize(12);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(37, 99, 235); // Blue color
    
    // Split long title into multiple lines if needed
    const cycleHeader = `${cycle.key} - ${cycle.title}`;
    const maxWidth = doc.internal.pageSize.getWidth() - 28; // 14 left + 14 right margin
    const headerLines = doc.splitTextToSize(cycleHeader, maxWidth);
    
    headerLines.forEach((line: string) => {
      doc.text(line, 14, currentY);
      currentY += 6;
    });
    
    currentY += 1; // Extra spacing after header

    // Add cycle stats
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100); // Gray color
    if (cycle.stats) {
      const statsText = `Total: ${cycle.stats.total} | Passed: ${cycle.stats.passed} | Failed: ${cycle.stats.failed} | Blocked: ${cycle.stats.blocked} | Not Run: ${cycle.stats.notRun}`;
      doc.text(statsText, 14, currentY);
      currentY += 8;
    }

    // Reset text color for table
    doc.setTextColor(0, 0, 0);
    doc.setFont("Sarabun", "normal");

    // Prepare table data for this cycle
    const tableData = cycle.testRuns.map((item) => {
      const latestRun = item.runs[0];
      
      // Format duration from seconds
      const formatDuration = (seconds: number | undefined) => {
        if (!seconds) return "-";
        
        // Handle very small durations (less than 1 second)
        if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
        
        // Less than 1 minute - show in seconds
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        
        // 1 minute or more - show in minutes and seconds
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}m ${secs}s`;
      };
      
      return [
        item.testCase.key,
        item.testCase.title,
        item.testCase.priority.name,
        latestRun?.status || "Not Run",
        formatDuration(latestRun?.executionTime),
        latestRun?.updatedDate 
          ? new Date(latestRun.updatedDate).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
      ];
    });

    console.log(`Adding test execution table for cycle ${cycle.key} with ${tableData.length} rows...`);

    // Add table using autoTable with Thai font support
    autoTable(doc, {
      startY: currentY,
      head: [["Test Case", "Title", "Priority", "Status", "Duration", "Executed Date"]],
      body: tableData,
      styles: { 
        fontSize: 8,
        font: "Sarabun", // Use Thai font
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        fontStyle: "bold",
        font: "Sarabun",
      },
      columnStyles: {
        0: { cellWidth: 24 }, // Test Case
        1: { cellWidth: 60 }, // Title
        2: { cellWidth: 20 }, // Priority
        3: { cellWidth: 20 }, // Status
        4: { cellWidth: 18 }, // Duration
        5: { cellWidth: 40 }, // Executed Date
      },
      margin: { left: 14, right: 14 },
    });

    // Get the final Y position after the table
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  console.log("Test execution tables added to PDF");

  // Save PDF
  const safeFilename = folder.name.replaceAll(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filename = `test-report-${safeFilename}-${Date.now()}.pdf`;
  console.log("Saving PDF as:", filename);
  doc.save(filename);
  console.log("PDF with screenshots saved successfully!");
}

export function exportTestRunsToExcel(
  folder: FolderWithStats,
  testCycles: TestCycleWithRuns[]
): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create summary sheet
  const summaryData = [
    ["Test Execution Report"],
    [""],
    ["Folder:", folder.name],
    ["Generated:", new Date().toLocaleString("th-TH")],
    [""],
    ["Summary Statistics"],
    ["Status", "Count"],
    ["Total", folder.passed + folder.failed + folder.blocked + folder.notRun],
    ["Passed", folder.passed],
    ["Failed", folder.failed],
    ["Blocked", folder.blocked],
    ["Not Run", folder.notRun],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths for summary sheet
  summarySheet["!cols"] = [
    { wch: 20 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Create test runs sheet with all data
  const headers = [
    "Cycle",
    "Test Case",
    "Title",
    "Priority",
    "Status",
    "Duration (s)",
    "Executed Date",
    "Comment",
  ];

  const rows: any[][] = [headers];
  
  // Loop through each cycle and add its test runs
  for (const cycle of testCycles) {
    for (const item of cycle.testRuns) {
      const latestRun = item.runs[0];
      rows.push([
        `${cycle.key} - ${cycle.title}`,
        item.testCase.key,
        item.testCase.title,
        item.testCase.priority.name,
        latestRun?.status || "Not Run",
        latestRun?.executionTime || 0,
        latestRun 
          ? new Date(latestRun.executionDate).toLocaleString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        latestRun?.comment || "",
      ]);
    }
  }

  const testRunsSheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths for test runs sheet
  testRunsSheet["!cols"] = [
    { wch: 40 }, // Cycle
    { wch: 15 }, // Test Case
    { wch: 50 }, // Title
    { wch: 12 }, // Priority
    { wch: 12 }, // Status
    { wch: 15 }, // Duration
    { wch: 20 }, // Executed Date
    { wch: 30 }, // Comment
  ];

  XLSX.utils.book_append_sheet(workbook, testRunsSheet, "Test Runs");

  // Generate Excel file and download
  const safeFilename = folder.name.replaceAll(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filename = `test-runs-${safeFilename}-${Date.now()}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
}

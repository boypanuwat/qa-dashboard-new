import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

interface ParcelData {
  id: number;
  project_id: string;
  unit_code: string | null;
  unit_address: string | null;
  parcel_no: number;
  short_code: string;
  tracking_no: string;
  recipient_name: string | null;
  recipient_phonenumber: string;
  living_type: string | null;
  time_of_arrived: string;
  time_of_collected: string | null;
  stock_day: number;
  express: {
    name: string;
  };
  status: {
    name: string;
  };
  type: {
    name: string;
    name_en: string;
  };
  created_date: string;
  updated_date: string;
}

interface ParcelResponse {
  data: ParcelData[];
  total: number;
  size: number;
  page: number;
}

async function convertParcelToExcel() {
  try {
    // Read the parcel.json file
    const jsonPath = path.join(process.cwd(), "parcel.json");
    const jsonData = fs.readFileSync(jsonPath, "utf8");
    const parcelResponse: ParcelResponse = JSON.parse(jsonData);

    console.log(`📦 Found ${parcelResponse.data.length} parcels`);

    // Transform data for Excel export (flatten the structure)
    const excelData = parcelResponse.data.map((parcel) => ({
      ID: parcel.id,
      "Project ID": parcel.project_id,
      "Unit Code": parcel.unit_code || "",
      "Unit Address": parcel.unit_address || "",
      "Parcel No": parcel.parcel_no,
      "Short Code": parcel.short_code,
      "Tracking No": parcel.tracking_no,
      "Recipient Name": parcel.recipient_name || "",
      "Phone Number": parcel.recipient_phonenumber,
      "Living Type": parcel.living_type || "",
      "Express": parcel.express.name,
      "Parcel Type (TH)": parcel.type.name,
      "Parcel Type (EN)": parcel.type.name_en,
      "Status": parcel.status.name,
      "Stock Days": parcel.stock_day,
      "Time Arrived": parcel.time_of_arrived,
      "Time Collected": parcel.time_of_collected || "",
      "Created Date": parcel.created_date,
      "Updated Date": parcel.updated_date,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 10 }, // ID
      { wch: 15 }, // Project ID
      { wch: 12 }, // Unit Code
      { wch: 12 }, // Unit Address
      { wch: 12 }, // Parcel No
      { wch: 12 }, // Short Code
      { wch: 20 }, // Tracking No
      { wch: 30 }, // Recipient Name
      { wch: 15 }, // Phone Number
      { wch: 12 }, // Living Type
      { wch: 20 }, // Express
      { wch: 15 }, // Parcel Type (TH)
      { wch: 15 }, // Parcel Type (EN)
      { wch: 12 }, // Status
      { wch: 12 }, // Stock Days
      { wch: 25 }, // Time Arrived
      { wch: 25 }, // Time Collected
      { wch: 25 }, // Created Date
      { wch: 25 }, // Updated Date
    ];
    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parcels");

    // Write to file
    const outputPath = path.join(process.cwd(), "parcel-export.xlsx");
    XLSX.writeFile(workbook, outputPath);

    console.log(`✅ Excel file created successfully: ${outputPath}`);
    console.log(`📊 Exported ${excelData.length} rows`);
    console.log(`📁 File location: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error converting to Excel:", error);
    process.exit(1);
  }
}

// Run the conversion
convertParcelToExcel();

import * as XLSX from 'xlsx';
import * as path from 'path';

// สร้างไฟล์ user-mapping.xlsx template
const createUserMapping = () => {
  const data = [
    { userId: 'user1@example.com', displayName: 'John Doe' },
    { userId: 'user2@example.com', displayName: 'Jane Smith' },
    { userId: 'testuser123', displayName: 'Test User' },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  
  const filePath = path.join(process.cwd(), 'data', 'user-mapping.xlsx');
  XLSX.writeFile(wb, filePath);
  
  console.log(`✅ Created ${filePath}`);
};

createUserMapping();

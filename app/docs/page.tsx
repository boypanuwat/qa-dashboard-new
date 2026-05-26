"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Zap, 
  Settings, 
  Database, 
  BarChart3, 
  ListChecks, 
  Bug, 
  FileText,
  Sparkles,
  Shield,
  Workflow,
  ExternalLink
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          คู่มือการใช้งาน QA Dashboard - ระบบรายงานการทดสอบที่เชื่อมต่อกับ AIO Test Management
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <a href="#overview" className="group">
          <Card className="transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Sparkles className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <p className="font-medium">ภาพรวมระบบ</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="#setup" className="group">
          <Card className="transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Settings className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <p className="font-medium">การตั้งค่า</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="#features" className="group">
          <Card className="transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Workflow className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <p className="font-medium">การใช้งาน</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="#data" className="group">
          <Card className="transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Database className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <p className="font-medium">ข้อมูลที่ได้รับ</p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Overview Section */}
      <section id="overview" className="scroll-mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">ภาพรวมระบบ</CardTitle>
            </div>
            <CardDescription>QA Dashboard คืออะไร และทำงานร่วมกับ AIO อย่างไร</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">🎯 จุดประสงค์</h3>
              <p className="text-muted-foreground leading-relaxed">
                QA Dashboard เป็นระบบแสดงผลและวิเคราะห์ข้อมูลการทดสอบซอฟต์แวร์ ที่ดึงข้อมูลจาก
                <strong className="text-foreground"> AIO Test Management </strong> มาประมวลผล สรุป และแสดงผลในรูปแบบที่เข้าใจง่าย พร้อมฟีเจอร์การกรองข้อมูล export รายงาน และวิเคราะห์แนวโน้ม
              </p>

              <h3 className="text-lg font-semibold mt-6">🔗 การทำงานร่วมกับ AIO Test Management</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium">เชื่อมต่อผ่าน AIO API</p>
                    <p className="text-sm text-muted-foreground">
                      ใช้ API Token เพื่อดึงข้อมูล Test Cycles, Test Runs, Folders และผลการทดสอบ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium">ประมวลผลและแคชข้อมูล</p>
                    <p className="text-sm text-muted-foreground">
                      ระบบแคชข้อมูลใน Memory และ Server-side เพื่อลดเวลาการโหลด
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium">แสดงผลแบบ Real-time</p>
                    <p className="text-sm text-muted-foreground">
                      อัพเดทข้อมูลทันทีเมื่อมีการเปลี่ยนแปลงใน AIO
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6">⚡ ประสิทธิภาพ</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span><strong className="text-foreground">Request แรก:</strong> ~10s (ดึงข้อมูลจาก AIO API)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span><strong className="text-foreground">Request ถัดไป:</strong> &lt;1ms (จาก Memory Cache)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                  <span><strong className="text-foreground">หลัง 10 นาที:</strong> ~50ms (Server-side Cache)</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Setup Section */}
      <section id="setup" className="scroll-mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">การตั้งค่าระบบ</CardTitle>
            </div>
            <CardDescription>ขั้นตอนการเตรียมและตั้งค่าระบบครั้งแรก</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Registration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">ขั้นตอน 1</Badge>
                <h3 className="text-lg font-semibold">ลงทะเบียนผู้ใช้งาน</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  เข้าหน้า Login และคลิก <strong className="text-foreground">ลงทะเบียนที่นี่</strong>
                </p>
                <ol className="text-sm space-y-1 text-muted-foreground ml-4 list-decimal">
                  <li>กรอกชื่อ-นามสกุล</li>
                  <li>กรอกอีเมล์</li>
                  <li>ตั้งรหัสผ่าน (ความยาวอย่างน้อย 6 ตัวอักษร)</li>
                  <li>ยืนยันรหัสผ่านอีกครั้ง</li>
                </ol>
              </div>
            </div>

            {/* Step 2: Login */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">ขั้นตอน 2</Badge>
                <h3 className="text-lg font-semibold">เข้าสู่ระบบ</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  ใช้อีเมล์และรหัสผ่านที่ลงทะเบียนไว้เพื่อเข้าสู่ระบบ
                  <br />
                  Session จะคงอยู่เป็นเวลา <strong className="text-foreground">30 วัน</strong>
                </p>
              </div>
            </div>

            {/* Step 3: AIO Config */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">ขั้นตอน 3</Badge>
                <h3 className="text-lg font-semibold">ตั้งค่า AIO API Credentials</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">คลิกที่ไอคอนผู้ใช้ (มุมขวาบน) → เลือก Settings</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">📝 กรอกข้อมูลต่อไปนี้:</p>
                  <div className="space-y-2 ml-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">1. AIO API URL</p>
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        https://tcms.aiojiraapps.com/aio-tcms/api/v1
                      </code>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">2. Project ID</p>
                      <p className="text-xs text-muted-foreground">
                        เช่น:<code className="bg-background px-1 py-0.5 rounded"></code>(Project Key ของคุณ)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">3. API Token</p>
                      <p className="text-xs text-muted-foreground">
                        ไปที่ AIO Test Management → Settings → API Tokens → สร้าง New Token
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">หมายเหตุ:</strong> ข้อมูลจะถูกเข้ารหัสและเก็บแยกตามผู้ใช้แต่ละคน
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Ready */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 border-green-500/20">เสร็จสิ้น</Badge>
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">พร้อมใช้งาน!</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                ตอนนี้คุณสามารถเข้าใช้งานเมนูต่างๆ ได้เลย ระบบจะดึงข้อมูลจาก AIO Test Management อัตโนมัติ
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Workflow className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">การใช้งานแต่ละเมนู</CardTitle>
            </div>
            <CardDescription>คำอธิบายฟีเจอร์และวิธีใช้งานในแต่ละหน้า</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dashboard */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Dashboard</h3>
                <Badge>หน้าหลัก</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                แสดงภาพรวมผลการทดสอบแบบ Real-time พร้อมกราฟและสถิติ
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">✨ ฟีเจอร์:</p>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• สถิติการทดสอบ (Total, Passed, Failed, Blocked, Pass Rate)</li>
                  <li>• กราฟแนวโน้มการทดสอบ 14 วันย้อนหลัง</li>
                  <li>• ตารางผลการทดสอบล่าสุด (10 รายการล่าสุด)</li>
                  <li>• Filter by Sprint/Folder, Tester, Date Range</li>
                  <li>• เลือกได้หลาย Folder พร้อมกัน</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">🎯 วิธีใช้:</p>
                <ol className="text-sm space-y-1 text-muted-foreground ml-4 list-decimal">
                  <li>เลือก Sprint/Folder ที่ต้องการดู</li>
                  <li>กรองข้อมูลตาม Tester หรือช่วงวันที่ (ถ้าต้องการ)</li>
                  <li>ดูสถิติและกราฟที่อัพเดทแบบ real-time</li>
                </ol>
              </div>
            </div>

            {/* Test Cycles */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Test Cycles</h3>
                <Badge variant="secondary">รายงานการทดสอบ</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                รายงานสรุปผลการทดสอบประจำ Sprint แบบละเอียด พร้อม Export
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">✨ ฟีเจอร์:</p>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• เลือก Folder และ Cycle ที่ต้องการดู</li>
                  <li>• สถิติรวมทุก Cycle (Total, Passed, Failed, Blocked, Not Run)</li>
                  <li>• Pie Chart แสดงสัดส่วนผลการทดสอบ</li>
                  <li>• ตารางรายละเอียด Test Runs พร้อมผลการทดสอบ</li>
                  <li>• Refresh ข้อมูลจาก API ได้ทันที</li>
                  <li>• Export เป็น PDF และ Excel</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">🎯 วิธีใช้:</p>
                <ol className="text-sm space-y-1 text-muted-foreground ml-4 list-decimal">
                  <li>เลือก Folder (Sprint) จาก dropdown</li>
                  <li>เลือก Test Cycles ที่ต้องการ (เลือกได้หลายตัว)</li>
                  <li>คลิก Apply เพื่อโหลดข้อมูล</li>
                  <li>ดูสถิติ กราฟ และรายละเอียด Test Runs</li>
                  <li>Export รายงานเมื่อต้องการ</li>
                </ol>
              </div>
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Performance:</strong> โหลดแบบ Progressive - แสดงผลทีละ batch เพื่อความเร็ว
                </p>
              </div>
            </div>

            {/* Defects */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Defects</h3>
                <Badge variant="secondary">รายงาน Bug</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                แสดงรายการ Defects/Bugs จาก Google Sheets พร้อมกรองและค้นหา
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">✨ ฟีเจอร์:</p>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• ตาราง Defects พร้อมรายละเอียด</li>
                  <li>• Filter by Priority, Status, Assignee</li>
                  <li>• Search ตาม Title หรือ Description</li>
                  <li>• Sort ตามคอลัมน์ต่างๆ</li>
                </ul>
              </div>
            </div>

            {/* Reports */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Reports</h3>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                รายงานเชิงวิเคราะห์และสรุปผลการทดสอบในระยะยาว
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Section */}
      <section id="data" className="scroll-mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">ข้อมูลที่ได้รับจาก AIO</CardTitle>
            </div>
            <CardDescription>รายละเอียดข้อมูลที่ระบบดึงมาจาก AIO Test Management API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Folders */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">📁 Folders</h3>
                <p className="text-sm text-muted-foreground">
                  รายการ Sprint/Folders ที่มีใน Project
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                  <li>• Folder ID, Name</li>
                  <li>• จำนวน Test Cycles</li>
                  <li>• สถิติการทดสอบ</li>
                </ul>
              </div>

              {/* Test Cycles */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">🔄 Test Cycles</h3>
                <p className="text-sm text-muted-foreground">
                  รอบการทดสอบแต่ละรอบ
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                  <li>• Cycle Key, Name</li>
                  <li>• Folder, Owner</li>
                  <li>• Created/Updated Date</li>
                  <li>• Status</li>
                </ul>
              </div>

              {/* Test Runs */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">✅ Test Runs</h3>
                <p className="text-sm text-muted-foreground">
                  ผลการทดสอบแต่ละ Test Case
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                  <li>• Test Case Key, Title</li>
                  <li>• Status (Pass/Fail/Block)</li>
                  <li>• Assigned To, Executed By</li>
                  <li>• Execution Time, Date</li>
                  <li>• Comments</li>
                </ul>
              </div>

              {/* Users */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">👤 Users</h3>
                <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                  <li>• Email, Name</li>
                  <li>• AIO Credentials</li>
                  <li>• Created Date</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Database className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">แหล่งข้อมูล</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• <strong>AIO Test Management API:</strong> Test Cycles, Test Runs, Folders</li>
                    <li>• <strong>Server Cache:</strong> Memory + Server-side (10 นาที)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Resources */}
      <section className="scroll-mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">แหล่งข้อมูลเพิ่มเติม</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <a 
                href="https://tcms.aiojiraapps.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                <div>
                  <p className="text-sm font-medium">AIO Test Management</p>
                  <p className="text-xs text-muted-foreground">Official Website</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-8">
        <p>QA Dashboard v1.0.0 • Built with Next.js, TypeScript & AIO API</p>
      </div>
    </div>
  );
}

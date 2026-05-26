import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/google-sheets-auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (Email, Password, and Name are required)' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง (Invalid email format)' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร (Password must be at least 6 characters)' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร (Name must be at least 2 characters)' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว (Email already registered)' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with 'user' role by default
    const newUser = await createUser({
      email: email.toLowerCase(),
      passwordHash,
      name: name.trim(),
      role: 'user',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ (Registration successful! Please sign in)',
        user: {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลงทะเบียน (Registration failed)' },
      { status: 500 }
    );
  }
}

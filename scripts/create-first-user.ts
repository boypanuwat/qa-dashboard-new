#!/usr/bin/env node
/**
 * Script to generate password hash for creating users in Google Sheets
 * Usage: npx tsx scripts/create-first-user.ts [email] [password] [name]
 */

import bcrypt from 'bcryptjs';

const email = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'admin123';
const name = process.argv[4] || 'Admin User';
const role = process.argv[5] || 'admin';

const passwordHash = bcrypt.hashSync(password, 10);
const createdAt = new Date().toISOString();

console.log('\n✅ Password hashed successfully!\n');
console.log('📋 Copy this row and paste into Google Sheet "Users" tab:\n');
console.log('---');
console.log(`${email}\t${passwordHash}\t${name}\t${role}\t${createdAt}`);
console.log('---\n');
console.log('📌 Or copy as separate columns:\n');
console.log(`Email:        ${email}`);
console.log(`PasswordHash: ${passwordHash}`);
console.log(`Name:         ${name}`);
console.log(`Role:         ${role}`);
console.log(`CreatedAt:    ${createdAt}`);
console.log('\n');

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

export async function initDb() {
  const db = await open({
    filename: './data/database.sqlite',
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT,
      status TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      parentId TEXT,
      status TEXT,
      "order" INTEGER,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      categoryId TEXT,
      name TEXT,
      description TEXT,
      unit TEXT,
      costPrice REAL,
      retailPrice REAL,
      imageUrl TEXT,
      status TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      clientName TEXT,
      contactPerson TEXT,
      phone TEXT,
      date TEXT,
      headCount INTEGER,
      items TEXT,
      totalRetail REAL,
      totalDiscounted REAL,
      perPerson REAL,
      status TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      quotationId TEXT,
      contractNumber TEXT,
      clientName TEXT,
      amount REAL,
      status TEXT,
      content TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      companyName TEXT,
      logo TEXT,
      contactInfo TEXT
    );

    CREATE TABLE IF NOT EXISTS contract_templates (
      id TEXT PRIMARY KEY,
      name TEXT,
      content TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      status TEXT,
      createdAt TEXT
    );
  `);

  // Seed admin user if not exists
  const admin = await db.get('SELECT * FROM users WHERE email = ?', ['admin@system.local']);
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin888', 10);
    await db.run(
      'INSERT INTO users (id, email, password, name, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['admin-id', 'admin@system.local', hashedPassword, '超级管理员', 'super_admin', 'active', new Date().toISOString()]
    );
  }

  // Seed settings if not exists
  const settings = await db.get('SELECT * FROM settings WHERE id = ?', ['config']);
  if (!settings) {
    await db.run(
      'INSERT INTO settings (id, companyName, logo, contactInfo) VALUES (?, ?, ?, ?)',
      ['config', '旅游报价系统', '', '']
    );
  }

  return db;
}

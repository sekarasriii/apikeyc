const express = require('express')
const path = require('path')
const crypto = require('crypto')
const mysql = require('mysql2/promise')
const app = express()
const port = 3000

// Konfigurasi koneksi MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',           // Ganti dengan username MySQL Anda
  password: '@21baplanGGG',           // Ganti dengan password MySQL Anda
  database: 'api_key_db',
  port: 3309,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}
// Buat connection pool
const pool = mysql.createPool(dbConfig)

// Test koneksi database saat server start
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Koneksi ke MySQL berhasil!')
    connection.release()
  } catch (error) {
    console.error('❌ Gagal koneksi ke MySQL:', error.message)
    process.exit(1)
  }
}
testConnection()
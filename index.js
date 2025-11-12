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

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// Route untuk root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Endpoint untuk membuat API key
app.post('/create', async (req, res) => {
  let connection;
  try {
    const timestamp = Date.now()
    const random = crypto.randomBytes(32).toString('base64url')
    const apiKey = 'sk-itumy-v1-' + timestamp + '_' + random
    
    // Simpan ke database
    connection = await pool.getConnection()
    const [result] = await connection.query(
      'INSERT INTO api_keys (api_key, is_active) VALUES (?, ?)',
      [apiKey, true]
    )
    
    console.log('✅ API Key berhasil disimpan ke database, ID:', result.insertId)
    
    res.setHeader('Content-Type', 'application/json')
    res.json({
      success: true,
      apiKey: apiKey,
      message: 'API Key berhasil dibuat dan disimpan ke database',
      dbId: result.insertId
    })
    
  } catch (error) {
    console.error('❌ Error saat membuat API key:', error)
    res.status(500).json({
      success: false,
      error: 'Gagal membuat API key',
      message: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

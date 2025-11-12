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

// Endpoint untuk check validasi API key
app.post('/checkapi', async (req, res) => {
  let connection;
  try {
    const { apiKey } = req.body
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key tidak boleh kosong',
        valid: false
      })
    }
    
    // Cek di database
    connection = await pool.getConnection()
    const [rows] = await connection.query(
      'SELECT * FROM api_keys WHERE api_key = ? AND is_active = TRUE',
      [apiKey]
    )
    
    if (rows.length > 0) {
      const keyData = rows[0]
      return res.json({
        success: true,
        valid: true,
        message: 'API Key valid',
        data: {
          id: keyData.id,
          apiKey: keyData.api_key,
          createdAt: keyData.created_at,
          status: keyData.is_active ? 'active' : 'inactive'
        }
      })
    } else {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'API Key tidak valid atau tidak aktif'
      })
    }
    
  } catch (error) {
    console.error('❌ Error saat check API key:', error)
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Terjadi kesalahan server',
      message: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint untuk list semua API keys
app.get('/listkeys', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection()
    const [rows] = await connection.query(
      'SELECT id, api_key, created_at, is_active FROM api_keys ORDER BY created_at DESC'
    )
    
    res.json({
      success: true,
      total: rows.length,
      keys: rows
    })
    
  } catch (error) {
    console.error('❌ Error saat list keys:', error)
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data',
      message: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Endpoint untuk deactivate API key
app.post('/deactivate', async (req, res) => {
  let connection;
  try {
    const { apiKey } = req.body
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key tidak boleh kosong'
      })
    }
    
    connection = await pool.getConnection()
    const [result] = await connection.query(
      'UPDATE api_keys SET is_active = FALSE WHERE api_key = ?',
      [apiKey]
    )
    
    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'API Key berhasil dinonaktifkan'
      })
    } else {
      res.status(404).json({
        success: false,
        message: 'API Key tidak ditemukan'
      })
    }
    
  } catch (error) {
    console.error('❌ Error saat deactivate key:', error)
    res.status(500).json({
      success: false,
      error: 'Gagal menonaktifkan API key',
      message: error.message
    })
  } finally {
    if (connection) connection.release()
  }
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  await pool.end()
  process.exit(0)
})

app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`)
})
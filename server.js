require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// MySQL Database Connection Pool configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stockvantage_db'
};

let pool;

// Check connection on startup
async function initDb() {
  try {
    pool = mysql.createPool(dbConfig);
    // Test the connection
    const conn = await pool.getConnection();
    console.log('Database terhubung sukses ke MySQL:', dbConfig.host);
    conn.release();
  } catch (error) {
    console.error('\n================================================================');
    console.error('PERINGATAN: Gagal terhubung ke MySQL Database!');
    console.error('Detail Error:', error.message);
    console.error('\nPastikan:');
    console.error('1. MySQL Server Anda sudah aktif.');
    console.error('2. Database "' + dbConfig.database + '" telah dibuat.');
    console.error('3. Skrip "schema.sql" telah dijalankan di database tersebut.');
    console.error('4. Password MySQL di file .env sudah sesuai.');
    console.error('================================================================\n');
  }
}

initDb();

// Helper to format customDate for transaction log if not provided
function formatDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()];
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day} ${month}, ${hours}:${minutes}`;
}

function formatDatetimeLocal(dtStr) {
  if (!dtStr) return formatDateTime(new Date());
  const d = new Date(dtStr);
  return formatDateTime(d);
}

// ==========================================================================
// API ROUTES
// ==========================================================================

// --- 1. AUTHENTICATION API ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    const user = rows[0];
    res.json({
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }

  try {
    // Check if email exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role]);
    res.status(201).json({ message: 'User berhasil didaftarkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. ITEMS (INVENTORY) API ---
app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, w.name AS warehouse_name 
      FROM items i 
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      ORDER BY i.created_at DESC
    `);
    
    // Map database fields to frontend structure, reconstruct location string
    const items = rows.map(row => {
      const location = row.slot 
        ? `${row.warehouse_name} - Rak ${row.rack_letter}-${row.slot}` 
        : `${row.warehouse_name} - Rak ${row.rack_letter}`;
      
      return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        category: row.category,
        price: parseFloat(row.price),
        quantity: row.quantity,
        minStock: row.min_stock,
        location: location
      };
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  const { id, name, sku, category, price, quantity, minStock, warehouse_id, rack_letter, slot, customDate } = req.body;
  if (!id || !name || !sku || !category || price === undefined || quantity === undefined || minStock === undefined || !warehouse_id || !rack_letter) {
    return res.status(400).json({ error: 'Parameter barang tidak lengkap' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert Item
    await connection.query(
      'INSERT INTO items (id, name, sku, category, price, quantity, min_stock, warehouse_id, rack_letter, slot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, sku, category, price, quantity, minStock, warehouse_id, rack_letter, slot || null]
    );

    // If quantity > 0, log transaction
    if (quantity > 0) {
      const trxId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const timestamp = customDate ? formatDatetimeLocal(customDate) : formatDateTime(new Date());
      await connection.query(
        'INSERT INTO transactions (id, item_id, item_name, type, quantity, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [trxId, id, name, 'in', quantity, timestamp]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Barang berhasil ditambahkan' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, sku, category, price, minStock, warehouse_id, rack_letter, slot } = req.body;

  try {
    await pool.query(
      'UPDATE items SET name = ?, sku = ?, category = ?, price = ?, min_stock = ?, warehouse_id = ?, rack_letter = ?, slot = ? WHERE id = ?',
      [name, sku, category, price, minStock, warehouse_id, rack_letter, slot || null, id]
    );
    res.json({ message: 'Barang berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Barang berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. WAREHOUSES & RACKS API ---
app.get('/api/warehouses', async (req, res) => {
  try {
    const [whRows] = await pool.query('SELECT * FROM warehouses ORDER BY name ASC');
    const [rackRows] = await pool.query('SELECT * FROM racks ORDER BY rack_letter ASC');

    // Group racks by warehouse_id
    const warehouses = whRows.map(wh => {
      const whRacks = rackRows.filter(r => r.warehouse_id === wh.id);
      const rackLetters = whRacks.map(r => r.rack_letter);
      const capacityMap = {};
      whRacks.forEach(r => {
        capacityMap[r.rack_letter] = r.capacity;
      });

      return {
        id: wh.id,
        name: wh.name,
        description: wh.description,
        color: wh.color,
        racks: rackLetters,
        capacity: capacityMap
      };
    });

    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  const { id, name, description, color, racks, capacity } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Nama dan ID gudang wajib diisi' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert Warehouse
    await connection.query(
      'INSERT INTO warehouses (id, name, description, color) VALUES (?, ?, ?, ?)',
      [id, name, description || '', color || 'blue']
    );

    // Insert Racks
    if (racks && racks.length > 0) {
      for (const rackLetter of racks) {
        const cap = capacity[rackLetter] || 100;
        await connection.query(
          'INSERT INTO racks (warehouse_id, rack_letter, capacity) VALUES (?, ?, ?)',
          [id, rackLetter, cap]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Gudang berhasil ditambahkan' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/warehouses/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, color, racks, capacity } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update Warehouse info
    await connection.query(
      'UPDATE warehouses SET name = ?, description = ?, color = ? WHERE id = ?',
      [name, description || '', color || 'blue', id]
    );

    // Simple Rack sync strategy: Delete removed racks, insert/update current racks
    const [existingRacks] = await connection.query('SELECT rack_letter FROM racks WHERE warehouse_id = ?', [id]);
    const existingLetters = existingRacks.map(r => r.rack_letter);

    // Delete racks not in new list
    const toDelete = existingLetters.filter(l => !racks.includes(l));
    if (toDelete.length > 0) {
      await connection.query('DELETE FROM racks WHERE warehouse_id = ? AND rack_letter IN (?)', [id, toDelete]);
    }

    // Insert or Update current racks
    for (const rackLetter of racks) {
      const cap = capacity[rackLetter] || 100;
      await connection.query(
        'INSERT INTO racks (warehouse_id, rack_letter, capacity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE capacity = ?',
        [id, rackLetter, cap, cap]
      );
    }

    await connection.commit();
    res.json({ message: 'Gudang berhasil diperbarui' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM warehouses WHERE id = ?', [id]);
    res.json({ message: 'Gudang berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. TRANSACTIONS API ---
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50');
    res.json(rows.map(row => ({
      id: row.id,
      itemId: row.item_id,
      itemName: row.item_name,
      type: row.type,
      quantity: row.quantity,
      timestamp: row.timestamp
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { itemId, type, quantity, customDate } = req.body;
  if (!itemId || !type || quantity === undefined) {
    return res.status(400).json({ error: 'Parameter transaksi tidak lengkap' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get Item current stock and name
    const [itemRows] = await connection.query('SELECT name, quantity FROM items WHERE id = ?', [itemId]);
    if (itemRows.length === 0) {
      return res.status(404).json({ error: 'Barang tidak ditemukan' });
    }
    const item = itemRows[0];

    // Compute new quantity
    let newQty = item.quantity;
    if (type === 'in') {
      newQty += quantity;
    } else if (type === 'out') {
      if (item.quantity < quantity) {
        return res.status(400).json({ error: 'Stok tidak mencukupi untuk dikeluarkan' });
      }
      newQty -= quantity;
    } else {
      return res.status(400).json({ error: 'Tipe transaksi tidak valid' });
    }

    // Update Item quantity
    await connection.query('UPDATE items SET quantity = ? WHERE id = ?', [newQty, itemId]);

    // Insert Transaction log
    const trxId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = customDate ? formatDatetimeLocal(customDate) : formatDateTime(new Date());
    await connection.query(
      'INSERT INTO transactions (id, item_id, item_name, type, quantity, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [trxId, itemId, item.name, type, quantity, timestamp]
    );

    await connection.commit();
    res.json({ message: 'Transaksi berhasil diproses', newQuantity: newQty });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// --- 5. USERS MANAGEMENT API (MANAGER ONLY) ---
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name, email, role FROM users ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar oleh pengguna lain' });
    }
    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role]);
    res.status(201).json({ message: 'Pengguna berhasil dibuat' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:email', async (req, res) => {
  const oldEmail = req.params.email;
  const { name, email, password, role } = req.body;
  try {
    // Check email availability if changed
    if (email !== oldEmail) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email baru sudah digunakan' });
      }
    }
    await pool.query(
      'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE email = ?',
      [name, email, password, role, oldEmail]
    );
    res.json({ message: 'Pengguna berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:email', async (req, res) => {
  const { email } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback HTML routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Listen to port
app.listen(PORT, () => {
  console.log(`Server StockVantage WMS berjalan di http://localhost:${PORT}`);
});

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'datatalk.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initSchema() {
  const conn = getDb();
  conn.exec(`
    CREATE TABLE IF NOT EXISTS superstore_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_date TEXT,
      region TEXT,
      category TEXT,
      sub_category TEXT,
      sales REAL,
      profit REAL,
      quantity INTEGER,
      customer_segment TEXT,
      state TEXT
    )
  `);
}

function getSchema(tableName = 'superstore_sales') {
  const conn = getDb();

  // Check if table exists
  const tableExists = conn.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName);

  if (!tableExists) {
    return null;
  }

  const columns = conn.prepare(`PRAGMA table_info(${tableName})`).all();
  const rowCount = conn.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;

  const columnsWithSamples = columns.map(col => {
    const samples = conn.prepare(
      `SELECT DISTINCT "${col.name}" FROM "${tableName}" WHERE "${col.name}" IS NOT NULL LIMIT 5`
    ).all().map(row => row[col.name]);

    return {
      name: col.name,
      type: col.type || 'TEXT',
      sample_values: samples
    };
  });

  return {
    table_name: tableName,
    columns: columnsWithSamples,
    row_count: rowCount
  };
}

function executeQuery(sql) {
  const conn = getDb();
  // Safety check: only allow SELECT / WITH statements
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
    throw new Error('Only SELECT queries are allowed');
  }
  return conn.prepare(sql).all();
}

function getAllTableNames() {
  const conn = getDb();
  return conn.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  ).all().map(r => r.name);
}

module.exports = { getDb, initSchema, getSchema, executeQuery, getAllTableNames };

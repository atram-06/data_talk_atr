require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const { getDb, initSchema, getSchema, executeQuery, getAllTableNames } = require('./db');
const { queryGemini, retryWithError } = require('./gemini');

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

app.use(cors());
app.use(express.json());

// Track active table
let activeTable = 'superstore_sales';

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  try {
    getDb();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// ─── Schema ───────────────────────────────────────────────────
app.get('/api/schema', (req, res) => {
  try {
    const schema = getSchema(activeTable);
    if (!schema) {
      return res.status(404).json({ error: `Table "${activeTable}" not found` });
    }
    res.json(schema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Query (Chat → Gemini → SQL → Data) ──────────────────────
app.post('/api/query', async (req, res) => {
  try {
    const { question, history = [] } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Step 1: Ask Gemini
    let geminiResult;
    try {
      geminiResult = await queryGemini(question, activeTable, history);
    } catch (err) {
      return res.status(500).json({
        can_answer: false,
        error_message: `AI service error: ${err.message}`,
        insight: 'I had trouble processing your question. Please try rephrasing it.'
      });
    }

    // If Gemini says it can't answer
    if (geminiResult.can_answer === false) {
      return res.json({
        can_answer: false,
        insight: geminiResult.insight || 'I cannot answer this question with the available data.',
        error_message: null,
        chart_type: null,
        title: null,
        data: [],
        x_key: null,
        y_key: null,
        sql_query: null
      });
    }

    // Step 2: Execute SQL
    let data;
    try {
      data = executeQuery(geminiResult.sql_query);
    } catch (sqlErr) {
      // Retry once with error feedback to Gemini
      try {
        geminiResult = await retryWithError(question, sqlErr.message, activeTable);
        if (geminiResult.can_answer === false) {
          return res.json({
            can_answer: false,
            insight: geminiResult.insight,
            error_message: null,
            chart_type: null,
            title: null,
            data: [],
            x_key: null,
            y_key: null,
            sql_query: null
          });
        }
        data = executeQuery(geminiResult.sql_query);
      } catch (retryErr) {
        return res.status(500).json({
          can_answer: false,
          error_message: `SQL execution failed: ${retryErr.message}`,
          insight: 'I had trouble running the query. Please try a different question.',
          sql_query: geminiResult.sql_query
        });
      }
    }

    res.json({
      chart_type: geminiResult.chart_type,
      title: geminiResult.title,
      data,
      x_key: geminiResult.x_key,
      y_key: geminiResult.y_key,
      insight: geminiResult.insight,
      sql_query: geminiResult.sql_query,
      can_answer: true,
      error_message: null
    });
  } catch (err) {
    console.error('Query endpoint error:', err);
    res.status(500).json({
      can_answer: false,
      error_message: err.message,
      insight: 'An unexpected error occurred.'
    });
  }
});

// ─── Default Dashboard ──────────────────────────────────────────
app.get('/api/default-dashboard', (req, res) => {
  try {
    const charts = [
      {
        id: Date.now() + 1,
        chart_type: 'scatter',
        title: 'Profit vs Sales by Sub-Category',
        insight: 'Some product categories show negative margins despite high sales.',
        x_key: 'sales',
        y_key: 'profit',
        data: executeQuery(`SELECT sub_category, ROUND(SUM(sales), 2) as sales, ROUND(SUM(profit), 2) as profit FROM ${activeTable} GROUP BY sub_category`)
      },
      {
        id: Date.now() + 2,
        chart_type: 'pie',
        title: 'Sales by Region',
        insight: 'West region shows the highest aggregate volume.',
        x_key: 'region',
        y_key: 'total_sales',
        data: executeQuery(`SELECT region, ROUND(SUM(sales), 2) as total_sales FROM ${activeTable} GROUP BY region ORDER BY total_sales DESC`)
      },
      {
        id: Date.now() + 3,
        chart_type: 'line',
        title: 'Monthly Revenue Trend',
        insight: 'Clear spike in Q4 (holiday season effect).',
        x_key: 'month',
        y_key: 'total_sales',
        data: executeQuery(`SELECT strftime('%Y-%m', order_date) as month, ROUND(SUM(sales), 2) as total_sales FROM ${activeTable} GROUP BY month ORDER BY month`)
      },
      {
        id: Date.now() + 4,
        chart_type: 'bar',
        title: 'Sales by Category',
        insight: 'Technology leads in total revenue.',
        x_key: 'category',
        y_key: 'total_sales',
        data: executeQuery(`SELECT category, ROUND(SUM(sales), 2) as total_sales FROM ${activeTable} GROUP BY category ORDER BY total_sales DESC`)
      }
    ];
    res.json(charts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CSV Upload ───────────────────────────────────────────────
app.post('/api/upload-csv', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const raw = fs.readFileSync(req.file.path, 'utf-8');

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    let records;
    try {
      records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error: `CSV parsing error: ${parseErr.message}`
      });
    }

    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'CSV file is empty' });
    }

    // Generate table name from filename
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const tableName = baseName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    const db = getDb();
    const columns = Object.keys(records[0]);

    // Infer types from first few rows
    const columnDefs = columns.map(col => {
      const sampleValues = records.slice(0, 20).map(r => r[col]).filter(v => v !== '' && v != null);
      const allNumeric = sampleValues.length > 0 && sampleValues.every(v => !isNaN(Number(v)));
      const allInteger = allNumeric && sampleValues.every(v => Number.isInteger(Number(v)));

      let type = 'TEXT';
      if (allInteger) type = 'INTEGER';
      else if (allNumeric) type = 'REAL';

      return { name: col, type, sample_values: sampleValues.slice(0, 5) };
    });

    // Drop table if exists, then create
    db.exec(`DROP TABLE IF EXISTS "${tableName}"`);

    const colSql = columnDefs.map(c => `"${c.name}" ${c.type}`).join(', ');
    db.exec(`CREATE TABLE "${tableName}" (${colSql})`);

    // Insert data
    const placeholders = columns.map(() => '?').join(', ');
    const insertStmt = db.prepare(`INSERT INTO "${tableName}" VALUES (${placeholders})`);

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          const colDef = columnDefs.find(c => c.name === col);
          if (colDef.type === 'INTEGER') return parseInt(val, 10) || 0;
          if (colDef.type === 'REAL') return parseFloat(val) || 0;
          return val;
        });
        insertStmt.run(...values);
      }
    });

    insertMany(records);

    // Switch active table
    activeTable = tableName;

    res.json({
      success: true,
      table_name: tableName,
      columns: columnDefs,
      row_count: records.length
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────
initSchema();

app.listen(PORT, () => {
  console.log(`\n🚀 DataTalk backend running on http://localhost:${PORT}`);
  console.log(`📊 Active table: ${activeTable}`);
  console.log(`💡 Try: GET http://localhost:${PORT}/api/health\n`);
});

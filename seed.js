const { getDb, initSchema } = require('./db');

// Seed data configuration
const REGIONS = ['East', 'West', 'Central', 'South'];
const CATEGORIES = {
  'Technology': ['Phones', 'Accessories', 'Machines', 'Copiers'],
  'Furniture': ['Chairs', 'Tables', 'Bookcases', 'Furnishings'],
  'Office Supplies': ['Binders', 'Storage', 'Paper', 'Envelopes', 'Labels', 'Art', 'Supplies']
};
const SEGMENTS = ['Consumer', 'Corporate', 'Home Office'];
const STATES_BY_REGION = {
  East: ['New York', 'Pennsylvania', 'Massachusetts', 'New Jersey', 'Connecticut', 'Virginia', 'Maryland', 'North Carolina'],
  West: ['California', 'Washington', 'Oregon', 'Colorado', 'Arizona', 'Nevada', 'Utah'],
  Central: ['Texas', 'Illinois', 'Ohio', 'Michigan', 'Indiana', 'Minnesota', 'Wisconsin', 'Missouri'],
  South: ['Florida', 'Georgia', 'Tennessee', 'Alabama', 'Louisiana', 'Kentucky', 'South Carolina']
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRow(id) {
  // Month distribution: Q4 (Oct-Dec) has more weight for holiday spike
  let month;
  const roll = Math.random();
  if (roll < 0.15) month = 10;       // Oct - boosted
  else if (roll < 0.30) month = 11;  // Nov - boosted
  else if (roll < 0.48) month = 12;  // Dec - boosted
  else month = randInt(1, 9);        // Jan-Sep normal

  const day = randInt(1, 28);
  const order_date = `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Region: West gets more rows for highest sales
  let region;
  const regionRoll = Math.random();
  if (regionRoll < 0.32) region = 'West';
  else if (regionRoll < 0.58) region = 'East';
  else if (regionRoll < 0.80) region = 'Central';
  else region = 'South';

  // Category: Office Supplies highest volume, Technology fewer but higher value
  let category;
  const catRoll = Math.random();
  if (catRoll < 0.45) category = 'Office Supplies';
  else if (catRoll < 0.75) category = 'Technology';
  else category = 'Furniture';

  const sub_category = pick(CATEGORIES[category]);
  const customer_segment = pick(SEGMENTS);
  const state = pick(STATES_BY_REGION[region]);

  // Sales: Technology highest, Furniture medium, Office Supplies lower per unit
  let sales;
  if (category === 'Technology') {
    sales = rand(200, 5000);
  } else if (category === 'Furniture') {
    sales = rand(100, 3000);
  } else {
    sales = rand(10, 800);
  }

  // Q4 sales boost
  if (month >= 10) {
    sales *= rand(1.15, 1.45);
  }

  // West gets higher sales multiplier
  if (region === 'West') {
    sales *= rand(1.05, 1.2);
  }

  // Top states get boosted sales
  if (['California', 'New York', 'Texas'].includes(state)) {
    sales *= rand(1.1, 1.35);
  }

  sales = Math.round(sales * 100) / 100;

  // Profit: South has lowest margins, Furniture can go negative
  let profitMargin;
  if (category === 'Furniture') {
    profitMargin = rand(-0.25, 0.15);  // Often negative
  } else if (category === 'Technology') {
    profitMargin = rand(0.05, 0.35);
  } else {
    profitMargin = rand(0.02, 0.25);
  }

  // South gets reduced margins
  if (region === 'South') {
    profitMargin -= rand(0.05, 0.15);
  }

  const profit = Math.round(sales * profitMargin * 100) / 100;
  const quantity = category === 'Office Supplies' ? randInt(2, 20) : randInt(1, 10);

  return { order_date, region, category, sub_category, sales, profit, quantity, customer_segment, state };
}

function seed() {
  console.log('🌱 Initializing database...');
  initSchema();

  const db = getDb();

  // Clear existing data
  db.exec('DELETE FROM superstore_sales');

  console.log('📊 Generating 500 rows of sales data...');

  const insert = db.prepare(`
    INSERT INTO superstore_sales (order_date, region, category, sub_category, sales, profit, quantity, customer_segment, state)
    VALUES (@order_date, @region, @category, @sub_category, @sales, @profit, @quantity, @customer_segment, @state)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row);
    }
  });

  const rows = [];
  for (let i = 0; i < 500; i++) {
    rows.push(generateRow(i));
  }
  insertMany(rows);

  // Verify the data
  const count = db.prepare('SELECT COUNT(*) as c FROM superstore_sales').get().c;
  const regionStats = db.prepare('SELECT region, ROUND(SUM(sales),2) as total_sales, ROUND(SUM(profit),2) as total_profit FROM superstore_sales GROUP BY region ORDER BY total_sales DESC').all();
  const catStats = db.prepare('SELECT category, COUNT(*) as cnt, ROUND(SUM(sales),2) as total_sales FROM superstore_sales GROUP BY category ORDER BY total_sales DESC').all();
  const monthlyStats = db.prepare("SELECT strftime('%m', order_date) as month, ROUND(SUM(sales),2) as total_sales FROM superstore_sales GROUP BY month ORDER BY month").all();
  const negProfitCount = db.prepare("SELECT COUNT(*) as c FROM superstore_sales WHERE profit < 0").get().c;
  const topStates = db.prepare('SELECT state, ROUND(SUM(sales),2) as total_sales FROM superstore_sales GROUP BY state ORDER BY total_sales DESC LIMIT 5').all();

  console.log(`\n✅ Seeded ${count} rows successfully!\n`);
  console.log('📈 Sales by Region:');
  regionStats.forEach(r => console.log(`   ${r.region}: $${r.total_sales.toLocaleString()} (Profit: $${r.total_profit.toLocaleString()})`));
  console.log('\n📦 Sales by Category:');
  catStats.forEach(c => console.log(`   ${c.category}: ${c.cnt} orders, $${c.total_sales.toLocaleString()}`));
  console.log(`\n❌ Negative profit rows: ${negProfitCount}`);
  console.log('\n🏆 Top 5 States:');
  topStates.forEach(s => console.log(`   ${s.state}: $${s.total_sales.toLocaleString()}`));
  console.log('\n📅 Monthly Sales:');
  monthlyStats.forEach(m => console.log(`   Month ${m.month}: $${m.total_sales.toLocaleString()}`));
}

seed();

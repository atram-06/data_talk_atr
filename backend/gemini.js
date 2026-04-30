const { getSchema } = require('./db');
require('dotenv').config();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function buildSystemPrompt(tableName = 'superstore_sales') {
  const schema = getSchema(tableName);
  if (!schema) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const columnDescriptions = schema.columns
    .map(c => `  ${c.name} (${c.type}) — sample values: ${c.sample_values.slice(0, 4).join(', ')}`)
    .join('\n');

  return `You are a Business Intelligence analyst. You have access to a SQLite database table called '${tableName}' with these columns:
${columnDescriptions}

Total rows: ${schema.row_count}

The user will ask a business question. You must respond with ONLY a valid JSON object, no markdown, no explanation, just raw JSON:

{
  "sql_query": "SELECT ... FROM ${tableName} ...",
  "chart_type": "bar|line|pie|scatter|table",
  "x_key": "the column name for x axis",
  "y_key": "the column name for y axis",
  "title": "descriptive chart title",
  "insight": "one sentence business insight from this data",
  "can_answer": true
}

Chart type selection rules:
- IMPORTANT: If the user explicitly requests a specific chart type, ALWAYS use that chart type regardless of other rules.
- line: any question about trends over time or months
- pie: proportions, distributions, or "which X has most/least"
- bar: comparisons between categories
- scatter: relationship between two numeric columns
- table: when user asks for raw data or top N list

If the question cannot be answered with available columns, return:
{ "can_answer": false, "insight": "explanation of why" }

SQL rules:
- Always use proper SQLite syntax
- For dates use: strftime('%Y-%m', order_date) for monthly grouping
- Always include ORDER BY for time series
- Limit results to 20 rows maximum
- Never use DROP, DELETE, UPDATE, INSERT
- Always alias computed columns clearly`;
}

function parseGeminiResponse(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Attempt to repair truncated JSON
    console.warn('⚠️ JSON parse failed, attempting repair...');
    let repaired = cleaned;

    // Close any unterminated string
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }

    // Close open braces/brackets
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // Remove any trailing comma before closing
    repaired = repaired.replace(/,\s*$/, '');

    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

    try {
      return JSON.parse(repaired);
    } catch (secondError) {
      // Last resort: try to extract a partial JSON object
      const match = repaired.match(/\{[\s\S]*"can_answer"\s*:\s*(true|false)[\s\S]*?\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch (e) { /* fall through */ }
      }
      throw new Error(`Invalid JSON from Gemini: ${firstError.message}`);
    }
  }
}

// ─── API Key Rotation ─────────────────────────────────────────
function getApiKeys() {
  // Prefer comma-separated list, fall back to single key
  const keyList = process.env.GEMINI_API_KEYS;
  if (keyList) {
    const keys = keyList.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) return keys;
  }
  const single = process.env.GEMINI_API_KEY;
  if (single) return [single.trim()];
  throw new Error('No Gemini API keys configured. Set GEMINI_API_KEYS or GEMINI_API_KEY in .env');
}

let currentKeyIndex = 0;

function getNextKey(keys) {
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return keys[currentKeyIndex];
}

function getCurrentKey(keys) {
  return keys[currentKeyIndex % keys.length];
}

// ─── Main Query Function ──────────────────────────────────────
async function queryGemini(question, tableName = 'superstore_sales', history = []) {
  const apiKeys = getApiKeys();

  const systemPrompt = buildSystemPrompt(tableName);

  const contents = [];

  // Add conversation history
  if (history.length > 0) {
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
  }

  // Add current question
  contents.push({
    role: 'user',
    parts: [{ text: question }]
  });

  const requestBody = JSON.stringify({
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048
    }
  });

  // Phase 1: Quick scan — try each key with minimal delay to find one that works
  // Phase 2: If all fail, retry with longer delays
  const totalKeys = apiKeys.length;
  let lastError;

  // Phase 1: Quick scan through all keys (500ms between each)
  for (let i = 0; i < totalKeys; i++) {
    const key = getCurrentKey(apiKeys);
    const keyLabel = `Key #${(currentKeyIndex % totalKeys) + 1}/${totalKeys}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Unexpected Gemini API response structure');
      }
      const rawText = data.candidates[0].content.parts[0].text;
      console.log(`✅ Success with ${keyLabel}`);
      return parseGeminiResponse(rawText);
    }

    const errBody = await response.text();

    if (response.status === 429 || response.status === 503) {
      getNextKey(apiKeys);
      console.log(`⚡ ${keyLabel} rate limited. Trying next key... (${i + 1}/${totalKeys})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      lastError = errBody;
      continue;
    }

    // Non-rate-limit error (e.g. invalid key) — skip this key
    if (response.status === 400 || response.status === 403) {
      getNextKey(apiKeys);
      console.log(`⚠️ ${keyLabel} invalid/forbidden. Skipping...`);
      continue;
    }

    throw new Error(`Gemini API error (${response.status}): ${errBody}`);
  }

  // Phase 2: All keys failed quick scan. Wait and retry with the API's suggested delay.
  console.log(`⏳ All ${totalKeys} keys rate limited on quick scan. Starting retry with backoff...`);

  for (let cycle = 0; cycle < 2; cycle++) {
    // Parse retry delay from last error
    let waitTime = 20000; // default 20s
    try {
      const errJson = JSON.parse(lastError);
      const retryInfo = errJson.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
      const retrySeconds = parseFloat(retryInfo?.retryDelay?.replace('s', '')) || 0;
      if (retrySeconds > 0) waitTime = Math.ceil(retrySeconds * 1000) + 2000; // add 2s buffer
    } catch (e) { /* use default */ }

    console.log(`⏳ Waiting ${(waitTime/1000).toFixed(0)}s before retry cycle ${cycle + 1}...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Try all keys again
    for (let i = 0; i < totalKeys; i++) {
      const key = getCurrentKey(apiKeys);
      const keyLabel = `Key #${(currentKeyIndex % totalKeys) + 1}/${totalKeys}`;

      const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('Unexpected Gemini API response structure');
        }
        const rawText = data.candidates[0].content.parts[0].text;
        console.log(`✅ Success with ${keyLabel} (retry cycle ${cycle + 1})`);
        return parseGeminiResponse(rawText);
      }

      const errBody = await response.text();
      getNextKey(apiKeys);
      lastError = errBody;

      if (response.status === 429 || response.status === 503) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      if (response.status === 400 || response.status === 403) continue;

      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }
  }

  throw new Error(`All ${totalKeys} API keys exhausted. Please wait a few minutes or add fresh API keys. Last error: ${lastError}`);
}

async function retryWithError(originalQuestion, sqlError, tableName = 'superstore_sales') {
  const retryPrompt = `Fix this SQL error: ${sqlError}\nOriginal question: ${originalQuestion}\nPlease provide a corrected JSON response.`;
  return queryGemini(retryPrompt, tableName);
}

module.exports = { queryGemini, retryWithError, buildSystemPrompt };

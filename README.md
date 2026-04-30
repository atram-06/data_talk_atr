# DataTalk — Conversational BI Dashboard

A conversational Business Intelligence dashboard powered by AI. Ask natural language questions about your data and get instant SQL-powered visualizations.

![DataTalk](https://img.shields.io/badge/DataTalk-BI_Dashboard-00d4ff?style=for-the-badge)

## Features

- 🗣️ **Natural Language Queries** — Ask business questions in plain English
- 📊 **Auto-Generated Charts** — Line, Bar, Pie, Scatter, and Table visualizations
- 🤖 **AI-Powered** — Gemini 1.5 Flash translates questions to SQL
- 📁 **CSV Upload** — Drag and drop your own datasets
- 🎤 **Voice Input** — Speak your questions using Web Speech API
- 🎨 **Premium Dark UI** — Bloomberg-meets-Linear design aesthetic

## Setup (2 minutes)

### 1. Backend

```bash
cd backend
npm install
```

### 2. Configure API Key

Create a `.env` file in the `backend` directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Seed the Database

```bash
node seed.js
```

This loads 500 rows of realistic sales data.

### 4. Start the Backend

```bash
node server.js
```

Backend starts on `http://localhost:3001`.

### 5. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 6. Open the App

Navigate to **http://localhost:5173**

## Demo Queries

Try these queries to explore the pre-loaded Superstore sales data:

| Query | Expected Chart |
|-------|---------------|
| "Show me monthly revenue trend for 2024" | 📈 Line chart with 12 months |
| "Which product category generates the most sales?" | 🥧 Pie chart with 3 slices |
| "Compare profit margins across all 4 regions" | 📊 Bar chart with 4 bars |
| "Show me the top 10 sub-categories by revenue" | 📊 Bar chart with 10 bars |
| "Which states have negative profit? Show as a table" | 📋 Table view |
| "Is there a relationship between sales and profit?" | 🔵 Scatter chart |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS + Recharts |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| AI | Google Gemini 1.5 Flash |
| Voice | Web Speech API (Chrome) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/schema` | Get current table schema |
| POST | `/api/query` | Send natural language query |
| POST | `/api/upload-csv` | Upload CSV dataset |

## Architecture

```
User Question → Gemini AI → SQL Query → SQLite → Chart Data → React + Recharts
```

## License

MIT

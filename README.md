# Admin Dashboard — Getting Started

## Prerequisites

Make sure you have the following installed:

- Python 3.9+
- Node.js 18+
- npm

---

## 1. Start the Backend API (FastAPI)

Open a terminal and run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running:

```bash
curl -s http://localhost:8000/health | jq .
```

---

## 2. Seed the Database

Run the seed script with your CSV file:

```bash
python3 scripts/seed_db.py \
  --db backend/app/db/local.db \
  --csv data/students_base.csv \
  --seed 42 \
  --reset
```

> **Note:** Use an absolute path if you get a `FileNotFoundError`.
> Required CSV columns: `row_id, audience_type, grade, student_subgroup, visited_site, used_ORI, took_test, digital_experience`

Alternatively, seed via the API:

```bash
curl -X POST http://localhost:8000/admin/reset-and-seed \
  -H "Content-Type: application/json" \
  -d '{
    "csv_path": "data/students_base.csv",
    "seed": 42,
    "reset": true
  }'
```

Verify the seed worked:

```bash
curl -s http://localhost:8000/admin/db-stats | jq .
```

---

## 3. Start the Frontend

In a **new terminal** (keep the backend running), start the app from `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173** (or whichever port Vite assigns).

---

## Troubleshooting

**Backend not responding**
- Make sure your virtual environment is activated (`source .venv/bin/activate`)
- Make sure port 8000 is not already in use

**Empty data / blank dashboard**
- The database needs to be seeded before the frontend shows real data
- Run `curl -s http://localhost:8000/admin/db-stats | jq .` to check row counts

**CSV path errors**
- Use an absolute path: `ls -lh /absolute/path/to/students_base.csv`
- Confirm the required column headers are present

---

## API Reference (quick)

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `GET /leads?fair_id=1` | List leads |
| `GET /leads/{id}` | Lead detail |
| `GET /leads/{id}/score` | Lead score |
| `GET /kpis/fair/{fair_id}` | Fair KPIs |
| `GET /kpis/stands?fair_id=1` | Stand KPIs |
| `GET /kpis/conferences?fair_id=1` | Conference KPIs |
| `POST /events` | Create event |
| `POST /model/recompute` | Recompute scores |
| `GET /admin/db-stats` | Database stats |
---
title: L'Etudiant Admin Dashboard
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

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
| `GET /api/leads?fair_id=1` | List leads |
| `GET /api/leads/{id}` | Lead detail |
| `GET /api/leads/{id}/score` | Lead score |
| `GET /api/kpis/fair/{fair_id}` | Fair KPIs |
| `GET /api/kpis/stands?fair_id=1` | Stand KPIs |
| `GET /api/kpis/conferences?fair_id=1` | Conference KPIs |
| `POST /api/events` | Create event |
| `POST /api/model/recompute` | Recompute scores |
| `GET /api/admin/db-stats` | Database stats |

---

## Deploy on Hugging Face Spaces

This repository is ready to deploy as a **Docker Space** on [Hugging Face Spaces](https://huggingface.co/spaces).

### Quick deploy

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Choose **Docker** as the Space SDK.
3. Push this repository (or fork it) to the Space's git remote.
4. The Space will build the Docker image and expose the app at `https://<your-space>.hf.space`.

### Environment variables (optional overrides)

| Variable | Default | Description |
|---|---|---|
| `SEED_ON_STARTUP` | `true` | Seed/reset the DB from CSV on every startup |
| `SEED_CSV_PATH` | `data/students_base.csv` | Path to the CSV file (relative to project root) |
| `SEED_SEED` | `42` | Random seed for deterministic data generation |
| `SEED_RESET` | `true` | Drop and recreate all data before seeding |
| `APP_DB_PATH` | `backend/app/db/local.db` | SQLite database file path |
| `APP_CORS_ALLOW_ORIGINS` | localhost origins | Comma-separated list of allowed CORS origins |

### Local Docker test

```bash
docker build -t letudiant_v3 .
docker run -p 7860:7860 letudiant_v3
# open http://localhost:7860
```
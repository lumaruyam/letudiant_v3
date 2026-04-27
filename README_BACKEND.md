# Backend API (FastAPI)

The frontend app now lives in `frontend/` and should be started from there.

## 1) Install and start API

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl -s http://localhost:8000/health | jq .
```

## 2) Seed command (with valid CSV path)

```bash
python3 scripts/seed_db.py \
  --db backend/app/db/local.db \
  --csv data/students_base.csv \
  --seed 42 \
  --reset
```

Alternative via API:

```bash
curl -X POST http://localhost:8000/admin/reset-and-seed \
  -H "Content-Type: application/json" \
  -d '{
    "csv_path": "data/students_base.csv",
    "seed": 42,
    "reset": true
  }'
```

## 3) Sample curl calls

List leads:

```bash
curl -s "http://localhost:8000/leads?fair_id=1&limit=20&offset=0&sort_by=total_score&sort_order=desc" | jq .
```

Lead detail:

```bash
curl -s "http://localhost:8000/leads/1" | jq .
```

Lead score:

```bash
curl -s "http://localhost:8000/leads/1/score" | jq .
```

Fair KPIs:

```bash
curl -s "http://localhost:8000/kpis/fair/1" | jq .
```

Stand KPIs:

```bash
curl -s "http://localhost:8000/kpis/stands?fair_id=1&period=all" | jq .
```

Conference KPIs:

```bash
curl -s "http://localhost:8000/kpis/conferences?fair_id=1&period=all" | jq .
```

Create one event and recompute:

```bash
curl -X POST "http://localhost:8000/events?recompute=true" \
  -H "Content-Type: application/json" \
  -d '{
    "fair_id": 1,
    "student_id": 1,
    "event_type": "site_page_view",
    "source_channel": "web",
    "payload": {"page": "programme"}
  }' | jq .
```

Bulk events:

```bash
curl -X POST "http://localhost:8000/events/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"fair_id": 1, "student_id": 1, "event_type": "check_in"},
      {"fair_id": 1, "student_id": 1, "event_type": "stand_tap", "stand_id": 1}
    ]
  }' | jq .
```

Manual recompute:

```bash
curl -X POST http://localhost:8000/model/recompute | jq .
```

DB stats:

```bash
curl -s http://localhost:8000/admin/db-stats | jq .
```

## 4) Troubleshooting

### FileNotFoundError / CSV path issues

- Use an absolute path for `--csv` and `csv_path`.
- Confirm file exists:

```bash
ls -lh /absolute/path/to/your/students_base.csv
```

- Required CSV headers: `row_id,audience_type,grade,student_subgroup,visited_site,used_ORI,took_test,digital_experience`

### Empty DB responses

If seeding has not run or failed:

- `GET /leads` returns `{ "data": [], "total": 0, ... }`
- `GET /kpis/fair/{fair_id}` returns zero metrics instead of server errors.

Use:

```bash
curl -s http://localhost:8000/admin/db-stats | jq .
```

to verify row counts by table.

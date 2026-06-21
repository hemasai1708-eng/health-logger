# VitalLog — Health & Fitness Logger

A full-stack health tracking web app with a **Python/Flask backend** (NumPy + Pandas, CSV storage) and a clean **vanilla JS + Chart.js frontend**.

---

## Project Structure

```
health_logger/
├── backend/
│   ├── app.py              # Flask REST API (NumPy + Pandas analytics)
│   └── requirements.txt
├── frontend/
│   ├── index.html          # Single-page app
│   └── static/
│       ├── css/style.css
│       └── js/app.js
├── data/                   # Auto-created CSV files (git-ignored)
│   ├── workouts.csv
│   ├── nutrition.csv
│   ├── sleep.csv
│   └── weight.csv
└── README.md
```

---

## Quick Start

### 1. Backend (Python + Flask)

```bash
cd backend

# Create & activate virtualenv
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
# → Running on http://localhost:5000
```

### 2. Frontend

Open `frontend/index.html` in your browser directly, **or** serve it:

```bash
# Option A — Python simple server (from frontend/)
cd frontend
python -m http.server 3000
# → Open http://localhost:3000

# Option B — VS Code Live Server extension (recommended)
# Right-click index.html → "Open with Live Server"
```

---

## REST API Reference

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/workouts` | List all workouts |
| POST   | `/api/workouts` | Add workout |
| DELETE | `/api/workouts/<id>` | Delete workout |

**POST body:**
```json
{
  "date": "2024-06-15",
  "type": "Running",
  "duration_min": 45,
  "calories": 380,
  "notes": "Morning run in the park"
}
```

### Nutrition
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/nutrition` | List all meals |
| POST   | `/api/nutrition` | Log a meal |
| DELETE | `/api/nutrition/<id>` | Delete meal |

**POST body:**
```json
{
  "date": "2024-06-15",
  "meal": "Lunch",
  "calories": 650,
  "protein_g": 42,
  "carbs_g": 75,
  "fat_g": 18
}
```

### Sleep
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/sleep` | List all sleep logs |
| POST   | `/api/sleep` | Log sleep |
| DELETE | `/api/sleep/<id>` | Delete entry |

### Weight
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/weight` | List all weight entries |
| POST   | `/api/weight` | Log weight (BMI auto-calculated) |
| DELETE | `/api/weight/<id>` | Delete entry |

### Stats (NumPy analytics)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/stats` | Aggregated analytics (mean, std, trend) |

**Stats response includes:**
- Workout: total sessions, total calories, avg duration, streak days, by-type breakdown
- Nutrition: avg daily calories, avg protein
- Sleep: avg hours, std deviation (sleep consistency)
- Weight: latest kg/BMI, **linear regression trend** (kg per entry via `np.polyfit`)

---

## Data Storage

All data is stored as **CSV files** in the `data/` folder:

| File | Columns |
|------|---------|
| `workouts.csv` | id, date, type, duration_min, calories, notes |
| `nutrition.csv` | id, date, meal, calories, protein_g, carbs_g, fat_g |
| `sleep.csv` | id, date, hours, quality, notes |
| `weight.csv` | id, date, weight_kg, bmi |

CSVs are created automatically on first run. You can open them in Excel, Google Sheets, or any data tool.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Flask 3.x |
| Data processing | Pandas 2.x + NumPy |
| Storage | CSV files (via Pandas) |
| Analytics | NumPy (mean, std, polyfit regression) |
| Frontend | Vanilla JS (ES2020+) |
| Charts | Chart.js 4 |
| Styling | Pure CSS (no framework) |

---

## Extending the Project

**Add authentication:** Flask-Login + a `users.csv`  
**Add data export:** `df.to_excel()` or `df.to_json()` endpoint  
**Add charts by date range:** Filter DataFrame with `df[df['date'].between(start, end)]`  
**Add a goals system:** Store targets in `goals.csv`, compare with current stats  
**Deploy:** Gunicorn + Nginx for the backend; Netlify/Vercel for the frontend

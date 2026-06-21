from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

WORKOUTS_CSV = os.path.join(DATA_DIR, 'workouts.csv')
NUTRITION_CSV = os.path.join(DATA_DIR, 'nutrition.csv')
SLEEP_CSV     = os.path.join(DATA_DIR, 'sleep.csv')
WEIGHT_CSV    = os.path.join(DATA_DIR, 'weight.csv')

SCHEMAS = {
    WORKOUTS_CSV:  ['id','date','type','duration_min','calories','notes'],
    NUTRITION_CSV: ['id','date','meal','calories','protein_g','carbs_g','fat_g'],
    SLEEP_CSV:     ['id','date','hours','bed_time','quality','notes'],
    WEIGHT_CSV:    ['id','date','weight_kg','bmi'],
}

def load_csv(path):
    cols = SCHEMAS[path]
    if not os.path.exists(path):
        df = pd.DataFrame(columns=cols)
        df.to_csv(path, index=False)
        return df
    df = pd.read_csv(path)
    for c in cols:
        if c not in df.columns:
            df[c] = np.nan
    return df[cols]

def save_csv(df, path):
    df.to_csv(path, index=False)

def next_id(df):
    if df.empty or df['id'].isnull().all():
        return 1
    return int(df['id'].max()) + 1


# ─── WORKOUTS ─────────────────────────────────────────────────────────────────

@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    df = load_csv(WORKOUTS_CSV)
    return jsonify(df.fillna('').to_dict(orient='records'))

@app.route('/api/workouts', methods=['POST'])
def add_workout():
    data = request.json
    df = load_csv(WORKOUTS_CSV)
    row = {
        'id':           next_id(df),
        'date':         data.get('date', datetime.today().strftime('%Y-%m-%d')),
        'type':         data.get('type', ''),
        'duration_min': float(data.get('duration_min', 0)),
        'calories':     float(data.get('calories', 0)),
        'notes':        data.get('notes', ''),
    }
    df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    save_csv(df, WORKOUTS_CSV)
    return jsonify(row), 201

@app.route('/api/workouts/<int:wid>', methods=['DELETE'])
def delete_workout(wid):
    df = load_csv(WORKOUTS_CSV)
    df = df[df['id'] != wid]
    save_csv(df, WORKOUTS_CSV)
    return jsonify({'deleted': wid})


# ─── NUTRITION ────────────────────────────────────────────────────────────────

@app.route('/api/nutrition', methods=['GET'])
def get_nutrition():
    df = load_csv(NUTRITION_CSV)
    return jsonify(df.fillna('').to_dict(orient='records'))

@app.route('/api/nutrition', methods=['POST'])
def add_nutrition():
    data = request.json
    df = load_csv(NUTRITION_CSV)
    row = {
        'id':        next_id(df),
        'date':      data.get('date', datetime.today().strftime('%Y-%m-%d')),
        'meal':      data.get('meal', ''),
        'calories':  float(data.get('calories', 0)),
        'protein_g': float(data.get('protein_g', 0)),
        'carbs_g':   float(data.get('carbs_g', 0)),
        'fat_g':     float(data.get('fat_g', 0)),
    }
    df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    save_csv(df, NUTRITION_CSV)
    return jsonify(row), 201

@app.route('/api/nutrition/<int:nid>', methods=['DELETE'])
def delete_nutrition(nid):
    df = load_csv(NUTRITION_CSV)
    df = df[df['id'] != nid]
    save_csv(df, NUTRITION_CSV)
    return jsonify({'deleted': nid})


# ─── SLEEP ────────────────────────────────────────────────────────────────────

@app.route('/api/sleep', methods=['GET'])
def get_sleep():
    df = load_csv(SLEEP_CSV)
    return jsonify(df.fillna('').to_dict(orient='records'))

@app.route('/api/sleep', methods=['POST'])
def add_sleep():
    data = request.json
    df = load_csv(SLEEP_CSV)
    row = {
        'id':       next_id(df),
        'date':     data.get('date', datetime.today().strftime('%Y-%m-%d')),
        'hours':    float(data.get('hours', 0)),
        'bed_time': data.get('bedtime', datetime.now().strftime('%H:%M')),  # fixed
        'quality':  data.get('quality', 'Good'),
        'notes':    data.get('notes', ''),
    }
    df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    save_csv(df, SLEEP_CSV)
    return jsonify(row), 201

@app.route('/api/sleep/<int:sid>', methods=['DELETE'])
def delete_sleep(sid):
    df = load_csv(SLEEP_CSV)
    df = df[df['id'] != sid]
    save_csv(df, SLEEP_CSV)
    return jsonify({'deleted': sid})


# ─── WEIGHT ───────────────────────────────────────────────────────────────────

@app.route('/api/weight', methods=['GET'])
def get_weight():
    df = load_csv(WEIGHT_CSV)
    return jsonify(df.fillna('').to_dict(orient='records'))

@app.route('/api/weight', methods=['POST'])
def add_weight():
    data = request.json
    df = load_csv(WEIGHT_CSV)
    weight_kg = float(data.get('weight_kg', 0))
    height_m  = float(data.get('height_m', 1.70))
    bmi = round(weight_kg / (height_m ** 2), 1) if height_m > 0 else 0
    row = {
        'id':        next_id(df),
        'date':      data.get('date', datetime.today().strftime('%Y-%m-%d')),
        'weight_kg': weight_kg,
        'bmi':       bmi,
    }
    df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    save_csv(df, WEIGHT_CSV)
    return jsonify(row), 201

@app.route('/api/weight/<int:wid>', methods=['DELETE'])
def delete_weight(wid):
    df = load_csv(WEIGHT_CSV)
    df = df[df['id'] != wid]
    save_csv(df, WEIGHT_CSV)
    return jsonify({'deleted': wid})


# ─── STATS (NumPy-powered analytics) ─────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
def get_stats():
    workouts  = load_csv(WORKOUTS_CSV)
    nutrition = load_csv(NUTRITION_CSV)
    sleep_df  = load_csv(SLEEP_CSV)
    weight_df = load_csv(WEIGHT_CSV)

    def safe(arr, fn):
        a = arr.dropna().astype(float)
        return round(float(fn(a.values)), 2) if len(a) else 0

    # Workout stats
    w_cals  = workouts['calories'].dropna().astype(float)
    w_dur   = workouts['duration_min'].dropna().astype(float)
    workout_types = workouts['type'].value_counts().to_dict() if not workouts.empty else {}

    # Weekly workout streak using numpy
    streak = 0
    if not workouts.empty:
        dates = pd.to_datetime(workouts['date']).dt.date.unique()
        dates = np.sort(dates)[::-1]
        today = datetime.today().date()
        for d in dates:
            diff = (today - d).days
            if diff <= streak + 1:
                streak = diff + 1
            else:
                break

    # Nutrition
    n_cals    = nutrition['calories'].dropna().astype(float)
    n_protein = nutrition['protein_g'].dropna().astype(float)

    # Sleep
    s_hours = sleep_df['hours'].dropna().astype(float)

    # Weight trend (linear regression via numpy)
    weight_trend = None
    if len(weight_df) >= 2:
        wdf = weight_df.dropna(subset=['weight_kg']).copy()
        wdf['date'] = pd.to_datetime(wdf['date'])
        wdf = wdf.sort_values('date')
        x = np.arange(len(wdf))
        y = wdf['weight_kg'].astype(float).values
        coef = np.polyfit(x, y, 1)
        weight_trend = round(float(coef[0]), 3)  # kg per entry

    return jsonify({
        'workouts': {
            'total_sessions': len(workouts),
            'total_calories_burned': safe(w_cals, np.sum),
            'avg_duration_min':      safe(w_dur,  np.mean),
            'max_calories_session':  safe(w_cals, np.max),
            'streak_days': int(streak),
            'by_type': workout_types,
        },
        'nutrition': {
            'total_entries':     len(nutrition),
            'avg_daily_calories': safe(n_cals,    np.mean),
            'avg_protein_g':      safe(n_protein, np.mean),
            'max_calories_meal':  safe(n_cals,    np.max),
        },
        'sleep': {
            'total_entries':  len(sleep_df),
            'avg_hours':      safe(s_hours, np.mean),
            'min_hours':      safe(s_hours, np.min),
            'max_hours':      safe(s_hours, np.max),
            'std_hours':      safe(s_hours, np.std),
        },
        'weight': {
            'latest_kg':   float(weight_df['weight_kg'].iloc[-1]) if not weight_df.empty else None,
            'latest_bmi':  float(weight_df['bmi'].iloc[-1]) if not weight_df.empty else None,
            'trend_kg_per_entry': weight_trend,
        }
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)

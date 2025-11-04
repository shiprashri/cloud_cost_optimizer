# backend/db.py
import sqlite3, datetime

def init_db():
    conn = sqlite3.connect("optimizer.db")
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        cpu_next REAL,
        memory_next REAL,
        storage_next REAL,
        cost_next REAL
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction_id INTEGER,
        suggestion_text TEXT
    )""")
    conn.commit()
    conn.close()

def save_results(preds, recs):
    conn = sqlite3.connect("optimizer.db")
    c = conn.cursor()
    ts = datetime.datetime.now().isoformat()
    c.execute("INSERT INTO predictions (timestamp, cpu_next, memory_next, storage_next, cost_next) VALUES (?, ?, ?, ?, ?)",
              (ts, preds["cpu_usage_next"], preds["memory_usage_next"], preds["storage_usage_next"], preds["cost_next"]))
    pid = c.lastrowid
    for r in recs:
        c.execute("INSERT INTO recommendations (prediction_id, suggestion_text) VALUES (?, ?)", (pid, r))
    conn.commit()
    conn.close()

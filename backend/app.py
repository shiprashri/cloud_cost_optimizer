from flask import Flask, request, jsonify, send_from_directory, send_file
import os
import io
import csv
import sqlite3
import datetime
from flask_cors import CORS
from model import train_cost_model, predict_cost
from db import init_db, save_results

# ----------------- APP SETUP -----------------
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Initialize database & model
init_db()
print("✅ Model ready for predictions!")

# ----------------- FRONTEND ROUTES -----------------
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/cost_estimator')
def cost_estimator_page():
    return send_from_directory('../frontend', 'cost_estimator.html')

@app.route('/report')
def report_page():
    return send_from_directory('../frontend', 'report.html')

@app.route('/dashboard')
def dashboard_page():
    return send_from_directory('../frontend', 'dashboard.html')

# ----------------- API ROUTES -----------------

# ✅ Predict Cost
@app.route('/predict_cost', methods=['POST'])
def estimate_cost():
    try:
        data = request.get_json()

        # Extract input values
        cpu = float(data.get("cpu", 0))
        memory = float(data.get("memory", 0))
        storage = float(data.get("storage", 0))
        hours_used = float(data.get("hours_used", 0))
        instance_type = data.get("instance_type", "general")
        region = data.get("region", "us-east-1")
        usage_type = data.get("usage_type", "on-demand")
        storage_type = data.get("storage_type", "ssd")
        service_tier = data.get("service_tier", "standard")
        network_in = float(data.get("network_in", 0))
        network_out = float(data.get("network_out", 0))
        idle_time = float(data.get("idle_time", 0))

        # Predict cost using model
        cost = predict_cost(cpu, memory, storage, hours_used,
                            instance_type, region, network_in, network_out,
                            storage_type, usage_type, service_tier, idle_time)

        preds = {
            "cpu_usage_next": cpu,
            "memory_usage_next": memory,
            "storage_usage_next": storage,
            "cost_next": cost
        }

        recs = [
            "Optimize CPU allocation for better cost.",
            "Use reserved instances for predictable workloads.",
            "Clean up unused storage to save cost."
        ]
        save_results(preds, recs)

        return jsonify({"estimated_cost": cost})
    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"error": str(e)})

# ✅ Dashboard data
@app.route('/dashboard-data')
def dashboard_data():
    conn = sqlite3.connect("optimizer.db")
    c = conn.cursor()

    c.execute("""
        SELECT COUNT(*), AVG(cost_next), AVG(cpu_next), AVG(memory_next), AVG(storage_next)
        FROM predictions
    """)
    total, avg_cost, avg_cpu, avg_memory, avg_storage = c.fetchone() or (0, 0, 0, 0, 0)

    c.execute("SELECT cost_next FROM predictions ORDER BY id DESC LIMIT 1")
    last_pred = c.fetchone()
    last_pred = last_pred[0] if last_pred else 0

    c.execute("""
        SELECT timestamp, cost_next 
        FROM predictions 
        ORDER BY id DESC LIMIT 10
    """)
    rows = c.fetchall()
    conn.close()

    trend = [{"timestamp": r[0], "cost": r[1]} for r in reversed(rows)]

    return jsonify({
        "summary": {
            "total_records": total,
            "avg_cost": round(avg_cost or 0, 2),
            "avg_cpu": round(avg_cpu or 0, 2),
            "avg_memory": round(avg_memory or 0, 2),
            "avg_storage": round(avg_storage or 0, 2),
            "last_prediction": round(last_pred or 0, 2)
        },
        "trend": trend
    })

# ✅ Optimization Insights
@app.route('/optimize')
def optimize():
    conn = sqlite3.connect("optimizer.db")
    c = conn.cursor()

    c.execute("""
        SELECT AVG(cpu_next), AVG(memory_next), AVG(storage_next), AVG(cost_next)
        FROM predictions
    """)
    avg_cpu, avg_mem, avg_storage, avg_cost = c.fetchone() or (0, 0, 0, 0)
    conn.close()

    efficiency = max(50, min(100, 100 - (avg_cpu * 0.3 + avg_mem * 0.1)))
    tips = []
    if avg_cpu > 80:
        tips.append("High CPU detected — consider smaller instance types.")
    if avg_mem > 16:
        tips.append("Memory usage is high — try optimized storage tiers.")
    if avg_storage > 100:
        tips.append("Archive infrequently used data to S3 Glacier.")
    if not tips:
        tips = ["System performance looks balanced — keep monitoring usage."]

    return jsonify({
        "best_region": "us-east-1" if avg_cost < 10 else "us-west-2",
        "best_instance": "t3.medium" if avg_cpu < 70 else "t3.large",
        "efficiency_score": round(efficiency, 1),
        "tips": tips
    })

# ✅ Report Data
@app.route('/report-data')
def report_data():
    conn = sqlite3.connect("optimizer.db")
    c = conn.cursor()
    c.execute("""
        SELECT timestamp, cpu_next, memory_next, storage_next, cost_next 
        FROM predictions 
        ORDER BY id DESC LIMIT 10
    """)
    rows = c.fetchall()
    conn.close()

    data = [
        {"timestamp": r[0], "cpu": r[1], "memory": r[2], "storage": r[3], "cost": r[4]}
        for r in rows
    ]
    return jsonify(data)

# ✅ Save Estimation History
@app.route('/save_history', methods=['POST'])
def save_history():
    try:
        data = request.get_json()
        conn = sqlite3.connect("optimizer.db")
        c = conn.cursor()
        c.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            cpu REAL,
            memory REAL,
            storage REAL,
            hours_used REAL,
            instance_type TEXT,
            region TEXT,
            usage_type TEXT,
            storage_type TEXT,
            service_tier TEXT,
            estimated_cost REAL
        )
        """)
        c.execute("""
        INSERT INTO history (timestamp, cpu, memory, storage, hours_used, instance_type, region, usage_type, storage_type, service_tier, estimated_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data["cpu"],
            data["memory"],
            data["storage"],
            data["hours_used"],
            data["instance_type"],
            data["region"],
            data["usage_type"],
            data["storage_type"],
            data["service_tier"],
            data["estimated_cost"]
        ))
        conn.commit()
        conn.close()
        return jsonify({"message": "Record saved successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)})

# ✅ Fetch Estimation History
@app.route('/get_history')
def get_history():
    conn = sqlite3.connect("optimizer.db")
    c = conn.cursor()
    c.execute("SELECT * FROM history ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()

    data = [
        {
            "timestamp": r[1],
            "cpu": r[2],
            "memory": r[3],
            "storage": r[4],
            "hours_used": r[5],
            "instance_type": r[6],
            "region": r[7],
            "usage_type": r[8],
            "storage_type": r[9],
            "service_tier": r[10],
            "estimated_cost": r[11]
        }
        for r in rows
    ]
    return jsonify(data)

# ✅ Download Report (CSV)
@app.route("/download_report")
def download_report():
    try:
        conn = sqlite3.connect("optimizer.db")
        c = conn.cursor()
        c.execute("""
            SELECT timestamp, cpu_next, memory_next, storage_next, cost_next
            FROM predictions
            ORDER BY id DESC LIMIT 100
        """)
        rows = c.fetchall()
        conn.close()

        # Create in-memory CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Timestamp", "CPU (%)", "Memory (GB)", "Storage (GB)", "Cost ($)"])
        for r in rows:
            writer.writerow([r[0], r[1], r[2], r[3], r[4]])

        output.seek(0)
        mem = io.BytesIO(output.getvalue().encode("utf-8"))
        mem.seek(0)

        filename = f"report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return send_file(
            mem,
            mimetype="text/csv",
            as_attachment=True,
            download_name=filename  # ✅ Updated for Flask 2.x+
        )

    except Exception as e:
        print("❌ Report Download Error:", str(e))
        return jsonify({"error": str(e)})

# ----------------- RUN APP -----------------
if __name__ == '__main__':
    app.run(debug=True)

# File: backend/train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
import joblib
import os

# Load dataset
data_path = r"C:\cloud_optimizer\backend\cloud_usage.xlsx"
data = pd.read_excel(data_path)

# Select features and target
X = data[['memory_usage', 'cpu_usage', 'storage_usage']]
y = data['cost']

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("R2 Score:", r2_score(y_test, y_pred))
print("MAE:", mean_absolute_error(y_test, y_pred))

# Save model
os.makedirs(r"C:\cloud_optimizer\backend\model", exist_ok=True)
joblib.dump(model, r"C:\cloud_optimizer\backend\model\rf_model.joblib")

print("✅ Model trained and saved successfully!")

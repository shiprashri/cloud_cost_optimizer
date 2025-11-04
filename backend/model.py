import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import os

MODEL_PATH = "cost_model.pkl"
DATASET_PATH = "cloud_usage_dataset_v2.csv"

def train_cost_model():
    if not os.path.exists(DATASET_PATH):
        print("❌ Dataset not found at:", DATASET_PATH)
        return

    print(f"✅ Found dataset: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    df.columns = df.columns.str.strip().str.lower()

    required_cols = [
        'cpu', 'memory', 'storage', 'hours_used', 'instance_type', 'region',
        'network_in', 'network_out', 'storage_type', 'usage_type', 
        'service_tier', 'idle_time', 'total_cost'
    ]

    if not all(col in df.columns for col in required_cols):
        print("❌ Missing required columns. Found:", list(df.columns))
        return

    X = df.drop(columns=['total_cost', 'optimization_flag'], errors='ignore')
    y = df['total_cost']

    numeric_features = [
        'cpu', 'memory', 'storage', 'hours_used', 
        'network_in', 'network_out', 'idle_time'
    ]
    categorical_features = [
        'instance_type', 'region', 'storage_type', 'usage_type', 'service_tier'
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )

    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', LinearRegression())
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model.fit(X_train, y_train)
    joblib.dump(model, MODEL_PATH)
    print("✅ Model trained and saved successfully using all features.")

def predict_cost(cpu, memory, storage, hours_used, instance_type, region,
                 network_in, network_out, storage_type, usage_type,
                 service_tier, idle_time):

    if not os.path.exists(MODEL_PATH):
        print("⚠️ Model not found. Training a new one...")
        train_cost_model()

    model = joblib.load(MODEL_PATH)

    # Prepare input row
    data = pd.DataFrame([{
        'cpu': cpu,
        'memory': memory,
        'storage': storage,
        'hours_used': hours_used,
        'instance_type': instance_type,
        'region': region,
        'network_in': network_in,
        'network_out': network_out,
        'storage_type': storage_type,
        'usage_type': usage_type,
        'service_tier': service_tier,
        'idle_time': idle_time
    }])

    try:
        prediction = model.predict(data)[0]
        return round(prediction, 2)
    except Exception as e:
        print("⚠️ Prediction failed:", str(e))
        return 0.0

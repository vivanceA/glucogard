from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from pathlib import Path

# Load trained model
model_path = Path(__file__).resolve().parent / "diabetes_model.pkl"
model_components = joblib.load(model_path)
model = model_components["best_model"]
scaler = model_components["scaler"]

import pandas as pd

# Define request schema
class DiabetesInput(BaseModel):
    age: float
    bmi: float
    weight: float
    height: float
    systolic_bp: float
    family_history: int
    physical_activity: int
    diet_quality: float
    location: int
    smoking: int

app = FastAPI()

@app.post("/predict-risk")
def predict_risk(data: DiabetesInput):
    patient_data = pd.DataFrame([data.dict()])

    # Preprocess the data
    patient_data['bmi_category'] = pd.cut(patient_data['bmi'],
                                         bins=[0, 18.5, 25, 30, 100],
                                         labels=[0, 1, 2, 3])
    patient_data['bmi_category'] = patient_data['bmi_category'].cat.add_categories(-1).fillna(-1).astype(int)


    patient_data['age_group'] = pd.cut(patient_data['age'],
                                      bins=[0, 30, 45, 60, 100],
                                      labels=[0, 1, 2, 3])
    patient_data['age_group'] = patient_data['age_group'].cat.add_categories(-1).fillna(-1).astype(int)

    # Select features
    feature_columns = ['age', 'bmi', 'weight', 'height', 'systolic_bp',
                      'family_history', 'physical_activity', 'diet_quality',
                      'location', 'smoking', 'bmi_category', 'age_group']
    X_patient = patient_data[feature_columns]


    scaled_features = scaler.transform(X_patient)
    prediction = model.predict(scaled_features)[0]
    probability = model.predict_proba(scaled_features)[0]
    
    risk_category_keys = ['non-diabetic', 'low', 'moderate', 'high', 'critical']
    risk_category_display = ['Non-diabetic', 'Low Risk', 'Moderate Risk', 'High Risk', 'Critical Risk']
    
    return {
        "risk_category": risk_category_keys[prediction],
        "risk_level": int(prediction),
        "probabilities": {risk_category_display[i]: float(prob) for i, prob in enumerate(probability)}
    }

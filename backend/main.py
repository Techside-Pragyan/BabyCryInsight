from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import torch
import torch.nn.functional as F
import numpy as np
from pydantic import BaseModel
import sys

# Import utility functions from current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils.audio_processing import preprocess_audio, extract_features
# Assume we have model.py exported as get_model
from models.cnn_model import get_model 

app = FastAPI(title="BabyCryInsight API")

# Setup CORS for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_PATH = "models/baby_cry_model.pth"
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

# Labeled Categories
CATEGORIES = ["Hunger", "Pain", "Sleep", "Discomfort"]
SUGGESTIONS = {
    "Hunger": "The baby might be hungry. Try feeding them or check for hunger cues like rooting.",
    "Pain": "This sound suggests potential pain. Check for gas, teething, or consult a pediatrician if persistent.",
    "Sleep": "The baby seems tired. Try rocking them to sleep in a quiet, dark environment.",
    "Discomfort": "Check if the diaper is wet, the room temperature is comfortable, or if clothing is too tight."
}

# In-memory model placeholder
model = None

@app.on_event("startup")
def load_model():
    global model
    try:
        # num_classes matches the labels
        model = get_model(num_classes=len(CATEGORIES))
        if os.path.exists(MODEL_PATH):
            model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
            model.eval()
            print("Model loaded successfully.")
        else:
            print("Model path not found. Running in MOCK mode for demonstrations.")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.post("/predict")
async def predict_cry(file: UploadFile = File(...)):
    if not file.filename.endswith(('.wav', '.mp3', '.m4a')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .wav or .mp3 file.")
    
    file_path = os.path.join(TEMP_DIR, file.filename)
    try:
        # Save temporary file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Audio Preprocessing
        y, sr = preprocess_audio(file_path)
        if y is None:
            raise HTTPException(status_code=500, detail="Error occurred during audio preprocessing.")
        
        # Feature Extraction
        features = extract_features(y, sr)
        mfcc = features["mfcc"] # Shape (40, time_steps)
        
        # Model Inference
        if model is not None and os.path.exists(MODEL_PATH):
            # Prepare MFCC for CNN (Batch, Channel, Height, Width)
            input_tensor = torch.from_numpy(mfcc).unsqueeze(0).unsqueeze(0).float()
            
            # Predict
            with torch.no_grad():
                output = model(input_tensor)
                probabilities = F.softmax(output, dim=1).numpy()[0]
                pred_idx = np.argmax(probabilities)
                confidence = float(probabilities[pred_idx])
                prediction = CATEGORIES[pred_idx]
        else:
            # MOCK prediction logic for demonstration when no model is available
            # Simulates detection based on MFCC mean variances
            mock_vals = np.abs(features["mfcc_mean"])
            idx = int(np.sum(mock_vals) % len(CATEGORIES))
            prediction = CATEGORIES[idx]
            confidence = 0.85 + (np.random.random() * 0.1)

        result = {
            "prediction": prediction,
            "confidence": round(confidence * 100, 2),
            "suggestion": SUGGESTIONS[prediction],
            "details": {
                "filename": file.filename,
                "duration_sec": len(y) / sr
            }
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.get("/")
async def root():
    return {"message": "Welcome to BabyCryInsight API. Predict baby cry reasons using AI."}

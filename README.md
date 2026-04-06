# BabyCryInsight: AI-Powered Baby Cry Reason Detection

BabyCryInsight is a deep learning-based system designed to analyze infant crying audio and predict the underlying reason (Hunger, Pain, Sleep, or Discomfort).

## 🚀 Features
- **Audio Processing**: Noise reduction, normalization, and feature extraction (MFCC, Mel Spectrogram).
- **AI Classification**: CNN-based classification of baby cry reasons.
- **RESTful API**: Fast and scalable FastAPI backend for real-time inference.
- **Frontend Dashboard**: A clean and interactive React.js UI for audio uploads and result visualization.
- **Actionable Insights**: Provides suggestions on how to care for the baby based on the cry reason.

## 📁 Project Structure
- `backend/`: FastAPI server, audio processing utilities, and AI models.
- `frontend/`: React components and UI code.
- `data/`: Folder to store datasets like [Donate-A-Cry](https://www.kaggle.com/datasets/vsharma/donateacry-corpus).
- `models/`: Pre-trained weights and model definitions.
- `scripts/`: Python scripts for training and large-scale data preprocessing.

## 🛠 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js & npm
- FFmpeg (for `librosa` audio loading)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. (Optional) Train the model:
   - Place your dataset in `data/labeled_cries`.
   - Run the training script:
     ```bash
     python ../scripts/train.py
     ```
4. Start the API server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🧠 How It Works
1. **Feature Extraction**: Extracts 40 MFCC features from the input audio using `librosa`.
2. **Preprocessing**: Normalizes audio and trims silence to focus on relevant sound.
3. **Model**: A Convolutional Neural Network (CNN) architecture trained on labeled infant cry categories.
4. **Prediction**: Returns the predicted category with a confidence score and suggested actions.

## 📊 Dataset Reference
We recommend using the following datasets for training:
- **[Donate-A-Cry Corpus](https://github.com/gveres/donateacry-corpus)**: A volunteer-led dataset of infant cries.
- **Kaggle**: Search for "infant-cry-classification" for pre-processed CSV/WAV files.

## 📜 License
MIT License

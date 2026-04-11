import os
import librosa
import numpy as np
import pandas as pd
from tqdm import tqdm
import sys

# Add project root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.utils.audio_processing import preprocess_audio, extract_features

def prepare_dataset(data_dir, output_file="data/processed_features.npy"):
    """
    Scans a directory of labeled audio files and extracts features for training.
    Expected folder structure:
    /data/hunger/*.wav
    /data/pain/*.wav
    ...
    """
    features = []
    labels = []
    classes = ["hunger", "pain", "sleep", "discomfort"]
    class_map = {name: i for i, name in enumerate(classes)}

    if not os.path.exists(data_dir):
        print(f"Directory {data_dir} not found. Please create it and add audio files.")
        return

    for category in classes:
        cat_dir = os.path.join(data_dir, category)
        if not os.path.exists(cat_dir):
            continue
            
        print(f"Processing category: {category}")
        for filename in tqdm(os.listdir(cat_dir)):
            if filename.endswith(('.wav', '.mp3')):
                file_path = os.path.join(cat_dir, filename)
                try:
                    # Preprocess and extract
                    y, sr = preprocess_audio(file_path)
                    f_dict = extract_features(y, sr)
                    
                    # Store MFCC features
                    features.append(f_dict["mfcc"])
                    labels.append(class_map[category])
                except Exception as e:
                    print(f"Error processing {filename}: {e}")

    if features:
        X = np.array(features)
        X = X.reshape(X.shape[0], 1, X.shape[1], X.shape[2]) # Add channel dim
        y = np.array(labels)
        
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        np.save(output_file, {"X": X, "y": y})
        print(f"Saved {len(X)} samples to {output_file}")
    else:
        print("No audio files found to process.")

if __name__ == "__main__":
    # Example usage
    prepare_dataset("data/raw")
吐

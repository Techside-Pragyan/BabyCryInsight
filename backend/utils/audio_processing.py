import librosa
import numpy as np
import soundfile as sf
import os

def preprocess_audio(file_path, target_sr=22050, duration=5):
    """
    Load an audio file, normalize it, trim silence, and pad/truncate to a fixed duration.
    """
    try:
        # Load audio
        y, sr = librosa.load(file_path, sr=target_sr)

        # Noise reduction (simple thresholding)
        y_trimmed, _ = librosa.effects.trim(y, top_db=20)

        # Normalization
        y_norm = librosa.util.normalize(y_trimmed)

        # Pad or truncate to fixed duration
        target_samples = target_sr * duration
        if len(y_norm) > target_samples:
            y_final = y_norm[:target_samples]
        else:
            y_final = np.pad(y_norm, (0, target_samples - len(y_norm)), mode='constant')
        
        return y_final, target_sr
    except Exception as e:
        print(f"Error processing audio: {e}")
        return None, None

def extract_features(y, sr):
    """
    Extract MFCC, Spectrogram, and Chroma features.
    """
    # MFCC (Mel-Frequency Cepstral Coefficients)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    
    # Mel Spectrogram
    mel_spectrogram = librosa.feature.melspectrogram(y=y, sr=sr)
    mel_db = librosa.power_to_db(mel_spectrogram, ref=np.max)
    
    # Chroma STFT
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    
    # Return features as a single vector or dictionary
    return {
        "mfcc": mfccs,
        "mel_db": mel_db,
        "chroma": chroma,
        "mfcc_mean": np.mean(mfccs.T, axis=0) # Mean MFCC for simple models
    }

def save_preprocessed_audio(y, sr, output_path):
    sf.write(output_path, y, sr)

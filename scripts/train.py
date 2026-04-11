import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import os
import sys

# Add project root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.models.cnn_model import get_model

class BabyCryDataset(Dataset):
    """
    Custom Dataset to handle pre-extracted MFCC features.
    Expects data in format: (num_samples, 1, 40, time_steps)
    """
    def __init__(self, X, y):
        self.X = torch.from_numpy(X).float()
        self.y = torch.from_numpy(y).long()

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

def train_model(epochs=10, batch_size=32, lr=0.001):
    print("--- BabyCryInsight Training Started ---")
    
    # 1. Dataset Setup
    # Typically you would load files and extract MFCCs here.
    # We will generate dummy data for demonstration if no dataset is found.
    num_samples = 100
    classes = 4 # Hunger, Pain, Sleep, Discomfort
    
    # Simulate MFCC features (40 Mel bands over 5 seconds @ 22kHz ≈ 216 time steps)
    X_dummy = np.random.randn(num_samples, 1, 40, 216)
    y_dummy = np.random.randint(0, classes, size=num_samples)
    
    dataset = BabyCryDataset(X_dummy, y_dummy)
    train_loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # 2. Model, Loss, Optimizer
    model = get_model(num_classes=classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    # 3. Training Loop
    model.train()
    for epoch in range(epochs):
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in train_loader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        print(f"Epoch [{epoch+1}/{epochs}] Loss: {running_loss/len(train_loader):.4f} Accuracy: {100 * correct / total:.2f}%")

    # 4. Save Model Weights
    save_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'models', 'baby_cry_model.pth')
    torch.save(model.state_dict(), save_path)
    print(f"--- Training Complete. Model saved to {save_path} ---")

if __name__ == "__main__":
    # Ensure backend/models/ folder exists
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'backend', 'models'), exist_ok=True)
    train_model(epochs=5)

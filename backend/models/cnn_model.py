import torch
import torch.nn as nn
import torch.nn.functional as F

class InfantCryCNN(nn.Module):
    def __init__(self, num_classes=4):
        super(InfantCryCNN, self).__init__()
        
        # 1. First Convolutional Block
        self.conv1 = nn.Conv2d(1, 32, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(kernel_size=(2, 2))
        
        # 2. Second Convolutional Block
        self.conv2 = nn.Conv2d(32, 64, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(kernel_size=(2, 2))
        
        # 3. Third Convolutional Block
        self.conv3 = nn.Conv2d(64, 128, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1))
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(kernel_size=(2, 2))
        
        # 4. Dense (Fully Connected) Layers
        # Input shape depends on the spectrogram dimensions (target_sr=22050, duration=5s)
        # With default settings, MFCC output for 5s is approx (1, 40, 216)
        # After 3 MaxPool ops: (1, 5, 27) (assuming downsampling by factor of 2^3 = 8)
        self.flatten_dim = 128 * 5 * 27  # Example calculation for 5s duration
        self.fc1 = nn.Linear(self.flatten_dim, 256)
        self.dropout = nn.Dropout(0.5)
        self.fc2 = nn.Linear(256, num_classes)

    def forward(self, x):
        # x is (batch, 1, 40, time_steps)
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.pool1(x)
        
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool2(x)
        
        x = F.relu(self.bn3(self.conv3(x)))
        x = self.pool3(x)
        
        x = x.view(x.size(0), -1) # Flatten
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x

def get_model(num_classes=4):
    return InfantCryCNN(num_classes=num_classes)

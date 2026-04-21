import os
import shutil
import random
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader

# --- CONFIGURATION ---
SOURCE_DIR = "/Users/aayu/.cache/kagglehub/datasets/ai4a-lab/comprehensive-soil-classification-datasets/versions/1/CyAUG-Dataset"
DATA_DIR = "backend/data/training_data"
BATCH_SIZE = 32
NUM_EPOCHS = 10
LEARNING_RATE = 0.001

# Detect Device
if torch.backends.mps.is_available():
    DEVICE = torch.device("mps")
    print("Using Apple Silicon GPU (MPS)")
elif torch.cuda.is_available():
    DEVICE = torch.device("cuda")
    print("Using NVIDIA GPU (CUDA)")
else:
    DEVICE = torch.device("cpu")
    print("Using CPU")

def prepare_data():
    """Splits flat Kaggle folders into train/val structure."""
    if os.path.exists(DATA_DIR):
        shutil.rmtree(DATA_DIR)
    
    for split in ['train', 'val']:
        os.makedirs(os.path.join(DATA_DIR, split), exist_ok=True)

    classes = [d for d in os.listdir(SOURCE_DIR) if os.path.isdir(os.path.join(SOURCE_DIR, d))]
    print(f"Found classes: {classes}")

    for cls in classes:
        os.makedirs(os.path.join(DATA_DIR, 'train', cls), exist_ok=True)
        os.makedirs(os.path.join(DATA_DIR, 'val', cls), exist_ok=True)

        cls_path = os.path.join(SOURCE_DIR, cls)
        images = [f for f in os.listdir(cls_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        random.shuffle(images)

        split_idx = int(len(images) * 0.8)
        train_imgs = images[:split_idx]
        val_imgs = images[split_idx:]

        for img in train_imgs:
            shutil.copy(os.path.join(cls_path, img), os.path.join(DATA_DIR, 'train', cls, img))
        for img in val_imgs:
            shutil.copy(os.path.join(cls_path, img), os.path.join(DATA_DIR, 'val', cls, img))

    print(f"Data preparation complete at {DATA_DIR}")

def train_soil_classifier():
    prepare_data()
    
    # 1. Pipeline
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize(256), transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    image_datasets = {x: datasets.ImageFolder(os.path.join(DATA_DIR, x), data_transforms[x])
                      for x in ['train', 'val']}
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=BATCH_SIZE, shuffle=True)
                   for x in ['train', 'val']}
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'val']}
    class_names = image_datasets['train'].classes

    # 2. Model
    model = models.resnet18(pretrained=True)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, len(class_names))
    model = model.to(DEVICE)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # 3. Training
    best_acc = 0.0
    for epoch in range(NUM_EPOCHS):
        print(f'Epoch {epoch}/{NUM_EPOCHS - 1}')
        for phase in ['train', 'val']:
            model.train() if phase == 'train' else model.eval()
            running_loss, running_corrects = 0.0, 0

            for inputs, labels in dataloaders[phase]:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                optimizer.zero_grad()
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)
                    if phase == 'train':
                        loss.backward()
                        optimizer.step()
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / dataset_sizes[phase]
            # Changed .double() to .float() to fix MPS compatibility
            epoch_acc = running_corrects.float() / dataset_sizes[phase]
            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                torch.save(model.state_dict(), 'soil_classifier.pth')
                # Save labels too
                with open('soil_labels.txt', 'w') as f:
                    f.write("\n".join(class_names))
                print(f"Saved model with {best_acc:.4f} accuracy")

    print(f'Training finished. Model saved as soil_classifier.pth')

if __name__ == "__main__":
    train_soil_classifier()


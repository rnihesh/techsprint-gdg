# Municipal Issue Image Classifier

MobileNetV2-based image classification for municipal issue reporting system.

## Features

- **9 Issue Categories** (no "others" category):
  1. Potholes and Road Damage
  2. Littering/Garbage on Public Places
  3. Illegal Parking Issues
  4. Broken Road Sign Issues
  5. Fallen trees
  6. Vandalism Issues (Graffiti)
  7. Dead Animal Pollution
  8. Damaged concrete structures
  9. Damaged Electric wires and poles

- **Confidence Thresholding**: Rejects images that don't clearly match any category
- **Citizen Notifications**: Provides clear feedback when images are rejected

## Setup

### Requirements

```bash
pip install tensorflow numpy pillow matplotlib
```

Or using the requirements file:

```bash
pip install -r requirements.txt
```

### Training the Model

1. Ensure the dataset is in the `../dataset/` folder with the following structure:
   ```
   dataset/
   ├── Potholes and RoadCracks/Potholes and RoadCracks/train|valid|test/images/
   ├── Garbage/Garbage/train|valid|test/images/
   ├── IllegalParking/IllegalParking/train|valid|test/images/
   └── ... (other categories)
   ```

2. Run training:
   ```bash
   python train_classifier.py
   ```

3. Training will:
   - Reorganize dataset into proper structure
   - Train MobileNetV2 with transfer learning (2-phase training)
   - Save the model to `models/municipal_issue_classifier.keras`
   - Generate `models/class_mapping.json` for inference
   - Create TFLite version for mobile deployment

## Usage

### Command Line

```bash
python classifier.py path/to/image.jpg
```

### Python API

```python
from classifier import MunicipalIssueClassifier

# Initialize classifier
classifier = MunicipalIssueClassifier()

# Classify an image
result = classifier.classify("path/to/image.jpg")

if result.is_valid_issue:
    print(f"Issue: {result.issue_name}")
    print(f"Confidence: {result.confidence * 100:.1f}%")
else:
    print("Image rejected - not a valid municipal issue")
    print(result.message)
```

### From Image Bytes (API Usage)

```python
with open("image.jpg", "rb") as f:
    img_bytes = f.read()

result = classifier.classify(img_bytes)
```

## API Integration

The `api_routes.py` module provides FastAPI routes for integration:

```python
from fastapi import FastAPI
from ml.api_routes import router as classify_router

app = FastAPI()
app.include_router(classify_router)
```

### Endpoints

- `POST /classify/image` - Classify uploaded image
- `GET /classify/issue-types` - List valid issue types
- `POST /classify/validate` - Validate image against expected type

## Confidence Thresholds

| Confidence | Action |
|------------|--------|
| < 70% | **Reject** - Image doesn't match any category |
| 70-85% | **Accept with warning** - User should confirm category |
| > 85% | **Accept** - High confidence classification |

## Model Architecture

- **Base**: MobileNetV2 (pre-trained on ImageNet)
- **Head**: GlobalAveragePooling2D → Dense(256) → Dropout → Dense(128) → Dropout → Dense(9, softmax)
- **Training**: 2-phase transfer learning
  1. Phase 1: Train head only (15 epochs)
  2. Phase 2: Fine-tune top layers (35 epochs)

## Output Files

After training:
- `models/municipal_issue_classifier.keras` - Full Keras model
- `models/municipal_issue_classifier.tflite` - TensorFlow Lite version
- `models/class_mapping.json` - Class index to name mapping
- `models/training_history.png` - Training metrics plot

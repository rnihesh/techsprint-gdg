"""
Flask API for Municipal Issue Image Classification
Runs the trained MobileNetV2 model for inference
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from pathlib import Path
import json
import requests
from io import BytesIO
from PIL import Image
import os
import base64
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configuration
IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.70  # Minimum confidence to accept
WARNING_THRESHOLD = 0.85     # Below this, show warning
ENTROPY_THRESHOLD = 1.5      # High entropy = uncertain = likely unrelated image
MAX_SECONDARY_RATIO = 0.6    # If second-best is too close to best, image is ambiguous

# Image quality thresholds
MIN_BRIGHTNESS = 15          # Reject very dark images (0-255 scale)
MAX_BRIGHTNESS = 245         # Reject very bright/white images
MIN_VARIANCE = 200           # Reject uniform/blank images (low texture)
MIN_EDGE_DENSITY = 0.01      # Reject images with no edges/features

# Load model and class mapping
MODEL_PATH = Path(__file__).parent / "models" / "best_model.keras"
CLASS_MAPPING_PATH = Path(__file__).parent / "models" / "class_mapping.json"

# Global model variable
model = None
class_mapping = None

def load_classifier():
    """Load the trained model and class mapping"""
    global model, class_mapping
    
    if model is None:
        print(f"Loading model from {MODEL_PATH}...")
        model = load_model(str(MODEL_PATH))
        print("Model loaded successfully!")
    
    if class_mapping is None:
        with open(CLASS_MAPPING_PATH, "r") as f:
            class_mapping = json.load(f)
        print(f"Loaded {class_mapping['num_classes']} classes")
    
    return model, class_mapping


def preprocess_image_from_url(image_url: str) -> np.ndarray:
    """Download and preprocess image from URL"""
    response = requests.get(image_url, timeout=10)
    response.raise_for_status()
    
    img = Image.open(BytesIO(response.content))
    img = img.convert('RGB')
    img = img.resize(IMG_SIZE)
    
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array


def preprocess_image_from_bytes(img_bytes: bytes) -> np.ndarray:
    """Preprocess image from bytes"""
    img = Image.open(BytesIO(img_bytes))
    img = img.convert('RGB')
    img = img.resize(IMG_SIZE)
    
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array


def check_image_quality(img_array: np.ndarray) -> tuple[bool, str]:
    """
    Check if image is valid (not blank, black, white, or low quality).
    Returns (is_valid, rejection_reason)
    """
    # Remove batch dimension for analysis
    img = img_array[0] if len(img_array.shape) == 4 else img_array
    
    # Convert back to 0-255 scale for analysis
    img_uint8 = (img * 255).astype(np.uint8)
    
    # Check 1: Average brightness (detect black/white images)
    avg_brightness = np.mean(img_uint8)
    if avg_brightness < MIN_BRIGHTNESS:
        return False, f"Image too dark (avg brightness: {avg_brightness:.0f}/255)"
    if avg_brightness > MAX_BRIGHTNESS:
        return False, f"Image too bright/white (avg brightness: {avg_brightness:.0f}/255)"
    
    # Check 2: Variance (detect uniform/blank images)
    variance = np.var(img_uint8)
    if variance < MIN_VARIANCE:
        return False, f"Image lacks detail/texture (variance: {variance:.0f})"
    
    # Check 3: Edge detection using simple gradient
    gray = np.mean(img_uint8, axis=2)
    gradient_x = np.abs(np.diff(gray, axis=1))
    gradient_y = np.abs(np.diff(gray, axis=0))
    edge_density = (np.mean(gradient_x) + np.mean(gradient_y)) / 255.0
    if edge_density < MIN_EDGE_DENSITY:
        return False, f"Image has no distinct features (edge density: {edge_density:.3f})"
    
    # Check 4: Color diversity (reject single-color images)
    r_std = np.std(img_uint8[:,:,0])
    g_std = np.std(img_uint8[:,:,1])
    b_std = np.std(img_uint8[:,:,2])
    color_diversity = (r_std + g_std + b_std) / 3
    if color_diversity < 10:
        return False, f"Image is mostly a single color"
    
    return True, ""


def download_image(image_url: str) -> Image.Image:
    """Download image from URL and return PIL Image"""
    response = requests.get(image_url, timeout=10)
    response.raise_for_status()
    return Image.open(BytesIO(response.content)).convert('RGB')


def calculate_entropy(probabilities: np.ndarray) -> float:
    """
    Calculate Shannon entropy of probability distribution.
    Higher entropy = more uncertainty = likely unrelated image.
    Max entropy for 9 classes = log(9) ≈ 2.2
    """
    # Avoid log(0) by adding small epsilon
    probs = np.clip(probabilities, 1e-10, 1.0)
    entropy = -np.sum(probs * np.log(probs))
    return float(entropy)


def is_likely_unrelated(predictions: np.ndarray) -> tuple[bool, str]:
    """
    Detect if image is likely unrelated to municipal issues.
    Returns (is_unrelated, reason)
    """
    sorted_probs = np.sort(predictions)[::-1]
    top_prob = sorted_probs[0]
    second_prob = sorted_probs[1]
    
    entropy = calculate_entropy(predictions)
    
    # Check 1: High entropy (uncertainty across classes)
    if entropy > ENTROPY_THRESHOLD:
        return True, f"High uncertainty (entropy: {entropy:.2f})"
    
    # Check 2: Top prediction is low
    if top_prob < 0.5:
        return True, f"Low confidence ({top_prob*100:.0f}%)"
    
    # Check 3: Second prediction is too close to top (ambiguous)
    if second_prob > 0 and (second_prob / top_prob) > MAX_SECONDARY_RATIO:
        return True, f"Ambiguous classification (top two: {top_prob*100:.0f}% vs {second_prob*100:.0f}%)"
    
    return False, ""


# ML class name to issue type mapping
ML_CLASS_TO_ISSUE_TYPE = {
    "Potholes and Road Damage": "POTHOLE",
    "Littering": "GARBAGE",
    "Illegal Parking Issues": "ILLEGAL_PARKING",
    "Broken Road Sign Issues": "DAMAGED_SIGN",
    "Fallen trees": "FALLEN_TREE",
    "Vandalism Issues": "VANDALISM",
    "Dead Animal Pollution": "DEAD_ANIMAL",
    "Damaged concrete structures": "DAMAGED_CONCRETE",
    "Damaged Electric wires and poles": "DAMAGED_ELECTRICAL",
}


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
    })


@app.route('/classify', methods=['POST'])
def classify():
    """
    Classify an image to identify municipal issues
    
    Accepts either:
    - JSON with imageUrl field
    - Form data with image file
    """
    global model, class_mapping
    
    try:
        # Ensure model is loaded
        model, class_mapping = load_classifier()
        
        # Get image from request
        if request.is_json:
            data = request.get_json()
            image_url = data.get('imageUrl')
            
            if not image_url:
                return jsonify({
                    "success": False,
                    "error": "imageUrl is required"
                }), 400
            
            img_array = preprocess_image_from_url(image_url)
        
        elif 'image' in request.files:
            file = request.files['image']
            img_bytes = file.read()
            img_array = preprocess_image_from_bytes(img_bytes)
        
        else:
            return jsonify({
                "success": False,
                "error": "No image provided. Send imageUrl in JSON or image file in form data."
            }), 400
        
        # Check image quality BEFORE running ML model
        is_quality_valid, quality_reason = check_image_quality(img_array)
        if not is_quality_valid:
            return jsonify({
                "success": True,
                "isValid": False,
                "isUnrelated": True,
                "className": None,
                "issueType": None,
                "confidence": 0,
                "entropy": 0,
                "message": f"Invalid image: {quality_reason}. Please upload a clear photo of the municipal issue.",
                "allPredictions": []
            })
        
        # Run inference
        predictions = model.predict(img_array, verbose=0)[0]
        
        # Get top prediction
        top_idx = int(np.argmax(predictions))
        top_confidence = float(predictions[top_idx])
        top_class = class_mapping["index_to_class"][str(top_idx)]
        
        # Check if image is likely unrelated to municipal issues
        is_unrelated, unrelated_reason = is_likely_unrelated(predictions)
        entropy = calculate_entropy(predictions)
        
        # Get all predictions sorted by probability
        all_predictions = []
        for idx, prob in enumerate(predictions):
            class_name = class_mapping["index_to_class"][str(idx)]
            all_predictions.append({
                "className": class_name,
                "probability": float(prob),
                "issueType": ML_CLASS_TO_ISSUE_TYPE.get(class_name)
            })
        all_predictions.sort(key=lambda x: x["probability"], reverse=True)
        
        # Determine if valid based on confidence AND unrelated check
        is_valid = top_confidence >= CONFIDENCE_THRESHOLD and not is_unrelated
        issue_type = ML_CLASS_TO_ISSUE_TYPE.get(top_class) if is_valid else None
        
        # Generate message
        if is_unrelated:
            message = (
                f"This image doesn't appear to show a municipal issue. "
                f"Reason: {unrelated_reason}. "
                f"Please upload a clear photo of the issue (pothole, garbage, vandalism, etc.)."
            )
        elif not is_valid:
            message = (
                f"Unable to confidently classify this image ({top_confidence*100:.0f}% confidence). "
                f"The image may not clearly show a municipal issue. "
                f"Please upload a clearer image or select the issue type manually."
            )
        elif top_confidence < WARNING_THRESHOLD:
            message = (
                f"Detected as '{top_class}' with {top_confidence*100:.0f}% confidence. "
                f"Please confirm this is the correct issue type."
            )
        else:
            message = f"Detected as '{top_class}' with {top_confidence*100:.0f}% confidence."
        
        return jsonify({
            "success": True,
            "isValid": is_valid,
            "isUnrelated": is_unrelated,
            "className": top_class if not is_unrelated else None,
            "issueType": issue_type,
            "confidence": top_confidence,
            "entropy": entropy,
            "message": message,
            "allPredictions": all_predictions[:5]  # Top 5 predictions
        })
    
    except requests.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"Failed to fetch image: {str(e)}"
        }), 400
    
    except Exception as e:
        print(f"Classification error: {e}")
        return jsonify({
            "success": False,
            "error": f"Classification failed: {str(e)}"
        }), 500


@app.route('/issue-types', methods=['GET'])
def get_issue_types():
    """Get list of all valid issue types"""
    return jsonify({
        "success": True,
        "issueTypes": [
            {"className": k, "issueType": v}
            for k, v in ML_CLASS_TO_ISSUE_TYPE.items()
        ],
        "count": len(ML_CLASS_TO_ISSUE_TYPE)
    })


@app.route('/generate-description', methods=['POST'])
def generate_description():
    """
    Generate a description for a municipal issue image using Gemini AI.
    
    Accepts JSON with:
    - imageUrl: URL of the uploaded image
    - issueType: The detected/selected issue type
    """
    try:
        data = request.get_json()
        image_url = data.get('imageUrl')
        issue_type = data.get('issueType', '')
        
        if not image_url:
            return jsonify({
                "success": False,
                "error": "imageUrl is required"
            }), 400
        
        # Get Gemini API key from environment
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            return jsonify({
                "success": False,
                "error": "Gemini API key not configured"
            }), 500
        
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        
        # Download the image
        img = download_image(image_url)
        
        # Convert to bytes for Gemini
        img_buffer = BytesIO()
        img.save(img_buffer, format='JPEG')
        img_bytes = img_buffer.getvalue()
        
        # Create Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Create the prompt
        issue_type_name = {
            "POTHOLE": "pothole or road damage",
            "GARBAGE": "garbage or littering",
            "ILLEGAL_PARKING": "illegal parking",
            "DAMAGED_SIGN": "damaged road sign",
            "FALLEN_TREE": "fallen tree",
            "VANDALISM": "vandalism or graffiti",
            "DEAD_ANIMAL": "dead animal",
            "DAMAGED_CONCRETE": "damaged concrete structure",
            "DAMAGED_ELECTRICAL": "damaged electrical pole or wire"
        }.get(issue_type, "municipal issue")
        
        prompt = f"""You are helping citizens report municipal issues. 
Analyze this image showing a {issue_type_name} and write a brief, clear description (2-3 sentences) that would help municipal workers understand and locate the issue.

Include:
- What the issue looks like (size, severity if visible)
- Any notable details that would help workers identify or fix it
- Keep it factual and objective

Do NOT include:
- Location details (those are captured separately)
- Speculation about causes
- Demands or complaints

Just provide the description text, no quotes or prefixes."""

        # Generate description using Gemini
        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": img_bytes}
        ])
        
        description = response.text.strip()
        
        return jsonify({
            "success": True,
            "description": description
        })
        
    except Exception as e:
        print(f"Description generation error: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to generate description: {str(e)}"
        }), 500


if __name__ == '__main__':
    # Pre-load model on startup
    print("=" * 60)
    print("Municipal Issue Classifier API")
    print("=" * 60)
    
    load_classifier()
    
    # Check for Gemini API key
    if os.environ.get('GEMINI_API_KEY'):
        print("✓ Gemini API key found - description generation enabled")
    else:
        print("⚠ GEMINI_API_KEY not set - description generation disabled")
    
    port = int(os.environ.get('ML_API_PORT', 5000))
    print(f"\nStarting server on http://localhost:{port}")
    print("Endpoints:")
    print(f"  POST /classify - Classify an image")
    print(f"  POST /generate-description - Generate issue description with Gemini AI")
    print(f"  GET  /issue-types - List valid issue types")
    print(f"  GET  /health - Health check")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)

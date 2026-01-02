"""
MobileNetV2-based Image Classifier for Municipal Issue Reporting
Trains a multi-class classifier for 9 municipal issue categories.
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt
from pathlib import Path

# Configuration
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 50
INITIAL_LR = 0.001
FINE_TUNE_LR = 0.0001

# Dataset paths - map folder names to class labels
DATASET_PATH = Path(__file__).parent.parent / "dataset"

# Class mapping - folder name to class label
CLASS_MAPPING = {
    "Damaged concrete structures": "Damaged concrete structures",
    "DamagedElectricalPoles": "Damaged Electric wires and poles",
    "DamagedRoadSigns": "Broken Road Sign Issues",
    "DeadAnimalsPollution": "Dead Animal Pollution",
    "FallenTrees": "Fallen trees",
    "Garbage": "Littering/Garbage on Public Places",
    "Graffitti": "Vandalism Issues",
    "IllegalParking": "Illegal Parking Issues",
    "Potholes and RoadCracks": "Potholes and Road Damage",
}

# Unique class names (9 categories - no "others")
CLASS_NAMES = list(CLASS_MAPPING.values())
NUM_CLASSES = len(CLASS_NAMES)


def prepare_dataset_structure(dataset_path: Path, output_path: Path):
    """
    Reorganize dataset into train/valid/test folders with class subfolders
    for use with ImageDataGenerator.flow_from_directory()
    """
    print("Preparing dataset structure...")
    
    for split in ["train", "valid", "test"]:
        split_output = output_path / split
        split_output.mkdir(parents=True, exist_ok=True)
        
        for folder_name, class_name in CLASS_MAPPING.items():
            # Create class folder in output
            class_output = split_output / class_name
            class_output.mkdir(parents=True, exist_ok=True)
            
            # Source images folder
            # Structure: FolderName/FolderName/train/images/
            source_path = dataset_path / folder_name / folder_name / split / "images"
            
            if source_path.exists():
                images = list(source_path.glob("*.jpg")) + list(source_path.glob("*.jpeg")) + list(source_path.glob("*.png"))
                print(f"Found {len(images)} images for {class_name} ({split})")
                
                for img_path in images:
                    dest_path = class_output / img_path.name
                    if not dest_path.exists():
                        # Create symlink or copy
                        try:
                            dest_path.symlink_to(img_path)
                        except OSError:
                            # Fallback to copy if symlinks not supported
                            import shutil
                            shutil.copy2(img_path, dest_path)
            else:
                print(f"Warning: Source path not found: {source_path}")
    
    print("Dataset structure prepared!")
    return output_path


def create_data_generators(data_path: Path):
    """Create training, validation, and test data generators with augmentation."""
    
    # Training data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest',
        brightness_range=[0.8, 1.2]
    )
    
    # Validation/Test - only rescaling
    val_test_datagen = ImageDataGenerator(rescale=1./255)
    
    # Create generators
    train_generator = train_datagen.flow_from_directory(
        data_path / "train",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )
    
    valid_generator = val_test_datagen.flow_from_directory(
        data_path / "valid",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    
    test_generator = val_test_datagen.flow_from_directory(
        data_path / "test",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, valid_generator, test_generator


def build_model(num_classes: int, fine_tune_at: int = 100):
    """
    Build MobileNetV2-based classifier.
    
    Args:
        num_classes: Number of output classes
        fine_tune_at: Layer index from which to fine-tune (set to 0 to freeze all)
    
    Returns:
        Compiled Keras model
    """
    # Load pre-trained MobileNetV2 (ImageNet weights)
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)
    )
    
    # Freeze base model initially
    base_model.trainable = False
    
    # Build classification head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    # Compile model
    model.compile(
        optimizer=Adam(learning_rate=INITIAL_LR),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model, base_model


def fine_tune_model(model, base_model, fine_tune_at: int = 100):
    """Unfreeze layers for fine-tuning."""
    # Unfreeze layers from fine_tune_at onwards
    base_model.trainable = True
    
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False
    
    # Re-compile with lower learning rate
    model.compile(
        optimizer=Adam(learning_rate=FINE_TUNE_LR),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def plot_training_history(history, save_path: Path):
    """Plot and save training metrics."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Accuracy
    axes[0].plot(history.history['accuracy'], label='Train Accuracy')
    axes[0].plot(history.history['val_accuracy'], label='Validation Accuracy')
    axes[0].set_title('Model Accuracy')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Accuracy')
    axes[0].legend()
    axes[0].grid(True)
    
    # Loss
    axes[1].plot(history.history['loss'], label='Train Loss')
    axes[1].plot(history.history['val_loss'], label='Validation Loss')
    axes[1].set_title('Model Loss')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Loss')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig(save_path / 'training_history.png', dpi=150)
    plt.close()
    print(f"Training history saved to {save_path / 'training_history.png'}")


def train():
    """Main training function."""
    print("=" * 60)
    print("Municipal Issue Image Classifier - MobileNetV2")
    print("=" * 60)
    
    # Setup paths
    ml_path = Path(__file__).parent
    prepared_data_path = ml_path / "prepared_data"
    model_save_path = ml_path / "models"
    model_save_path.mkdir(parents=True, exist_ok=True)
    
    # Prepare dataset
    prepare_dataset_structure(DATASET_PATH, prepared_data_path)
    
    # Create data generators
    print("\nCreating data generators...")
    train_gen, valid_gen, test_gen = create_data_generators(prepared_data_path)
    
    # Save class indices mapping
    class_indices = train_gen.class_indices
    class_names_ordered = {v: k for k, v in class_indices.items()}
    
    with open(model_save_path / "class_mapping.json", "w") as f:
        json.dump({
            "class_indices": class_indices,
            "index_to_class": class_names_ordered,
            "num_classes": NUM_CLASSES
        }, f, indent=2)
    print(f"Class mapping saved to {model_save_path / 'class_mapping.json'}")
    
    # Build model
    print("\nBuilding MobileNetV2 model...")
    model, base_model = build_model(NUM_CLASSES)
    model.summary()
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            str(model_save_path / "best_model.keras"),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Phase 1: Train classification head (frozen base)
    print("\n" + "=" * 60)
    print("Phase 1: Training classification head (frozen base)...")
    print("=" * 60)
    
    history1 = model.fit(
        train_gen,
        epochs=15,
        validation_data=valid_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Phase 2: Fine-tune top layers
    print("\n" + "=" * 60)
    print("Phase 2: Fine-tuning top layers of MobileNetV2...")
    print("=" * 60)
    
    model = fine_tune_model(model, base_model, fine_tune_at=100)
    
    history2 = model.fit(
        train_gen,
        epochs=EPOCHS,
        initial_epoch=15,
        validation_data=valid_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Combine histories
    combined_history = {
        'accuracy': history1.history['accuracy'] + history2.history['accuracy'],
        'val_accuracy': history1.history['val_accuracy'] + history2.history['val_accuracy'],
        'loss': history1.history['loss'] + history2.history['loss'],
        'val_loss': history1.history['val_loss'] + history2.history['val_loss']
    }
    
    class CombinedHistory:
        def __init__(self, history_dict):
            self.history = history_dict
    
    # Plot training history
    plot_training_history(CombinedHistory(combined_history), model_save_path)
    
    # Evaluate on test set
    print("\n" + "=" * 60)
    print("Evaluating on test set...")
    print("=" * 60)
    
    test_loss, test_accuracy = model.evaluate(test_gen, verbose=1)
    print(f"\nTest Accuracy: {test_accuracy * 100:.2f}%")
    print(f"Test Loss: {test_loss:.4f}")
    
    # Save final model
    model.save(str(model_save_path / "municipal_issue_classifier.keras"))
    print(f"\nFinal model saved to {model_save_path / 'municipal_issue_classifier.keras'}")
    
    # Save as TFLite for mobile deployment (optional)
    print("\nConverting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    
    with open(model_save_path / "municipal_issue_classifier.tflite", "wb") as f:
        f.write(tflite_model)
    print(f"TFLite model saved to {model_save_path / 'municipal_issue_classifier.tflite'}")
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    
    return model


if __name__ == "__main__":
    train()

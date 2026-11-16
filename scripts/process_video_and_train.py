"""
SmartEye AI - Automated Video Frame Extraction, Auto-Labeling & YOLOv11 Fine-Tuning Pipeline
Usage:
    python3 scripts/process_video_and_train.py --video path/to/video.mp4 --target-frames 180 --epochs 60
"""

import os
import sys
import shutil
import random
import argparse
import cv2
import numpy as np
from ultralytics import YOLO

def is_blurry(image, threshold=60.0):
    """Calculates the Laplacian variance to discard blurry motion frames."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold

def extract_frames_from_video(video_path, output_dir, target_count=180):
    """Evenly extracts sharp, high-quality frames from a 1-2 minute video."""
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file at: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration_sec = total_frames / fps
    print(f"🎬 Video Loaded: {total_frames} frames ({duration_sec:.1f}s at {fps:.1f} FPS)")

    # Sample step
    step = max(1, total_frames // (target_count * 2))
    saved_frames = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step == 0:
            # Check sharpness
            if not is_blurry(frame):
                frame_filename = os.path.join(output_dir, f"frame_{len(saved_frames):04d}.jpg")
                cv2.imwrite(frame_filename, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
                saved_frames.append(frame_filename)
                if len(saved_frames) >= target_count:
                    break

        frame_idx += 1

    cap.release()
    print(f"📸 Extracted {len(saved_frames)} crisp frames into {output_dir}")
    return saved_frames

def auto_label_and_split(frames_dir, dataset_root, split_ratio=0.8):
    """Auto-annotates frames using base YOLO COCO class 67 and splits into train/val."""
    train_img_dir = os.path.join(dataset_root, "train", "images")
    train_lbl_dir = os.path.join(dataset_root, "train", "labels")
    val_img_dir = os.path.join(dataset_root, "val", "images")
    val_lbl_dir = os.path.join(dataset_root, "val", "labels")

    for d in [train_img_dir, train_lbl_dir, val_img_dir, val_lbl_dir]:
        os.makedirs(d, exist_ok=True)

    print("🤖 Loading base YOLO model to auto-annotate phone bounding boxes...")
    detector = YOLO("yolo11n.pt")

    frame_files = [f for f in os.listdir(frames_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    random.shuffle(frame_files)

    train_count = 0
    val_count = 0
    labeled_count = 0
    unlabeled_background = 0

    for idx, fname in enumerate(frame_files):
        img_path = os.path.join(frames_dir, fname)
        is_val = (idx / len(frame_files)) > split_ratio
        
        target_img_dir = val_img_dir if is_val else train_img_dir
        target_lbl_dir = val_lbl_dir if is_val else train_lbl_dir

        # Run inference filtering for cell phone (COCO class 67)
        results = detector(img_path, classes=[67], conf=0.25, verbose=False)
        result = results[0]

        boxes = result.boxes
        labels = []
        img_h, img_w = result.orig_shape

        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            xc = ((x1 + x2) / 2.0) / img_w
            yc = ((y1 + y2) / 2.0) / img_h
            bw = (x2 - x1) / img_w
            bh = (y2 - y1) / img_h
            labels.append(f"0 {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}")

        # If phone detected, copy image and write label
        # Also keep up to 20 background/negative images (empty labels) to prevent false positives
        include_frame = bool(labels) or (unlabeled_background < 20 and idx % 7 == 0)
        
        if include_frame:
            shutil.copy2(img_path, os.path.join(target_img_dir, fname))
            lbl_name = os.path.splitext(fname)[0] + ".txt"
            with open(os.path.join(target_lbl_dir, lbl_name), "w") as lf:
                if labels:
                    lf.write("\n".join(labels) + "\n")
                else:
                    unlabeled_background += 1

            if labels:
                labeled_count += 1
            if is_val:
                val_count += 1
            else:
                train_count += 1

    print(f"🏷️  Auto-annotated {labeled_count} phone frames + {unlabeled_background} background frames: {train_count} train images, {val_count} val images.")

    # Create data.yaml
    yaml_path = os.path.join(dataset_root, "data.yaml")
    abs_dataset_root = os.path.abspath(dataset_root)
    with open(yaml_path, "w") as yf:
        yf.write(f"""path: {abs_dataset_root}
train: train/images
val: val/images

nc: 1
names: ['phone']
""")
    print(f"📄 Created unified dataset config: {yaml_path}")
    return yaml_path

def train_yolo(data_yaml_path, epochs=60, imgsz=640, output_weights="runs/detect/phone_trained/weights/best.pt"):
    """Trains YOLOv11 on Apple Silicon GPU (mps) or CPU with data augmentations."""
    print("🚀 Initializing YOLOv11 fine-tuning...")
    model = YOLO("yolo11n.pt")

    # Train on Apple Silicon MPS or CPU
    results = model.train(
        data=data_yaml_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=8,
        freeze=10,       # Freeze backbone to preserve COCO weights
        fliplr=0.5,      # Horizontal flip
        degrees=15.0,    # Random rotation
        hsv_h=0.015,     # Color jitter
        hsv_s=0.5,
        hsv_v=0.4,
        mosaic=1.0,      # Mosaic augmentation
        name="phone_trained",
        exist_ok=True
    )
    print("🎉 Training Complete!")
    best_weights = "runs/detect/phone_trained/weights/best.pt"
    if os.path.exists(best_weights):
        shutil.copy2(best_weights, "best.pt")
        shutil.copy2(best_weights, "public/best.pt")
        print(f"✅ Saved fine-tuned weights to: best.pt and public/best.pt")
    return results

def main():
    parser = argparse.ArgumentParser(description="Extract video frames, auto-label, and fine-tune YOLO")
    parser.add_argument("--video", required=True, help="Path to your 1-2 minute video file (.mp4 or .mov)")
    parser.add_argument("--frames", type=int, default=180, help="Number of frames to extract (default: 180)")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs (default: 50)")
    parser.add_argument("--dataset-dir", default="dataset_from_video", help="Output dataset directory")
    args = parser.parse_args()

    if not os.path.exists(args.video):
        print(f"❌ Error: Video file not found at '{args.video}'")
        sys.exit(1)

    raw_frames_dir = os.path.join(args.dataset_dir, "raw_frames")
    extract_frames_from_video(args.video, raw_frames_dir, target_count=args.frames)
    yaml_path = auto_label_and_split(raw_frames_dir, args.dataset_dir)
    train_yolo(yaml_path, epochs=args.epochs)

if __name__ == "__main__":
    main()

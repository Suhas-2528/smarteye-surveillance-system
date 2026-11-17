"""
SmartEye AI Surveillance - Real-Time YOLO Phone Detection & Database Integration
Captures camera frames, runs YOLO inference, detects mobile phones, and automatically
transmits alerts and HD snapshots to the SmartEye backend (MySQL database + Web & Mobile App).

Features Advanced False-Positive Rejection:
- Filters out student ID cards & badges via white-pixel surface analysis
- Rejects human body / wall bounding boxes via spatial area constraints
- Filters transient lighting glitches via temporal multi-frame confirmation streak
- Separates phone (COCO 67) from person (COCO 0) to eliminate beard/face false triggers
"""

import os
import sys
import time
import argparse
import threading
from datetime import datetime
import cv2
import numpy as np
import requests
from ultralytics import YOLO

# Configuration
DEFAULT_SERVER_URL = "http://localhost:3001"
DEFAULT_ROOM = "Room 101 - Exam Hall"
DEFAULT_CONF_THRESHOLD = 0.35  # 35% threshold captures distant phones; white-pixel check rejects ID cards
DEFAULT_IMGSZ = 960            # 960px inference preserves distant phone details for high detection range
ALERT_COOLDOWN_SECONDS = 3.5   # Minimum seconds between alert dispatches

def find_best_model():
    """Finds the most suitable YOLO model weights available, prioritizing COCO yolo11n for multi-class separation."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        "yolo11n.pt",
        os.path.join(script_dir, "yolo11n.pt"),
        os.path.join(script_dir, "../yolo11n.pt"),
        "best.pt",
        os.path.join(script_dir, "best.pt")
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return "yolo11n.pt"

def send_alert_async(server_url, image_bytes, room, detection_label, confidence):
    """Transmits alert and image snapshot to SmartEye API without freezing the camera feed."""
    def worker():
        try:
            endpoint = f"{server_url.rstrip('/')}/api/alerts"
            time_str = datetime.now().strftime("%I:%M %p")
            
            files = {
                'image': ('phone_detection.jpg', image_bytes, 'image/jpeg')
            }
            data = {
                'room': room,
                'detection': detection_label,
                'confidence': f"{confidence:.2f}",
                'timestamp': time_str
            }
            
            response = requests.post(endpoint, files=files, data=data, timeout=5)
            if response.status_code in (200, 201):
                res_data = response.json()
                alert_id = res_data.get('alert', {}).get('id', 'saved')
                print(f"🚨 [DB STORED] Alert ID #{alert_id} | {detection_label} ({confidence*100:.1f}%) in {room} -> Synced with App & Web")
            else:
                print(f"⚠️ [SERVER RESPONSE] {response.status_code}: {response.text[:80]}")
        except Exception as err:
            print(f"⚠️ [DISPATCH ERROR] Could not reach {server_url}: {err}")

    t = threading.Thread(target=worker, daemon=True)
    t.start()
    return t

def main():
    parser = argparse.ArgumentParser(description="SmartEye YOLO Camera Phone Detection")
    parser.add_argument("--source", default="0", help="Camera index (e.g. 0) or video/image file path")
    parser.add_argument("--model", default=None, help="Path to YOLO .pt weights file")
    parser.add_argument("--server", default=DEFAULT_SERVER_URL, help="SmartEye Backend Server URL")
    parser.add_argument("--room", default=DEFAULT_ROOM, help="Camera Location / Room Name")
    parser.add_argument("--conf", type=float, default=DEFAULT_CONF_THRESHOLD, help="Confidence threshold (0.0 - 1.0)")
    parser.add_argument("--cooldown", type=float, default=ALERT_COOLDOWN_SECONDS, help="Cooldown in seconds between alert dispatches")
    parser.add_argument("--imgsz", type=int, default=DEFAULT_IMGSZ, help="Inference image resolution (default 960 for long range, 1280 for extreme range)")
    parser.add_argument("--long-range", action="store_true", help="Enable extreme long-range mode (sets imgsz=1280 and conf=0.30)")
    parser.add_argument("--headless", action="store_true", help="Run without GUI window (for servers/background)")
    args = parser.parse_args()

    if args.long_range:
        args.imgsz = 1280
        args.conf = min(args.conf, 0.30)

    model_path = args.model or find_best_model()
    print(f"📦 Loading YOLO Model: {model_path}")
    model = YOLO(model_path)

    # Determine camera source
    is_image = False
    if args.source.isdigit():
        source_val = int(args.source)
        # On macOS, AVFOUNDATION is typically the fastest camera backend
        cap = cv2.VideoCapture(source_val, cv2.CAP_AVFOUNDATION)
        if not cap.isOpened():
            cap = cv2.VideoCapture(source_val)
        
        # Maximize camera capture resolution to 1080p Full HD for maximum distance clarity
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    elif os.path.isfile(args.source) and args.source.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
        is_image = True
        cap = None
    else:
        source_val = args.source
        cap = cv2.VideoCapture(source_val)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    if not is_image and (cap is None or not cap.isOpened()):
        print(f"❌ Error: Could not open camera/source '{args.source}'")
        sys.exit(1)

    print("=" * 60)
    print("🎥 SmartEye AI Camera Surveillance - Phone Detection Active")
    print(f"🌐 Backend Server : {args.server}")
    print(f"📍 Room / Node    : {args.room}")
    print(f"🎯 Model Target   : {model_path}")
    print(f"🔭 Detection Range: HIGH-RANGE ACTIVE (imgsz={args.imgsz}px, conf={args.conf * 100:.0f}%)")
    print(f"⏱️  Alert Cooldown : {args.cooldown}s")
    print("🛡️  Anti-ID Filter : Enabled (White-pixel & Aspect ratio checks)")
    print("⌨️  Controls       : Press 'q' or ESC in video window to exit")
    print("=" * 60)

    last_alert_time = 0.0
    phone_streak = 0
    phone_classes = {'phone', 'phones', 'cell phone', 'mobile phone', 'smartphone'}

    # If using 80-class COCO model, restrict target classes to cell phone (67)
    target_classes = [67] if (hasattr(model, 'names') and 67 in model.names) else None

    try:
        while True:
            if is_image:
                frame = cv2.imread(args.source)
                if frame is None:
                    print("Error reading image file.")
                    break
            else:
                ret, frame = cap.read()
                if not ret:
                    time.sleep(0.03)
                    continue

            frame_h, frame_w = frame.shape[:2]
            frame_area = frame_h * frame_w

            # Run YOLO inference with high-resolution input size for long-range capture
            results = model(frame, imgsz=args.imgsz, conf=args.conf, classes=target_classes, verbose=False)
            result = results[0]

            candidate_found = False
            max_phone_conf = 0.0

            # Scan detected boxes
            for box in result.boxes:
                cls_id = int(box.cls[0])
                cls_name = model.names.get(cls_id, "").lower()
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                box_w = max(1, x2 - x1)
                box_h = max(1, y2 - y1)
                box_area = box_w * box_h
                long_edge = max(box_w, box_h)
                short_edge = min(box_w, box_h)
                aspect_ratio = long_edge / short_edge

                # 1. Reject boxes covering more than 35% of the frame (people, walls, desks)
                if box_area > (frame_area * 0.35):
                    continue

                # 2. Reject sensor noise (lowered from 45 to 18px to capture distant phones across room)
                if long_edge < 18:
                    continue

                # 3. Anti-ID Card & White Badge Surface Analysis
                crop = frame[y1:y2, x1:x2]
                white_pct = 0.0
                if crop.size > 0:
                    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
                    # White/bright paper has high Value (brightness > 175) and low Saturation (< 75)
                    white_mask = (hsv[:,:,2] > 175) & (hsv[:,:,1] < 75)
                    white_pct = (np.sum(white_mask) / white_mask.size) * 100.0

                # Student ID cards typically have 25%-60% white background.
                # Real smartphones are dark glass/metal (< 12% white) or screens with icons.
                if white_pct > 20.0 and conf < 0.85:
                    # Draw a subtle yellow indicator in GUI showing ID card was explicitly recognized & ignored
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 200, 255), 1)
                    cv2.putText(frame, f"ID CARD (IGNORED {conf*100:.0f}%)", (x1, max(15, y1 - 6)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 200, 255), 1)
                    continue

                # 4. Aspect Ratio Check: Only reject purely square non-phone objects with low confidence
                if aspect_ratio < 1.10 and conf < 0.38:
                    continue

                # Valid phone target confirmed
                if cls_name in phone_classes or 'phone' in cls_name or cls_id == 67:
                    candidate_found = True
                    if conf > max_phone_conf:
                        max_phone_conf = conf

                    # Draw red bounding box for phone
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                    label = f"PHONE DETECTED {conf*100:.0f}%"
                    cv2.putText(frame, label, (x1, max(20, y1 - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # 5. Temporal Multi-Frame Confirmation Streak:
            # Requires 2 consecutive frames with candidate phone to prevent momentary glitches
            if candidate_found:
                phone_streak += 1
            else:
                phone_streak = max(0, phone_streak - 1)

            phone_confirmed = (phone_streak >= 2)
            current_time = time.time()

            # If phone confirmed across multiple frames and cooldown has elapsed, dispatch alert!
            if phone_confirmed:
                # Add alert banner at top of frame
                cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (0, 0, 200), -1)
                cv2.putText(frame, f"UNAUTHORIZED PHONE DETECTED ({max_phone_conf*100:.0f}%) - {args.room}", 
                            (15, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                if (current_time - last_alert_time) >= args.cooldown:
                    last_alert_time = current_time
                    # Encode frame as JPEG
                    success, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
                    if success:
                        dispatch_thread = send_alert_async(
                            server_url=args.server,
                            image_bytes=buffer.tobytes(),
                            room=args.room,
                            detection_label="Unauthorized Phone Detected",
                            confidence=max_phone_conf
                        )
                        if is_image and dispatch_thread:
                            dispatch_thread.join(timeout=5)

            # Display video window if not headless
            if not args.headless:
                cv2.imshow("SmartEye - AI Phone Surveillance", frame)
                key = cv2.waitKey(1 if not is_image else 0) & 0xFF
                if key in (ord('q'), ord('Q'), 27):  # 'q' or ESC
                    break

            if is_image:
                break

    finally:
        if cap is not None:
            cap.release()
        cv2.destroyAllWindows()
        print("\n🛑 Surveillance stream terminated.")

if __name__ == "__main__":
    main()

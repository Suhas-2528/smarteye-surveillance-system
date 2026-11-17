"""
SmartEye AI Surveillance - Raspberry Pi 3B+ Edge Phone Detection Client
Optimized for Raspberry Pi 3 Model B+ (1GB RAM, ARM Cortex-A53).

Features:
- Dual Camera Support: USB Webcam (/dev/video0) & Raspberry Pi Camera (libcamera/v4l2)
- Low-memory inference (imgsz=320/416) using pre-trained YOLO COCO Class 67 (cell phone)
- Frame skipping for smooth, non-blocking performance without overheating
- Background alert dispatch to SmartEye backend (MySQL + Web/Android App)
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

# ================= Configuration Defaults =================
DEFAULT_SERVER_URL = "http://192.168.1.6:3001"  # Your Mac/Server IP
DEFAULT_ROOM = "Pi Surveillance Cam - Room 101"
DEFAULT_CONF_THRESHOLD = 0.50  # 50% threshold rejects ID cards while capturing real phones
ALERT_COOLDOWN_SECONDS = 3.5
FRAME_SKIP = 3  # Process 1 out of every 3 frames to save Pi 3B+ CPU
INFERENCE_SIZE = 320  # 320x320 keeps memory under ~350MB on Pi 3B+
# ==========================================================

def send_alert_async(server_url, image_bytes, room, detection_label, confidence):
    """Sends detected phone alert and JPEG frame to backend in a background thread."""
    def worker():
        try:
            endpoint = f"{server_url.rstrip('/')}/api/alerts"
            time_str = datetime.now().strftime("%I:%M %p")
            
            files = {
                'image': ('phone_alert.jpg', image_bytes, 'image/jpeg')
            }
            data = {
                'room': room,
                'detection': detection_label,
                'confidence': f"{confidence:.2f}",
                'timestamp': time_str
            }
            
            response = requests.post(endpoint, files=files, data=data, timeout=6)
            if response.status_code in (200, 201):
                res_data = response.json()
                alert_id = res_data.get('alert', {}).get('id', 'saved')
                print(f"🚨 [ALERT SENT] ID #{alert_id} | Phone ({confidence*100:.1f}%) in {room} -> Stored in DB & App notified")
            else:
                print(f"⚠️ [SERVER] HTTP {response.status_code}: {response.text[:60]}")
        except Exception as err:
            print(f"⚠️ [NETWORK ERROR] Failed to send alert to {server_url}: {err}")

    t = threading.Thread(target=worker, daemon=True)
    t.start()
    return t

def main():
    parser = argparse.ArgumentParser(description="SmartEye Raspberry Pi 3B+ Surveillance")
    parser.add_argument("--server", default=DEFAULT_SERVER_URL, help="SmartEye Backend URL (e.g. http://10.240.190.226:3000)")
    parser.add_argument("--room", default=DEFAULT_ROOM, help="Camera room/location name")
    parser.add_argument("--device", type=int, default=0, help="Camera video device index (/dev/video0 = 0)")
    parser.add_argument("--model", default="yolo11n.pt", help="YOLO model path or name")
    parser.add_argument("--conf", type=float, default=DEFAULT_CONF_THRESHOLD, help="Confidence threshold (0.0 - 1.0)")
    parser.add_argument("--cooldown", type=float, default=ALERT_COOLDOWN_SECONDS, help="Alert cooldown in seconds")
    parser.add_argument("--gui", action="store_true", help="Show GUI display window (default is headless)")
    args = parser.parse_args()

    print("=" * 60)
    print("🍓 SmartEye Raspberry Pi 3B+ Surveillance Camera")
    print(f"🌐 Backend Server   : {args.server}")
    print(f"📍 Camera Node / Loc: {args.room}")
    print(f"📦 Model            : {args.model}")
    print(f"🔍 Confidence Min   : {args.conf * 100:.0f}%")
    print(f"⚡ Input Resolution : {INFERENCE_SIZE}x{INFERENCE_SIZE}")
    print(f"⏱️ Alert Cooldown   : {args.cooldown}s")
    print("=" * 60)

    # 1. Load Model (Optimized for ARM CPU)
    print(f"Loading YOLO model: {args.model} ...")
    model = YOLO(args.model)

    # 2. Open Camera (Supports USB Webcam and Pi Camera via V4L2)
    print(f"Connecting to camera index {args.device}...")
    cap = cv2.VideoCapture(args.device, cv2.CAP_V4L2)
    
    # Set lower capture resolution for high FPS on Pi 3B+
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 15)

    if not cap.isOpened():
        # Fallback to default driver
        cap = cv2.VideoCapture(args.device)

    if not cap.isOpened():
        print(f"❌ Error: Could not open camera on /dev/video{args.device}")
        print("💡 Hint: Run 'v4l2-ctl --list-devices' or check camera cable connection.")
        sys.exit(1)

    print("✅ Camera active! Surveillance running...")

    last_alert_time = 0.0
    frame_count = 0
    phone_streak = 0
    phone_classes = {'phone', 'phones', 'cell phone', 'mobile phone'}

    # Target class filter
    target_classes = [67] if 67 in model.names else None

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            frame_count += 1
            if frame_count % FRAME_SKIP != 0:
                continue

            frame_h, frame_w = frame.shape[:2]
            frame_area = frame_h * frame_w

            # Run inference with class filter
            results = model(frame, imgsz=INFERENCE_SIZE, conf=args.conf, classes=target_classes, verbose=False)
            result = results[0]

            raw_detected = False
            max_conf = 0.0

            for box in result.boxes:
                cls_id = int(box.cls[0])
                cls_name = model.names.get(cls_id, "").lower()
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                box_w = x2 - x1
                box_h = y2 - y1
                box_area = box_w * box_h
                long_edge = max(box_w, box_h)
                short_edge = max(1, min(box_w, box_h))
                aspect_ratio = long_edge / short_edge

                # Reject boxes covering more than 35% of the frame (people/walls)
                if box_area > (frame_area * 0.35):
                    continue

                # Reject tiny pixel noise
                if long_edge < 45:
                    continue

                # Anti-ID Card & White Badge Surface Analysis
                crop = frame[y1:y2, x1:x2]
                white_pct = 0.0
                if crop.size > 0:
                    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
                    # White/bright card has high Value (> 175) and low Saturation (< 75)
                    white_mask = (hsv[:,:,2] > 175) & (hsv[:,:,1] < 75)
                    white_pct = (np.sum(white_mask) / white_mask.size) * 100.0

                # Student ID cards have 25%-60% white surface background
                if white_pct > 20.0 and conf < 0.85:
                    if args.gui:
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 200, 255), 1)
                        cv2.putText(frame, f"ID CARD (IGNORED {conf*100:.0f}%)", (x1, max(15, y1 - 6)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 200, 255), 1)
                    continue

                # Reject squarish non-phone objects with low-to-moderate confidence
                if aspect_ratio < 1.45 and conf < 0.65:
                    continue

                if cls_name in phone_classes or 'phone' in cls_name or cls_id == 67:
                    raw_detected = True
                    if conf > max_conf:
                        max_conf = conf

                    # Draw red bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    label = f"PHONE {conf*100:.0f}%"
                    cv2.putText(frame, label, (x1, max(15, y1 - 8)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            # Require 2 consecutive frames to prevent momentary card glares/flashes
            if raw_detected:
                phone_streak += 1
            else:
                phone_streak = max(0, phone_streak - 1)

            phone_detected = (phone_streak >= 2)

            now = time.time()
            if phone_detected and (now - last_alert_time) >= args.cooldown:
                last_alert_time = now

                # Add alert banner
                cv2.rectangle(frame, (0, 0), (frame.shape[1], 35), (0, 0, 200), -1)
                cv2.putText(frame, f"UNAUTHORIZED PHONE - {args.room}", (10, 23),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                # Encode to JPEG
                ok, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
                if ok:
                    send_alert_async(
                        server_url=args.server,
                        image_bytes=buffer.tobytes(),
                        room=args.room,
                        detection_label="Unauthorized Phone Detected",
                        confidence=max_conf
                    )

            if args.gui:
                cv2.imshow("SmartEye Pi", frame)
                if cv2.waitKey(1) & 0xFF in (ord('q'), 27):
                    break

    except KeyboardInterrupt:
        print("\nStopping Pi surveillance...")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("Pi Camera safely released.")

if __name__ == "__main__":
    main()

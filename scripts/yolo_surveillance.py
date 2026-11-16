"""
SmartEye AI Surveillance - Real-Time YOLO Phone Detection & Database Integration
Captures camera frames, runs YOLO inference, detects mobile phones, and automatically
transmits alerts and HD snapshots to the SmartEye backend (MySQL database + Web & Mobile App).
"""

import os
import sys
import time
import argparse
import threading
from datetime import datetime
import cv2
import requests
from ultralytics import YOLO

# Configuration
DEFAULT_SERVER_URL = "http://localhost:3000"
DEFAULT_ROOM = "Room 101 - Exam Hall"
DEFAULT_CONF_THRESHOLD = 0.30
ALERT_COOLDOWN_SECONDS = 3.0  # Minimum seconds between alert dispatches

def find_best_model():
    """Finds the most suitable YOLO model weights available."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, "runs/detect/train/weights/best.pt"),
        os.path.join(script_dir, "best.pt"),
        os.path.join(script_dir, "yolo11n.pt"),
        "runs/detect/train/weights/best.pt",
        "yolo11n.pt"
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
    parser.add_argument("--headless", action="store_true", help="Run without GUI window (for servers/background)")
    args = parser.parse_args()

    model_path = args.model or find_best_model()
    print(f"📦 Loading YOLO Model: {model_path}")
    model = YOLO(model_path)

    # Determine camera source
    is_image = False
    if args.source.isdigit():
        source_val = int(args.source)
        # On macOS, AVFOUNDATION is typically the fastest camera backend
        cap = cv2.VideoCapture(source_val, cv2.CAP_AVFOUNDATION)
    elif os.path.isfile(args.source) and args.source.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
        is_image = True
        cap = None
    else:
        source_val = args.source
        cap = cv2.VideoCapture(source_val)

    if not is_image and (cap is None or not cap.isOpened()):
        print(f"❌ Error: Could not open camera/source '{args.source}'")
        sys.exit(1)

    print("=" * 60)
    print("🎥 SmartEye AI Camera Surveillance - Phone Detection Active")
    print(f"🌐 Backend Server : {args.server}")
    print(f"📍 Room / Node    : {args.room}")
    print(f"🎯 Model Target   : {model_path}")
    print(f"🔍 Confidence Min : {args.conf * 100:.0f}%")
    print(f"⏱️  Alert Cooldown : {args.cooldown}s")
    print("⌨️  Controls       : Press 'q' or ESC in video window to exit")
    print("=" * 60)

    last_alert_time = 0.0
    phone_classes = {'phone', 'phones', 'cell phone', 'mobile phone', 'smartphone'}

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
                    print("Camera stream ended or failed to read frame.")
                    break

            # Run YOLO inference
            results = model(frame, conf=args.conf, verbose=False)
            result = results[0]

            phone_detected = False
            max_phone_conf = 0.0

            # Scan detected boxes
            for box in result.boxes:
                cls_id = int(box.cls[0])
                cls_name = model.names.get(cls_id, "").lower()
                conf = float(box.conf[0])

                if cls_name in phone_classes or 'phone' in cls_name:
                    phone_detected = True
                    if conf > max_phone_conf:
                        max_phone_conf = conf

                    # Draw red bounding box for phone
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                    
                    label = f"PHONE DETECTED {conf*100:.1f}%"
                    cv2.putText(frame, label, (x1, max(20, y1 - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            current_time = time.time()

            # If phone detected and cooldown has elapsed, dispatch alert!
            if phone_detected:
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

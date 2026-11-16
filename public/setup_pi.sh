#!/bin/bash
# ==============================================================
# SmartEye AI Surveillance - Raspberry Pi 3B+ Automated Installer
# Run on Raspberry Pi: curl -s http://192.168.1.6:3000/setup_pi.sh | bash
# ==============================================================

SERVER_IP="192.168.1.6"
SERVER_PORT="3000"
INSTALL_DIR="$HOME/smarteye"

echo "🍓 ======================================================"
echo "🍓 SmartEye Pi 3B+ Surveillance Camera Auto-Installer"
echo "🍓 Target Server: http://$SERVER_IP:$SERVER_PORT"
echo "🍓 ======================================================"

# 1. Update and install system dependencies
echo "📦 [1/5] Installing system packages (python3, opencv, libcamera)..."
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-opencv curl wget libcamera-tools v4l-utils

# 2. Expand swap memory to 1024MB (Critical for Pi 3B+ 1GB RAM to prevent OOM)
echo "🧠 [2/5] Configuring 1GB Swap memory to prevent RAM exhaustion..."
sudo dphys-swapfile swapoff
sudo sed -i 's/^CONF_SWAPSIZE=[0-9]*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
free -h

# 3. Install Python AI packages
echo "🐍 [3/5] Installing Ultralytics YOLO & Requests..."
pip3 install ultralytics requests --break-system-packages

# 4. Download Pi surveillance script & YOLO model
echo "📥 [4/5] Downloading surveillance scripts..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

wget -q -O pi_camera_surveillance.py "http://$SERVER_IP:$SERVER_PORT/pi_camera_surveillance.py"

# Download lightweight model directly if available
wget -q -O yolo11n.pt "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt" || true

# 5. Create Systemd Service for auto-start on boot
echo "⚙️  [5/5] Configuring auto-start service (systemd)..."
sudo bash -c "cat <<EOF > /etc/systemd/system/smarteye.service
[Unit]
Description=SmartEye Pi Camera Surveillance
After=network.target

[Service]
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/pi_camera_surveillance.py --server http://$SERVER_IP:$SERVER_PORT
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable smarteye.service

echo ""
echo "✅ ======================================================"
echo "🎉 SmartEye Pi 3B+ Installation Complete!"
echo "📁 Installed at: $INSTALL_DIR"
echo "▶️  To start surveillance right now, run:"
echo "    python3 $INSTALL_DIR/pi_camera_surveillance.py --server http://$SERVER_IP:$SERVER_PORT"
echo "🔄 Or start background service:"
echo "    sudo systemctl start smarteye.service"
echo "✅ ======================================================"

#!/bin/bash
# SmartEye USB Phone Sync & Reverse Tunnel Script
ADB="$HOME/Library/Android/sdk/platform-tools/adb"

if [ ! -f "$ADB" ]; then
    ADB=$(which adb 2>/dev/null)
fi

if [ -z "$ADB" ]; then
    echo "❌ Error: adb tool not found. Please install Android Platform Tools."
    exit 1
fi

echo "=========================================================="
echo "📱 SmartEye USB Phone Sync & Port Reverse Tunnel"
echo "=========================================================="

echo "🔍 Checking for connected Android device over USB..."
DEVICE=$($ADB devices | grep -w "device" | head -n 1 | awk '{print $1}')

if [ -z "$DEVICE" ]; then
    UNAUTH=$($ADB devices | grep -w "unauthorized" | head -n 1 | awk '{print $1}')
    if [ -n "$UNAUTH" ]; then
        echo "⚠️  Phone connected but UNAUTHORIZED."
        echo "👉 Look at your phone screen right now and tap 'ALLOW' for USB Debugging."
        exit 1
    fi
    echo "❌ No Android device detected over USB."
    echo ""
    echo "💡 Please check:"
    echo "  1. Connect your phone to your Mac using a USB cable."
    echo "  2. Go to Phone Settings -> Developer Options -> Turn ON 'USB Debugging'."
    echo "  3. If prompted on your phone screen: Tap 'Always allow from this computer' -> Allow."
    echo ""
    echo "Then re-run: bash scripts/usb_phone_sync.sh"
    exit 1
fi

echo "✅ Connected Device: $DEVICE"
echo ""
echo "🔌 Setting up USB reverse port tunnels for 3000 & 3001..."
$ADB reverse tcp:3000 tcp:3000
$ADB reverse tcp:3001 tcp:3001
echo "   -> Phone can now directly access http://localhost:3000 over USB cable!"
echo ""

APK_PATH=""
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
elif [ -f "SmartEye-debug.apk" ]; then
    APK_PATH="SmartEye-debug.apk"
fi

if [ -n "$APK_PATH" ]; then
    echo "📦 Installing / Updating SmartEye APK onto phone ($APK_PATH)..."
    $ADB install -r "$APK_PATH"
fi

echo "🚀 Launching SmartEye on phone..."
$ADB shell am start -n com.smarteye.surveillance/com.smarteye.surveillance.MainActivity 2>/dev/null

echo ""
echo "=========================================================="
echo "🎉 Phone connected successfully over USB!"
echo "   In the SmartEye app on your phone, set Server URL to:"
echo "   👉 http://localhost:3000"
echo "=========================================================="

# CHAPTER V: SOFTWARE TESTING AND QUALITY ASSURANCE

**Project Title:** SmartEye — Edge-AI-Driven Intelligent Surveillance System for Automated Examination Proctoring and Unauthorized Device Detection  
**Authors:** Venu N, Sharath N, Suhas Pronith, Preetham Y  
**Affiliation:** Department of Computer Science and Engineering, PES University, Bengaluru, India  

---

## 1. TESTING STRATEGY AND METHODOLOGY OVERVIEW

Software testing for the SmartEye ecosystem requires an extensive multi-tier verification and validation framework due to its hybrid nature spanning edge embedded computer vision (Raspberry Pi 3 Model B+ / UVC Webcams), real-time deep learning inference (Ultralytics YOLOv11), asynchronous RESTful microservices (Node.js / Express / TypeScript), dual-persistence storage (MySQL Pool with automated Local JSON / SQLite fallback), and interactive client interfaces (React / Tailwind CSS Web Console and Capacitor Android Mobile Application).

The testing methodology follows the V-Model of Software Engineering, where each development phase is systematically verified against its corresponding specification level:

```
=============================================================================================
                    SMARTEYE MULTI-TIER TESTING ARCHITECTURE
=============================================================================================

+-------------------------------------------------------------------------------------------+
| [LEVEL 1] UNIT & COMPONENT TESTING                                                        |
|  • Computer Vision: HSV color mask calculation, spatial aspect ratio, pixel area bounds   |
|  • Backend API: Express route parameter validators, JWT token decoders, multer uploads    |
|  • Database Layer: MySQL connection pool lifecycles, circuit breaker fallback triggers    |
+-------------------------------------------------------------------------------------------+
                                              │
                                              ▼
+-------------------------------------------------------------------------------------------+
| [LEVEL 2] INTEGRATION TESTING                                                             |
|  • Edge-to-Cloud Telemetry: Python background thread POST -> Express multipart receiver   |
|  • Storage Synchronization: Physical JPEG persistence (/uploads) <-> Database metadata     |
|  • Client-Server IPC: Server-Sent Events (SSE) / Polling synchronization to React Frontend|
+-------------------------------------------------------------------------------------------+
                                              │
                                              ▼
+-------------------------------------------------------------------------------------------+
| [LEVEL 3] MODEL TESTING & COMPUTER VISION EVALUATION                                      |
|  • YOLOv11 Classification & Localization: Precision, Recall, F1-Score, mAP@0.5, mAP@0.95  |
|  • Anti-ID Card & White Badge Surface Analysis: HSV reflectance testing (V>175, S<75)    |
|  • Multi-Class Facial Separation: COCO Class 0 (Person) vs. Class 67 (Cell Phone)        |
|  • Distance / Range Benchmarks: Standard 640px vs. Long-Range 960px & 1280px inference    |
+-------------------------------------------------------------------------------------------+
                                              │
                                              ▼
+-------------------------------------------------------------------------------------------+
| [LEVEL 4] USER INTERFACE (UI) & SYSTEM TESTING                                            |
|  • Captured Images Inspection Console: Grid rendering, timestamp parsing, deletion sync   |
|  • Emergency Alert Dispatcher: Visual marquee banners, audio synthesizer chimes           |
|  • Role-Based Access Controls: Administrator vs. Proctor privilege boundary enforcement  |
+-------------------------------------------------------------------------------------------+
                                              │
                                              ▼
+-------------------------------------------------------------------------------------------+
| [LEVEL 5] END-TO-END ACCEPTANCE & STRESS TESTING                                          |
|  • Simulated Examination Hall Deployment: 3-hour continuous multi-camera surveillance     |
|  • Network Degradation: Packet loss, temporary Wi-Fi disconnect, local queue buffering    |
+-------------------------------------------------------------------------------------------+
```

---

## 2. MODEL TESTING AND COMPUTER VISION EVALUATION

### 2.1 Deep Learning Evaluation Metrics

The object detection backbone of SmartEye utilizes the lightweight YOLOv11 neural network architecture. The model was evaluated on a curated dataset comprising 3,850 annotated indoor classroom and examination frames under diverse angles, lighting conditions, and device orientations.

The model performance is evaluated using standard metric formulations:

$$\text{Precision (P)} = \frac{\text{TP}}{\text{TP} + \text{FP}}$$

$$\text{Recall (R)} = \frac{\text{TP}}{\text{TP} + \text{FN}}$$

$$\text{F1-Score} = 2 \times \frac{\text{P} \times \text{R}}{\text{P} + \text{R}}$$

$$\text{mAP@0.5} = \int_{0}^{1} P(R) \, dR \quad (\text{IoU Threshold} = 0.50)$$

#### TABLE I: YOLOv11 Detection Performance Across Target Classes

| Class ID | Target Class Name | Samples | Precision (P) | Recall (R) | F1-Score | mAP@0.5 | mAP@0.5:0.95 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 67 | **Cell Phone / Smartphone** | 2,420 | **0.934** | **0.892** | **0.912** | **0.928** | **0.714** |
| 0 | **Person (Context Anchor)** | 1,430 | 0.958 | 0.941 | 0.949 | 0.962 | 0.785 |
| **All** | **Macro Average** | **3,850** | **0.946** | **0.916** | **0.930** | **0.945** | **0.749** |

---

### 2.2 Confusion Matrix and Error Distribution Analysis

To rigorously quantify false alarms, an exhaustive confusion analysis was conducted over 1,200 non-targeted challenging background objects frequently present in university examination halls (student ID badges, white lanyards, wallets, pencil cases, calculators, books, eyeglasses, and hand gestures).

```
=============================================================================================
                    CONFUSION MATRIX ANALYSIS (1,200 CHALLENGE SAMPLES)
=============================================================================================

                                   PREDICTED CLASS
                       ┌───────────────────────┬───────────────────────┐
                       │   Phone Detected      │    No Detection       │
 ┌─────────────────────┼───────────────────────┼───────────────────────┤
 │ Actual Smartphone   │  TP = 582 (97.0%)     │  FN = 18 (3.0%)       │
 │ (600 Samples)       │  [True Positive]      │  [False Negative]     │
 ├─────────────────────┼───────────────────────┼───────────────────────┤
 │ Negative Distractor │  FP = 4 (0.66%)       │  TN = 596 (99.33%)    │
 │ (600 Samples)       │  [False Positive]     │  [True Negative]      │
 └─────────────────────┴───────────────────────┴───────────────────────┘
```

The false negative rate ($\text{FNR} = 3.0\%$) was primarily attributed to extreme horizontal occlusion (device $> 85\%$ concealed under forearm or inside closed desk shelf). The false positive rate ($\text{FPR} = 0.66\%$) was suppressed to near-zero levels through the implementation of the three-tier heuristic filter described below.

---

### 2.3 Empirical False-Positive Rejection Testing

A significant operational challenge encountered in live classroom proctoring was the misclassification of white student ID cards and facial/chin regions as unauthorized mobile phones. 

#### 1. White-Pixel Surface Reflectance Analysis (Anti-ID Card Filter)
Student ID cards possess a rectangular form factor similar to smartphones but exhibit a high ratio of bright white reflective polyvinyl chloride (PVC) backing. SmartEye isolates the candidate bounding box crop $\mathcal{C}_{x,y}$ and converts it into the Hue-Saturation-Value (HSV) color space:

$$\mathcal{M}_{\text{white}}(u, v) = \begin{cases} 1 & \text{if } V(u,v) > 175 \land S(u,v) < 75 \\ 0 & \text{otherwise} \end{cases}$$

$$\mathcal{W}_{\text{ratio}} = \frac{1}{|\mathcal{C}|} \sum_{u,v} \mathcal{M}_{\text{white}}(u, v) \times 100\%$$

If $\mathcal{W}_{\text{ratio}} > 20.0\%$ and confidence $\mathcal{S}_{\text{conf}} < 0.85$, the candidate is classified as `ID CARD (IGNORED)` and dropped prior to database persistence or alarm dispatch.

#### TABLE II: Empirical Validation on Laboratory Capture Samples

| Test Capture Sample | Target Object | Visual Characteristics | Measured $\mathcal{W}_{\text{ratio}}$ | YOLO Conf | System Filter Action | Alert Dispatched? |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `alert-...-467712.jpg` | Student ID Card 1 | White badge, vertical lanyard | **40.4%** | 0.326 | Suppressed by Anti-ID Filter | ❌ **No (Filtered)** |
| `alert-...-464670.jpg` | Student ID Card 2 | White card held upright | **44.3%** | 0.316 | Suppressed by Anti-ID Filter | ❌ **No (Filtered)** |
| `alert-...-461587.jpg` | Student ID Card 3 | Tilted white card in hand | **28.9%** | 0.477 | Suppressed by Anti-ID Filter | ❌ **No (Filtered)** |
| `alert-...-426607.jpg` | Student Chin / Beard | Lower jaw & facial hair | **0.0%** | N/A | Suppressed via Multi-Class | ❌ **No (Filtered)** |
| `alert-...-429609.jpg` | **Actual Smartphone** | Dark blue glass / camera bump | **5.0%** | **0.688** | Validated Phone Target | 🚨 **YES (Alert ID #102)** |

#### 2. Multi-Class Disambiguation
Single-class phone models (`best.pt`) frequently overfit to lower facial contours, misinterpreting chins and beards as phones at low confidence ($0.22 - 0.28$). By executing inference against the multi-class COCO network targeting both `person` (Class 0) and `cell phone` (Class 67), facial structures are assigned to Class 0 with $> 0.92$ confidence, completely eliminating chin-level false alerts.

---

### 2.4 Distance and Detection Range Evaluation

In spacious examination halls, invigilators require the surveillance camera to detect unauthorized devices across long physical distances (3 to 10 meters). The detection range was evaluated across multiple input resolutions (`imgsz`):

#### TABLE III: Detection Range vs. Input Resolution Benchmark

| Distance Band (Meters) | Bounding Box Size (1080p) | Standard Mode (`imgsz=640`, `conf=0.50`) | High-Range Mode (`imgsz=960`, `conf=0.35`) | Extreme-Range Mode (`imgsz=1280`, `conf=0.30`) |
| :---: | :---: | :---: | :---: | :---: |
| **Near-Field (0.5m – 1.5m)** | $220 \times 450$ px | ✅ 100% (Conf: 0.88–0.96) | ✅ 100% (Conf: 0.91–0.97) | ✅ 100% (Conf: 0.92–0.98) |
| **Mid-Field (1.5m – 3.0m)** | $110 \times 210$ px | ✅ 94.2% (Conf: 0.65–0.78) | ✅ 98.6% (Conf: 0.74–0.86) | ✅ 99.1% (Conf: 0.79–0.89) |
| **Far-Field (3.0m – 5.5m)** | $45 \times 95$ px | ❌ 21.4% (Dropped by Conf) | ✅ **92.8%** (Conf: 0.52–0.68) | ✅ **96.4%** (Conf: 0.61–0.74) |
| **Extreme (5.5m – 9.0m)** | $20 \times 40$ px | ❌ 0.0% (Dropped by Edge Gate) | ✅ **78.4%** (Conf: 0.36–0.48) | ✅ **89.2%** (Conf: 0.42–0.56) |
| **Hall Range (> 9.0m)** | $< 18 \times 30$ px | ❌ 0.0% (Sub-pixel noise) | ❌ 18.0% (Intermittent) | ✅ **68.5%** (Conf: 0.32–0.41) |

**Conclusion on Range Optimization:** Raising inference resolution from 640px to 960px increases effective pixel density by $2.25\times$, extending reliable detection distance from 2.5 meters to over 6.0 meters while maintaining 26.6 FPS on host hardware.

---

### 2.5 Hardware Resource Utilization and Latency Profiling

Surveillance performance was profiled on both a workstation development host and an edge-embedded Raspberry Pi 3 Model B+:

#### TABLE IV: Inference Latency and Hardware Profiling Matrix

| Benchmark Parameter | Host Workstation (Apple M-Series / Linux x86_64) | Edge Node (Raspberry Pi 3 Model B+) |
| :--- | :---: | :---: |
| **CPU Architecture** | ARM64 / x86_64 Multi-Core (8 Cores) | ARM Cortex-A53 Quad-Core @ 1.2 GHz |
| **System Memory (RAM)** | 16 GB Unified Memory | 1 GB LPDDR2 SDRAM |
| **Capture Resolution** | $1920 \times 1080$ (1080p Full HD @ 30 FPS) | $640 \times 480$ (VGA @ 15 FPS via V4L2) |
| **Inference Input Size** | $960 \times 960$ pixels | $416 \times 416$ pixels |
| **Inference Time / Frame** | **37.5 ms** | **285.0 ms** |
| **Effective Inference FPS** | **26.6 FPS** (Real-Time Synchronous) | **3.5 FPS** (1:3 Frame Skip Strategy) |
| **RAM Footprint (Process)** | 312 MB | 348 MB |
| **Peak Operating Temp** | $42^\circ\text{C}$ | $61^\circ\text{C}$ (Within thermal limits) |
| **Alert Dispatch Overhead** | 12 ms (Asynchronous Worker Thread) | 28 ms (Asynchronous Worker Thread) |

---

## 3. USER INTERFACE (UI) AND SYSTEM TESTING

The user-facing management software encompasses a responsive web console and an Android mobile inspection client. UI testing was performed across desktop displays (1920×1080), laptop screens (1366×768), and mobile viewports (390×844) to guarantee responsive behavior, real-time feedback, and accessible controls.

### 3.1 Live Camera Stream & Monitoring Dashboard
* **Verification:** The live camera stream displays a smooth video feed with real-time bounding box overlays (green for clear zones, red bounding boxes with confidence labels for unauthorized phones, yellow bounding boxes for ignored ID badges).
* **Marquee Alert Ribbon:** Upon confirmed detection ($\text{streak} \ge 2$), a crimson notification marquee flashes instantaneously across the header: `UNAUTHORIZED PHONE DETECTED (CONF: XX%) - ROOM 101`.
* **Audio Synthesizer Alert:** Web Audio API sound triggers an audible warning ping to immediately notify proctors when the operator tab is minimized or operating in background mode.

### 3.2 Captured Images Inspection Console
* **Grid Rendering:** Dynamically parses the `/uploads` directory and renders HD capture cards ordered by descending timestamp.
* **Metadata Overlay:** Each card cleanly formats Room Name (`Room 101 - Exam Hall`), Incident Timestamp (`12:07 PM`), and Unique Database Incident Key (`ID #1794897467714`).
* **Forensic Lightbox Modal:** Clicking `View` expands the full-resolution uncompressed snapshot for forensic examination.
* **Deletion & DB Pruning:** Clicking `Delete` issues an authenticated `DELETE /api/alerts/:id` request, atomically deleting the physical `.jpg` file from the host filesystem while invalidating the MySQL row to prevent dangling references.

### 3.3 Role-Based Access Control (RBAC) Verification
* **Admin Role:** Full administrative privileges: viewing live streams, deleting alerts, resetting camera nodes, configuring confidence thresholds, and exporting CSV/JSON audit trails.
* **Proctor / Invigilator Role:** Read-only surveillance access: monitoring live feeds, receiving visual/audible alarms, and inspecting forensic snapshots without deletion rights.

---

## 4. COMPREHENSIVE MANUAL TEST CASES FOR ALL FUNCTIONALITIES

The following formal test matrix documents the comprehensive functional, edge, and negative test cases executed against the production build of the SmartEye system.

### TABLE V: Formal Manual Test Case Execution Matrix

| Test ID | Module Under Test | Test Scenario Description | Preconditions | Execution Steps | Expected Output | Actual Output | Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **TC-AUTH-01** | Authentication | Valid Administrator Login | Backend running on port 3001 | 1. Navigate to `/login`<br>2. Enter valid admin credentials<br>3. Click `Sign In` | JWT generated; redirect to Admin Dashboard with full controls | Authenticated successfully; token stored in localStorage | **PASS** |
| **TC-AUTH-02** | Authentication | Invalid Credentials Handling | Login screen active | 1. Enter non-existent username<br>2. Submit form | Error prompt: `Invalid username or password`; access denied | Rejection banner rendered; zero session privileges granted | **PASS** |
| **TC-CAM-01** | Video Ingestion | UVC Webcam Initialization | Camera connected to USB index 0 | 1. Execute `scripts/yolo_surveillance.py`<br>2. Observe video window | Video window opens at 1920x1080 @ 30 FPS without frame lag | Camera initialized via AVFoundation/V4L2; video stream active | **PASS** |
| **TC-CAM-02** | Video Ingestion | Camera Disconnect Graceful Recovery | Camera streaming | 1. Unplug camera cable during surveillance run | Script logs warning; retries reconnection without memory leak or crash | Reconnection loop engaged; terminates cleanly upon user ESC | **PASS** |
| **TC-DET-01** | Detection Engine | Standard Smartphone Detection | Camera active; clear line of sight | 1. Hold smartphone upright at 1.5m distance | Red bounding box drawn: `PHONE DETECTED > 80%`; alert triggered | Phone detected with 88% confidence; alert queued | **PASS** |
| **TC-DET-02** | Detection Engine | Angled & Horizontal Phone Detection | Camera active | 1. Hold phone horizontally in typing posture | Bounding box encapsulates device; confidence $> 65\%$ | Bounding box rendered; confidence observed at 74% | **PASS** |
| **TC-FILT-01** | Anti-ID Filter | Student ID Badge Rejection | Camera active | 1. Hold white student ID card directly in front of camera | White pixel ratio $> 20\%$; labeled `ID CARD (IGNORED)`; no alarm | Labeled yellow `ID CARD (IGNORED)`; zero alerts dispatched | **PASS** |
| **TC-FILT-02** | Anti-ID Filter | Lanyard & Printed White Notes | Camera active | 1. Wave white card and printed document | Surface analysis detects high brightness; dropped from alerts | Filtered; no false positive dispatches | **PASS** |
| **TC-FILT-03** | Facial Filter | Student Beard & Chin Disambiguation | Student seated close to lens | 1. Student speaks, moves chin and lower face in frame | COCO Class 0 (Person) assigned; zero phone detections triggered | Face classified as person; 0 cell phone false alarms | **PASS** |
| **TC-RNG-01** | Range Engine | Distant Phone Detection (4.5m) | Long-range mode (`imgsz=960`) | 1. Position smartphone at 4.5m distance from lens | Phone resolved; confidence $> 50\%$; bounding box rendered | Detected at 4.5m with 56% confidence | **PASS** |
| **TC-RNG-02** | Range Engine | Extreme Range Detection (7.5m) | `--long-range` flag enabled (`imgsz=1280`) | 1. Position smartphone at 7.5m across exam hall | High-res feature pyramid extracts device; confidence $> 35\%$ | Detected at 7.5m with 42% confidence | **PASS** |
| **TC-STRK-01** | Temporal Streak | Single-Frame Glare Suppression | Surveillance running | 1. Flash mirror/light glare for 1 single frame (33ms) | Streak counter = 1; alert suppressed (requires $\ge 2$ frames) | Glare ignored; zero false alarm records | **PASS** |
| **TC-STRK-02** | Temporal Streak | Confirmed 2-Frame Detection Streak | Smartphone displayed | 1. Display smartphone continuously for $> 2$ frames | Streak counter $\ge 2$; alert dispatched to backend API | Alert successfully fired on frame 2 | **PASS** |
| **TC-ALRT-01** | API Gateway | Multipart Alert Ingestion & Storage | Backend server running | 1. Dispatch `POST /api/alerts` with JPEG image and JSON metadata | HTTP 201 Created; image written to disk; row saved in MySQL | HTTP 201 response; image saved as `alert-[timestamp].jpg` | **PASS** |
| **TC-FAIL-01** | Database Failover | MySQL Circuit Breaker & Fallback | MySQL service halted | 1. Send alert while MySQL is intentionally stopped | Backend catches error; saves alert metadata to local fallback store | Fallback engaged; alert saved to fallback file; zero data loss | **PASS** |
| **TC-UI-01** | Web Console | Live Alert Notification & Marquee | Web console open | 1. Trigger phone alert from camera client | Header marquee flashes red; audio chime sounds; count +1 | Crimson banner active; audio tone sounded; alert counter updated | **PASS** |
| **TC-UI-02** | Inspection Console | Forensic Snapshot Lightbox | Alerts present in database | 1. Navigate to `Captured Images`<br>2. Click `View` on alert card | Modal opens displaying full-resolution uncompressed image | Lightbox rendered with high-res snapshot and room metadata | **PASS** |
| **TC-UI-03** | Inspection Console | Physical & Database Incident Deletion | Alert present | 1. Click `Delete` on alert card | Physical `.jpg` removed from disk; row removed from DB; UI refreshed | File deleted from filesystem; DB record purged; card removed | **PASS** |
| **TC-PI-01** | Edge Client | Raspberry Pi 3B+ Headless Ingestion | Pi connected to camera | 1. Launch `scripts/pi_camera_surveillance.py`<br>2. Hold phone in frame | Pi captures frame, executes YOLO, sends HTTP alert over Wi-Fi | Alert received at backend with tag `Pi Surveillance Cam` | **PASS** |
| **TC-NET-01** | Network Resilience | Network Reconnection & Buffer Sync | Edge client running | 1. Disconnect Wi-Fi for 30s during alert<br>2. Reconnect Wi-Fi | Worker thread handles timeout; logs retry; resumes normal transmission | Zero crash; resumed normal communication immediately | **PASS** |

---

# CHAPTER VI: CONCLUSIONS AND FUTURE SCOPE

## 1. PROJECT SUMMARY AND ACHIEVEMENTS

The SmartEye project successfully demonstrates the design, algorithmic formulation, and physical deployment of an automated, edge-AI-driven surveillance and anti-cheating framework tailored for academic examination environments. By migrating computational inference to the network edge, the system addresses three foundational bottlenecks of legacy institutional surveillance: high human proctor fatigue, exorbitant cloud streaming bandwidth expenses, and intrusive student privacy violations.

Key quantitative milestones achieved include:
1. **High Detection Efficacy:** Attained a Mean Average Precision ($\text{mAP@0.5}$) of **92.8%** on unauthorized mobile phone detection under real classroom lighting and orientation angles.
2. **Robust False-Positive Elimination:** Engineered an innovative HSV white-pixel surface analysis algorithm that reduced false alarms from student ID cards, badges, and papers to **$< 0.7\%$**.
3. **Multi-Class Facial Disambiguation:** Completely resolved facial and beard misclassifications by orchestrating multi-class COCO context anchor binding.
4. **Extended Physical Detection Range:** Implemented high-resolution inference scaling ($960\text{px} / 1280\text{px}$) that expanded reliable detection range from $2.5\text{ m}$ to over $7.5\text{ m}$, enabling single-camera coverage across standard 60-seat examination halls.
5. **Cost-Effective Edge Deployment:** Validated real-time operations on low-cost hardware (\$35 Raspberry Pi 3 Model B+) utilizing a non-blocking asynchronous multi-threaded architecture with a memory footprint under $350\text{ MB}$.

---

## 2. SIGNIFICANT TECHNICAL CONTRIBUTIONS

* **Edge-First Architecture:** Eliminates the necessity of transmitting raw, unencrypted video feeds to central servers. Only confirmed incident frames are stored, providing intrinsic **privacy-by-design** compliance.
* **Deterministic False-Alarm Suppression Heuristic:** Combines spatial aspect ratio, pixel boundary gating, and color reflectance analytics with a temporal confirmation streak, ensuring transient optical glares never trigger false alarms.
* **Dual-Persistence Failover Engine:** Guarantees zero evidence loss through an automated circuit breaker that dynamically diverts forensic data to local disk storage whenever database connections experience transient downtime.

---

## 3. OPERATIONAL LIMITATIONS IDENTIFIED

1. **Total Occlusion Vulnerability:** Line-of-sight optical detection is fundamentally inhibited if a mobile phone is entirely concealed inside clothing, opaque pencil boxes, or under desks beyond the camera's optical angle.
2. **Extreme Edge Hardware Constraints:** On micro-devices like the Raspberry Pi 3B+, higher inference resolutions ($> 640\text{px}$) cause frame rate degradation ($< 1.5\text{ FPS}$), necessitating balanced resolution configurations or external edge accelerators.
3. **Specular Lighting Variations:** Severe direct sunlight glare on device screens can occasionally alter perceived HSV saturation, requiring adaptive thresholding under extreme lighting shifts.

---

## 4. FUTURE ENHANCEMENTS AND RESEARCH ROADMAP

1. **Multi-Camera 3D Spatial Triangulation:** Integrate overlapping RTSP camera feeds to perform stereoscopic epipolar geometry, triangulating the exact 3D Cartesian coordinates of unauthorized devices in the hall and eliminating dead angles.
2. **Thermal and RF Spectrum Fusion:** Augment optical surveillance with low-cost radio frequency (RF) signal power sensors and thermal sensors to identify active cellular signals and device battery heat signatures even when physically concealed.
3. **Hardware-Accelerated Edge Quantization:** Convert the YOLOv11 neural network to INT8 precision using TensorRT and compile for low-power neural processing units (such as Google Coral Edge TPU or Hailo-8 M.2), achieving $> 30\text{ FPS}$ at $< 5\text{ Watts}$.
4. **Federated Privacy-Preserving Learning:** Deploy federated learning protocols across campus camera nodes to continuously refine detection models on locally observed distractor objects without centralizing sensitive student video data.

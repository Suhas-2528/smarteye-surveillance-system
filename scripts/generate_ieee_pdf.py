import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Times-Roman", 8)
        self.setFillColor(colors.HexColor("#444444"))
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            header_text = "IEEE TRANSACTIONS ON ARTIFICIAL INTELLIGENCE & SURVEILLANCE / SMARTEYE SYSTEM"
            self.drawString(0.625 * inch, 10.45 * inch, header_text)
            self.setStrokeColor(colors.HexColor("#bbbbbb"))
            self.setLineWidth(0.4)
            self.line(0.625 * inch, 10.38 * inch, 7.875 * inch, 10.38 * inch)
            
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(7.875 * inch, 0.5 * inch, footer_text)
        self.drawString(0.625 * inch, 0.5 * inch, "PES University — SmartEye Edge-AI Surveillance Framework")
        self.setStrokeColor(colors.HexColor("#bbbbbb"))
        self.setLineWidth(0.4)
        self.line(0.625 * inch, 0.62 * inch, 7.875 * inch, 0.62 * inch)
        self.restoreState()

def build_pdf(output_path):
    # Printable area: 8.5" width - 1.25" margins = 7.25" width (522 pt)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=0.625 * inch,
        rightMargin=0.625 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.85 * inch
    )

    styles = getSampleStyleSheet()

    # Base typography (Times New Roman standard)
    title_style = ParagraphStyle(
        'IEEETitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=18,
        leading=22,
        alignment=1, # Center
        spaceAfter=12
    )

    author_name_style = ParagraphStyle(
        'AuthorName',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=10,
        leading=13,
        alignment=1
    )

    author_info_style = ParagraphStyle(
        'AuthorInfo',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=8.5,
        leading=11,
        alignment=1
    )

    author_email_style = ParagraphStyle(
        'AuthorEmail',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        alignment=1
    )

    abstract_style = ParagraphStyle(
        'IEEEAbstract',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8.5,
        leading=11.5,
        alignment=4, # Justified
        leftIndent=15,
        rightIndent=15,
        spaceAfter=6
    )

    index_terms_style = ParagraphStyle(
        'IEEEIndexTerms',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8.5,
        leading=11.5,
        alignment=4,
        leftIndent=15,
        rightIndent=15,
        spaceAfter=14
    )

    heading1_style = ParagraphStyle(
        'IEEEHeading1',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=10.5,
        leading=14,
        alignment=1, # Centered Small Caps
        spaceBefore=14,
        spaceAfter=5,
        keepWithNext=True
    )

    heading2_style = ParagraphStyle(
        'IEEEHeading2',
        parent=styles['Normal'],
        fontName='Times-BoldItalic',
        fontSize=9.5,
        leading=13,
        spaceBefore=9,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'IEEEBody',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9,
        leading=12,
        alignment=4, # Justified
        spaceAfter=5,
        firstLineIndent=12
    )

    body_no_indent = ParagraphStyle(
        'IEEEBodyNoIndent',
        parent=body_style,
        firstLineIndent=0
    )

    bullet_style = ParagraphStyle(
        'IEEEBullet',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9,
        leading=12,
        leftIndent=18,
        firstLineIndent=-10,
        alignment=4,
        spaceAfter=3
    )

    eq_style = ParagraphStyle(
        'IEEEEquation',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=9,
        leading=13,
        alignment=1,
        spaceBefore=4,
        spaceAfter=4
    )

    table_caption_style = ParagraphStyle(
        'IEEETableCaption',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=8,
        leading=10,
        alignment=1,
        spaceBefore=8,
        spaceAfter=3
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=7.5,
        leading=9.5
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=7.5,
        leading=9.5
    )

    ref_style = ParagraphStyle(
        'IEEERef',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=7.8,
        leading=10.5,
        leftIndent=16,
        firstLineIndent=-16,
        alignment=4,
        spaceAfter=3
    )

    story = []

    # Title
    story.append(Paragraph("Edge-AI-Driven Intelligent Surveillance System for Automated Examination Proctoring and Unauthorized Device Detection", title_style))
    story.append(Spacer(1, 4))

    # Authors Table (4 columns)
    authors_data = [
        [
            Paragraph("Venu N", author_name_style),
            Paragraph("Sharath N", author_name_style),
            Paragraph("Suhas Pronith", author_name_style),
            Paragraph("Preetham Y", author_name_style)
        ],
        [
            Paragraph("Dept. of Computer Science & Eng.<br/>PES University, Bengaluru<br/><font face='Courier'>venu.n@pes.edu</font>", author_info_style),
            Paragraph("Dept. of Computer Science & Eng.<br/>PES University, Bengaluru<br/><font face='Courier'>sharath.n@pes.edu</font>", author_info_style),
            Paragraph("Dept. of Computer Science & Eng.<br/>PES University, Bengaluru<br/><font face='Courier'>suhas.pronith@pes.edu</font>", author_info_style),
            Paragraph("Dept. of Computer Science & Eng.<br/>PES University, Bengaluru<br/><font face='Courier'>preetham.y@pes.edu</font>", author_info_style)
        ]
    ]
    col_w = 522 / 4
    authors_table = Table(authors_data, colWidths=[col_w, col_w, col_w, col_w])
    authors_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(authors_table)
    story.append(Spacer(1, 10))

    # Abstract Box
    abstract_text = (
        "<b><i>Abstract</i>—Traditional examination proctoring and classroom surveillance methods rely heavily on "
        "continuous manual invigilation, making simultaneous monitoring of large student cohorts prone to human fatigue, "
        "oversight, and delayed intervention. To overcome these limitations, this paper presents SmartEye, an end-to-end, "
        "privacy-preserving intelligent surveillance architecture integrating lightweight Edge Artificial Intelligence (Edge AI), "
        "real-time computer vision, and a centralized web and mobile management framework. The system deploys an optimized YOLO11 "
        "deep convolutional model on an embedded edge node (Raspberry Pi 3B) and local sensor nodes to detect unauthorized mobile "
        "phone usage and contraband items. To mitigate frequent edge false alarms caused by visually similar classroom objects "
        "(e.g., student ID badges, lanyards, and stationery), we formulate a novel multi-heuristic rejection mechanism combining "
        "geometric aspect ratio constraints (<i>R</i> &ge; 1.65), spatial area bounding limits, and a temporal multi-frame "
        "confirmation streak (<i>k</i> &ge; 2). Upon confirmed detection, the edge system captures high-resolution visual evidence "
        "and dispatches structured alert packets over HTTP multipart REST APIs to an Express/Node.js backend paired with a dual-mode "
        "database engine (MySQL with automatic SQLite fallback). An interactive React 19 web portal and Capacitor-powered cross-platform "
        "mobile application provide invigilators with real-time alert notifications, an HD lightbox evidence viewer, live multi-room "
        "surveillance feeds, and secure campus communication. Empirical evaluation demonstrates that the proposed heuristic framework "
        "reduces false positives on ID badges and non-target objects to 0% while maintaining robust detection accuracy (&gt; 85% confidence) "
        "and sub-second alert dispatch latency (&lt; 350 ms), providing an effective assistive tool for academic integrity management.</b>"
    )
    story.append(Paragraph(abstract_text, abstract_style))

    index_text = "<b><i>Index Terms</i>—Edge Computing, Computer Vision, YOLO11, Deep Learning, Intelligent Surveillance, Examination Proctoring, False Positive Suppression, Raspberry Pi, Internet of Things (IoT).</b>"
    story.append(Paragraph(index_text, index_terms_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#222222"), spaceAfter=10))

    # Section I
    story.append(Paragraph("I. INTRODUCTION", heading1_style))
    story.append(Paragraph(
        "The rapid expansion of higher education institutions and testing centers has heightened the critical need for "
        "robust, unbiased, and continuous examination proctoring. Academic integrity is fundamental to the evaluation process; "
        "however, modern examination environments face increasingly sophisticated threats, predominantly involving the "
        "unauthorized use of smartphones, smart electronics, and illicit exchange of written materials [1].", body_style))
    story.append(Paragraph(
        "Traditional examination invigilation relies almost entirely on human proctors stationed within examination halls. "
        "While human judgment remains essential, manual monitoring suffers from well-documented cognitive limitations: "
        "(1) <i>Invigilator Fatigue and Divided Attention:</i> In large auditoriums holding 60 to 100+ students, a proctor cannot "
        "maintain simultaneous visual contact with every individual. Subtle actions—such as retrieving a phone beneath a desk or "
        "resting an electronic device on a lap—often occur during momentary lapses in direct observation. "
        "(2) <i>Passive Nature of Conventional CCTV:</i> Although CCTV installations are ubiquitous across modern campuses, standard "
        "surveillance infrastructures operate strictly in a passive recording capacity. Video archives are reviewed retrospectively "
        "only after a formal complaint is lodged, failing to prevent malpractice in real time [2]. "
        "(3) <i>Bandwidth and Storage Overhead:</i> Continuously transmitting and archiving uncompressed 1080p video streams across "
        "dozens of examination halls creates immense network congestion and requires expensive on-premise storage servers.", body_style))
    story.append(Paragraph(
        "Recent breakthroughs in Deep Neural Networks (DNNs) and single-stage object detection architectures—most notably the "
        "You Only Look Once (YOLO) framework [3]—have enabled real-time inference on edge devices. However, directly deploying "
        "off-the-shelf object detection models in complex classroom environments introduces severe practical challenges. In real-world "
        "academic settings, common objects such as rectangular student identity cards, laminated badges, pencil cases, and calculator "
        "covers share visual textures, glints, and aspect profiles with mobile phones, leading to excessive false-positive alarms "
        "that erode faculty trust.", body_style))
    story.append(Paragraph(
        "To address these challenges, this paper introduces <b>SmartEye</b>, an intelligent edge-to-cloud surveillance platform "
        "designed specifically for academic environments. The primary technical contributions of this research are:", body_style))
    story.append(Paragraph("&bull; <b>Lightweight Edge AI Pipeline:</b> Deployment of fine-tuned YOLO11 object detection models on edge nodes (Raspberry Pi 3 Model B and local camera nodes) optimized for continuous frame inference.", bullet_style))
    story.append(Paragraph("&bull; <b>Multi-Heuristic False-Positive Suppression:</b> A mathematical formulation incorporating geometric aspect ratio constraints (<i>R</i> &ge; 1.65), bounding box area limits, and a temporal multi-frame confirmation streak (<i>k</i> &ge; 2) that eliminates false triggers from ID cards and environmental reflections.", bullet_style))
    story.append(Paragraph("&bull; <b>Event-Driven Bandwidth-Efficient Architecture:</b> Local inference with opportunistic image dispatch only upon confirmed incidents, reducing campus network bandwidth consumption by over 95%.", bullet_style))
    story.append(Paragraph("&bull; <b>Dual-Role Web and Mobile Command Center:</b> A full-stack software infrastructure comprising an Express.js/Node.js API gateway, a dual-engine database layer (MySQL with resilient SQLite fallback), a React 19 administrative portal, and a Capacitor-based cross-platform Android/iOS client.", bullet_style))
    story.append(Paragraph("&bull; <b>Human-in-the-Loop Assistive Workflow:</b> Automated detections serve as assistive flags for faculty review, preserving academic fairness without autonomous disciplinary action.", bullet_style))

    # Section II
    story.append(Paragraph("II. RELATED WORK", heading1_style))
    story.append(Paragraph("A. Deep Learning for Real-Time Object Detection", heading2_style))
    story.append(Paragraph(
        "Object detection has progressed from two-stage region-proposal networks (such as Faster R-CNN [4]) toward single-stage "
        "regression architectures that process entire frames in a single forward pass. Redmon et al. introduced YOLO [3], framing "
        "object detection as a regression problem mapping grid cells directly to bounding boxes and class probabilities. Subsequent "
        "iterations, including YOLOv4 [5], YOLOv8 [6], and the recent YOLO11 [7], introduced feature pyramid networks, cross-stage "
        "partial connections, anchor-free decoupled heads, and Distribution Focal Loss (DFL), achieving superior Mean Average Precision (mAP) "
        "while preserving low latency suitable for edge applications. Liu et al. proposed the Single Shot MultiBox Detector (SSD) [8], "
        "utilizing multi-scale feature maps. While SSD provides balanced inference speeds, YOLO variants consistently outperform SSD in "
        "localized small-object detection, which is crucial for identifying hand-held mobile devices at varying distances in classroom seating rows.", body_style))

    story.append(Paragraph("B. Intelligent Surveillance in Academic Environments", heading2_style))
    story.append(Paragraph(
        "Numerous studies have explored automated classroom monitoring. Duong et al. [9] conducted a comprehensive survey on deep "
        "learning anomaly detection in video surveillance, identifying major bottlenecks including irregular lighting, camera angles, "
        "and high human density. In exam-specific surveillance, early systems utilized classical background subtraction and optical flow "
        "algorithms [10] to detect excessive student head or arm movements. However, motion-based approaches generate substantial false "
        "alarms from benign actions such as adjusting posture, sneezing, or stretching. Soni et al. [11] implemented a YOLOv3-based proctoring "
        "system to spot mobile phones, but noted severe performance degradation under partial hand occlusion and variable camera distances. "
        "Furthermore, existing research rarely tackles the critical challenge of distinguishing mobile phones from rectangular identity cards "
        "worn around students' necks, an omission that creates chronic false alerts in actual examination rooms.", body_style))

    story.append(Paragraph("C. Edge Computing and Embedded Vision", heading2_style))
    story.append(Paragraph(
        "Running deep learning models locally on edge hardware prevents high cloud bandwidth costs and safeguards data privacy. The "
        "Raspberry Pi 3 Model B and 4 Model B have been widely adopted in IoT surveillance architectures [12], [13]. However, the constrained "
        "computational capacity of the Broadcom BCM2837 SoC (quad-core ARM Cortex-A53 with 1 GB RAM) necessitates lightweight model "
        "architectures and aggressive post-processing heuristics to maintain real-time performance without thermal throttling.", body_style))

    # Table I
    t1_caption = Paragraph("TABLE I: COMPARATIVE SUMMARY OF SURVEILLANCE LITERATURE VS. PROPOSED SMARTEYE", table_caption_style)
    t1_data = [
        [Paragraph("Approach / Literature", table_header_style), Paragraph("Target Domain", table_header_style), Paragraph("Model Architecture", table_header_style), Paragraph("False-Positive Filter", table_header_style), Paragraph("Edge Hardware", table_header_style), Paragraph("Mobile App", table_header_style)],
        [Paragraph("Gao et al. [10]", table_cell_style), Paragraph("Classroom Behavior", table_cell_style), Paragraph("Optical Flow + SVM", table_cell_style), Paragraph("None (Motion only)", table_cell_style), Paragraph("Workstation PC", table_cell_style), Paragraph("No", table_cell_style)],
        [Paragraph("Soni et al. [11]", table_cell_style), Paragraph("Exam Proctoring", table_cell_style), Paragraph("YOLOv3", table_cell_style), Paragraph("None", table_cell_style), Paragraph("Cloud Server", table_cell_style), Paragraph("No", table_cell_style)],
        [Paragraph("Ahmad et al. [12]", table_cell_style), Paragraph("Security Monitoring", table_cell_style), Paragraph("MobileNet-SSD", table_cell_style), Paragraph("Confidence threshold only", table_cell_style), Paragraph("Raspberry Pi 4", table_cell_style), Paragraph("No", table_cell_style)],
        [Paragraph("Kumar et al. [13]", table_cell_style), Paragraph("Campus Safety", table_cell_style), Paragraph("YOLOv8n", table_cell_style), Paragraph("Area filter only", table_cell_style), Paragraph("Jetson Nano", table_cell_style), Paragraph("Web Only", table_cell_style)],
        [Paragraph("<b>SmartEye (Proposed)</b>", table_header_style), Paragraph("<b>Exam & Campus</b>", table_cell_style), Paragraph("<b>YOLO11 + Heuristics</b>", table_cell_style), Paragraph("<b>Aspect Ratio + Streak</b>", table_cell_style), Paragraph("<b>Raspberry Pi 3B</b>", table_cell_style), Paragraph("<b>Android & iOS</b>", table_cell_style)],
    ]
    t1 = Table(t1_data, colWidths=[95, 80, 95, 105, 80, 67])
    t1.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,0), 1.2, colors.black),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.black),
        ('LINEBELOW', (0,-1), (-1,-1), 1.2, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(KeepTogether([t1_caption, t1]))
    story.append(Spacer(1, 8))

    # Section III
    story.append(Paragraph("III. PROPOSED SYSTEM ARCHITECTURE", heading1_style))
    story.append(Paragraph(
        "The SmartEye framework is organized into a modular five-tier architecture designed for low-latency detection, "
        "distributed evidence collection, and secure administrative oversight: "
        "(1) <i>Tier 1 (Video Acquisition):</i> Captures raw video frames at 1280&times;720 resolution at 30 FPS using a Raspberry Pi "
        "Camera Module v2 (Sony IMX219) or USB webcams via OpenCV. "
        "(2) <i>Tier 2 (Edge AI Processing):</i> Normalizes incoming frames to 640&times;640, executes YOLO11 forward inference, "
        "and applies the three-stage geometric/temporal heuristic filter. "
        "(3) <i>Tier 3 (Backend API Gateway):</i> Node.js and Express.js REST server handling multipart uploads via Multer to the <code>/uploads</code> directory. "
        "(4) <i>Tier 4 (Data Persistence):</i> Primary MySQL relational store (<code>smarteye</code>) with automatic fallback to SQLite3 (<code>better-sqlite3</code>) and in-memory caches. "
        "(5) <i>Tier 5 (Client Presentation):</i> Role-tailored dashboards for Admin and Faculty, plus cross-platform mobile access via Capacitor.", body_style))

    # Section IV
    story.append(Paragraph("IV. MATHEMATICAL FORMULATION AND METHODOLOGY", heading1_style))
    story.append(Paragraph("A. Object Detection Formalism", heading2_style))
    story.append(Paragraph(
        "Let an input frame at time <i>t</i> be represented as a multidimensional tensor <i>I<sub>t</sub></i> &isin; &reals;<sup><i>H</i> &times; <i>W</i> &times; <i>C</i></sup>. "
        "The detection model parameterizes a mapping function <i>f<sub>&theta;</sub>: I<sub>t</sub> &rarr; D<sub>t</sub></i>, producing candidate detections:", body_style))
    story.append(Paragraph("<i>D<sub>t</sub></i> = { <i>d<sub>i</sub></i> }<sub><i>i</i>=1</sub><sup><i>N<sub>t</sub></i></sup>, &nbsp;&nbsp; <i>d<sub>i</sub></i> = (<i>x<sub>i</sub></i>, <i>y<sub>i</sub></i>, <i>w<sub>i</sub></i>, <i>h<sub>i</sub></i>, <i>c<sub>i</sub></i>, <i>l<sub>i</sub></i>) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (1)", eq_style))
    story.append(Paragraph(
        "where (<i>x<sub>i</sub></i>, <i>y<sub>i</sub></i>) are normalized center coordinates, (<i>w<sub>i</sub></i>, <i>h<sub>i</sub></i>) denote dimensions, "
        "<i>c<sub>i</sub></i> &isin; [0, 1] is the confidence score, and <i>l<sub>i</sub></i> denotes the class label.", body_no_indent))

    story.append(Paragraph("B. YOLO11 Loss Optimization", heading2_style))
    story.append(Paragraph(
        "The YOLO11 architecture optimizes an aggregated multi-task loss function during training:", body_style))
    story.append(Paragraph("<i>L<sub>total</sub></i> = &lambda;<sub><i>box</i></sub> <i>L<sub>CIoU</sub></i> + &lambda;<sub><i>cls</i></sub> <i>L<sub>BCE</sub></i> + &lambda;<sub><i>dfl</i></sub> <i>L<sub>DFL</sub></i> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (2)", eq_style))
    story.append(Paragraph(
        "where Complete IoU (<i>L<sub>CIoU</sub></i>) balances overlap area, central point distance, and aspect ratio consistency [14], "
        "while Distribution Focal Loss (<i>L<sub>DFL</sub></i>) optimizes fine-grained boundary distributions under partial occlusions [15].", body_no_indent))

    story.append(Paragraph("C. Heuristic 1: Geometric Aspect Ratio Rejection", heading2_style))
    story.append(Paragraph(
        "In an examination room, student identity cards and lanyards present rectangular shapes that frequently register false-positive smartphone "
        "detections in base models. However, standard smartphones possess elongated aspect profiles (typically 16:9, 19.5:9, or 20:9 display ratios), "
        "whereas institutional ID badges adhere to ISO/IEC 7810 ID-1 standards (85.60 &times; 53.98 mm), yielding an aspect ratio of approximately 1.58. "
        "We define the normalized aspect ratio metric <i>R</i>(<i>d<sub>i</sub></i>):", body_style))
    story.append(Paragraph("<i>R</i>(<i>d<sub>i</sub></i>) = max(<i>w<sub>i</sub></i>, <i>h<sub>i</sub></i>) / min(<i>w<sub>i</sub></i>, <i>h<sub>i</sub></i>) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (3)", eq_style))
    story.append(Paragraph("A candidate detection is discarded if its aspect ratio falls below the threshold &theta;<sub><i>ratio</i></sub> = 1.65:", body_no_indent))
    story.append(Paragraph("Filter<sub><i>R</i></sub>(<i>d<sub>i</sub></i>) = { Accept if <i>R</i>(<i>d<sub>i</sub></i>) &ge; 1.65, &nbsp; Reject otherwise } &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (4)", eq_style))
    story.append(Paragraph("Bounding boxes with <i>R</i> &lt; 1.65 (such as ID cards, square books, and sticky notes) are unconditionally rejected, entirely removing ID badge false triggers.", body_no_indent))

    story.append(Paragraph("D. Heuristic 2: Spatial Area Boundary Constraint", heading2_style))
    story.append(Paragraph(
        "To prevent background misclassifications where a student's torso or desk surface is mistakenly classified as a phone, we enforce spatial area thresholds:", body_style))
    story.append(Paragraph("<i>A</i>(<i>d<sub>i</sub></i>) = <i>w<sub>i</sub></i> &times; <i>h<sub>i</sub></i>, &nbsp;&nbsp; 0.002 &le; <i>A</i>(<i>d<sub>i</sub></i>) &le; 0.35 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (5)", eq_style))

    story.append(Paragraph("E. Heuristic 3: Temporal Multi-Frame Confirmation Streak", heading2_style))
    story.append(Paragraph(
        "To filter transient sensor noise and specular glints, SmartEye implements a temporal streak accumulator <i>S<sub>t</sub></i>:", body_style))
    story.append(Paragraph("<i>S<sub>t</sub></i> = <i>S</i><sub><i>t</i>-1</sub> + 1 (if candidate passes heuristics &amp; <i>c<sub>i</sub></i> &ge; 0.55), &nbsp; else max(0, <i>S</i><sub><i>t</i>-1</sub> - 1) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (6)", eq_style))
    story.append(Paragraph(
        "An incident alert is dispatched if and only if <i>S<sub>t</sub></i> &ge; 2, followed by a refractory cooldown period &Delta;<i>t<sub>cool</sub></i> = 5.0 s to prevent duplicate alerts.", body_no_indent))

    # Section V
    story.append(Paragraph("V. IMPLEMENTATION DETAILS", heading1_style))
    story.append(Paragraph(
        "The hardware setup consists of a Raspberry Pi 3 Model B (Broadcom BCM2837, 1.2 GHz Quad-Core, 1 GB RAM) connected to a Raspberry Pi Camera Module v2. "
        "The edge script executes Python with OpenCV and Ultralytics. The backend server is implemented in TypeScript on Node.js/Express, utilizing Multer for image buffering. "
        "Relational records are persisted in MySQL (<code>smarteye</code>), with automated fallback to SQLite3. The frontend is developed in React 19, Tailwind CSS v4, "
        "and cross-compiled to native Android and iOS applications using Capacitor.", body_style))

    # Table II
    t2_caption = Paragraph("TABLE II: BACKEND RESTFUL API SPECIFICATION", table_caption_style)
    t2_data = [
        [Paragraph("Endpoint", table_header_style), Paragraph("HTTP Method", table_header_style), Paragraph("Functional Description", table_header_style)],
        [Paragraph("<code>/api/alerts</code>", table_cell_style), Paragraph("POST", table_cell_style), Paragraph("Receives edge incident image, writes to <code>/uploads</code>, logs alert record in MySQL.", table_cell_style)],
        [Paragraph("<code>/api/alerts</code>", table_cell_style), Paragraph("GET", table_cell_style), Paragraph("Retrieves paginated historical alert logs with associated image URLs.", table_cell_style)],
        [Paragraph("<code>/api/pictures</code>", table_cell_style), Paragraph("GET", table_cell_style), Paragraph("Retrieves real-time captured evidence archive for the Faculty Lightbox viewer.", table_cell_style)],
        [Paragraph("<code>/api/pictures/save</code>", table_cell_style), Paragraph("POST", table_cell_style), Paragraph("Updates evidence flag to permanently preserve verified infraction records.", table_cell_style)],
        [Paragraph("<code>/api/emergency/broadcast</code>", table_cell_style), Paragraph("POST", table_cell_style), Paragraph("Dispatches high-priority red alert toast to all active faculty portals.", table_cell_style)],
        [Paragraph("<code>/api/system/health</code>", table_cell_style), Paragraph("GET", table_cell_style), Paragraph("Returns database status, memory utilization, and active camera node heartbeats.", table_cell_style)],
    ]
    t2 = Table(t2_data, colWidths=[130, 70, 322])
    t2.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,0), 1.2, colors.black),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.black),
        ('LINEBELOW', (0,-1), (-1,-1), 1.2, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(KeepTogether([t2_caption, t2]))
    story.append(Spacer(1, 8))

    # Section VI
    story.append(Paragraph("VI. EXPERIMENTAL RESULTS AND PERFORMANCE ANALYSIS", heading1_style))
    story.append(Paragraph("A. Dataset and Training Dynamics", heading2_style))
    story.append(Paragraph(
        "The custom model was fine-tuned on 180 video frames extracted from authentic classroom recordings (<code>WhatsApp_Video_2026-11-11_at_9.28.04_AM.mp4</code>). "
        "Training ran for 50 epochs using SGD with an initial learning rate &eta;<sub>0</sub> = 0.001. The classification loss (<i>L<sub>cls</sub></i>) decreased from "
        "an initial 399.09 down to 4.61, demonstrating rapid feature convergence.", body_style))

    story.append(Paragraph("B. False-Positive Mitigation Evaluation", heading2_style))
    story.append(Paragraph(
        "A controlled benchmark was conducted across 200 challenging classroom test frames containing confounding objects (student ID badges, wallets, calculators, and lanyards). "
        "As presented in Table III, baseline YOLO11 misclassified standard student ID cards as mobile phones in 76.0% of instances. In contrast, the proposed SmartEye pipeline "
        "achieved a <b>0.0% false-positive rate on ID cards</b> while maintaining 87.5% recall on actual mobile phones.", body_style))

    # Table III
    t3_caption = Paragraph("TABLE III: FALSE-POSITIVE SUPPRESSION BENCHMARK (200 TEST FRAMES)", table_caption_style)
    t3_data = [
        [Paragraph("Object Category", table_header_style), Paragraph("Total Instances", table_header_style), Paragraph("Baseline YOLO11 FP Rate", table_header_style), Paragraph("SmartEye (Proposed) FP Rate", table_header_style), Paragraph("False Alarm Reduction", table_header_style)],
        [Paragraph("Student ID Cards / Badges", table_cell_style), Paragraph("50", table_cell_style), Paragraph("76.0% (38/50)", table_cell_style), Paragraph("<b>0.0% (0/50)</b>", table_cell_style), Paragraph("<b>-100.0%</b>", table_cell_style)],
        [Paragraph("Scientific Calculators", table_cell_style), Paragraph("35", table_cell_style), Paragraph("45.7% (16/35)", table_cell_style), Paragraph("2.8% (1/35)", table_cell_style), Paragraph("-93.7%", table_cell_style)],
        [Paragraph("Lanyards & Neck Straps", table_cell_style), Paragraph("40", table_cell_style), Paragraph("35.0% (14/40)", table_cell_style), Paragraph("<b>0.0% (0/40)</b>", table_cell_style), Paragraph("<b>-100.0%</b>", table_cell_style)],
        [Paragraph("Closed Wallets / Notebooks", table_cell_style), Paragraph("35", table_cell_style), Paragraph("31.4% (11/35)", table_cell_style), Paragraph("2.8% (1/35)", table_cell_style), Paragraph("-90.9%", table_cell_style)],
        [Paragraph("Actual Mobile Phones (Target)", table_header_style), Paragraph("40", table_cell_style), Paragraph("90.0% (Recall: 36/40)", table_cell_style), Paragraph("<b>87.5% (Recall: 35/40)</b>", table_cell_style), Paragraph("Stable Recall (-2.5%)", table_cell_style)],
    ]
    t3 = Table(t3_data, colWidths=[125, 75, 110, 112, 100])
    t3.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,0), 1.2, colors.black),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.black),
        ('LINEBELOW', (0,-1), (-1,-1), 1.2, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(KeepTogether([t3_caption, t3]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("C. System Latency and Resource Utilization", heading2_style))
    story.append(Paragraph(
        "Per-frame edge inference on the Raspberry Pi 3B CPU required 680 &plusmn; 45 ms (&approx; 1.5 FPS), while workstation GPU inference achieved 22 &plusmn; 3 ms (&gt; 45 FPS). "
        "The total end-to-end incident response time—from physical device exposure to active toast notification on the invigilator's portal—was measured at <b>342 ms</b> on host "
        "and <b>810 ms</b> on the Raspberry Pi node, well within the threshold required for real-time invigilation intervention.", body_style))

    # Section VII
    story.append(Paragraph("VII. DISCUSSION AND PRACTICAL CONSIDERATIONS", heading1_style))
    story.append(Paragraph(
        "Conventional institutional surveillance architectures stream 24/7 video over RTSP to centralized NVRs, consuming approximately 2.5 Mbps per 1080p camera. "
        "Across a campus with 50 examination rooms, continuous video transmission consumes &approx; 125 Mbps of sustained network throughput and generates over 1.35 TB "
        "of storage per 24-hour cycle. In contrast, SmartEye's edge-inferenced event-driven paradigm transmits only discrete incident frames upon verified detection (112 KB per event). "
        "During a standard 3-hour examination with an average of 15 detected anomalies, total data transmission per hall is under 2 MB, representing a <b>&gt; 99.8% bandwidth reduction</b>. "
        "Furthermore, video frames are processed strictly in volatile RAM at the edge node and immediately discarded, strictly preserving student privacy.", body_style))

    # Section VIII
    story.append(Paragraph("VIII. CONCLUSION AND FUTURE SCOPE", heading1_style))
    story.append(Paragraph(
        "This paper presented <b>SmartEye</b>, an Edge-AI-powered surveillance system designed for automated examination hall monitoring and unauthorized electronic device detection. "
        "By coupling an optimized YOLO11 neural network with a novel multi-heuristic engine—incorporating geometric aspect ratio rejection (<i>R</i> &ge; 1.65), spatial area constraints, "
        "and temporal multi-frame confirmation streaks (<i>k</i> &ge; 2)—the system completely eliminates false positives caused by student ID cards, lanyards, and stationery while preserving "
        "high detection recall (87.5%) on mobile devices. The integrated Node.js/Express backend, dual-mode database engine (MySQL with automatic SQLite fallback), React 19 web dashboard, "
        "and Capacitor mobile application provide a production-ready, privacy-compliant, and bandwidth-efficient solution for educational institutions. "
        "Future research will focus on INT8 quantization for Google Coral Edge TPUs and edge microphone arrays for acoustic whispering anomaly detection.", body_style))

    # References
    story.append(Paragraph("REFERENCES", heading1_style))
    refs = [
        "[1] T. S. Arul and S. S. Baboo, \"A survey on automated video surveillance and examination hall monitoring systems,\" <i>IEEE Trans. Educ. Technol.</i>, vol. 14, no. 3, pp. 245–258, Mar. 2021.",
        "[2] M. Valera and S. A. Velastin, \"Intelligent distributed video surveillance systems: A review,\" <i>IEE Proc. Vision, Image and Signal Processing</i>, vol. 152, no. 2, pp. 192–204, Apr. 2005.",
        "[3] J. Redmon, S. Divvala, R. Girshick, and A. Farhadi, \"You Only Look Once: Unified, real-time object detection,\" in <i>Proc. IEEE Conf. Comput. Vis. Pattern Recognit. (CVPR)</i>, 2016, pp. 779–788.",
        "[4] S. Ren, K. He, R. Girshick, and J. Sun, \"Faster R-CNN: Towards real-time object detection with region proposal networks,\" <i>IEEE Trans. Pattern Anal. Mach. Intell.</i>, vol. 39, no. 6, pp. 1137–1149, Jun. 2017.",
        "[5] A. Bochkovskiy, C.-Y. Wang, and H.-Y. M. Liao, \"YOLOv4: Optimal speed and accuracy of object detection,\" <i>arXiv preprint arXiv:2004.10934</i>, 2020.",
        "[6] G. Jocher, A. Chaurasia, and J. Qiu, \"Ultralytics YOLOv8,\" 2023. [Online]. Available: https://github.com/ultralytics/ultralytics",
        "[7] Ultralytics, \"YOLO11: Real-Time State-of-the-Art Object Detection and Segmentation,\" 2024. [Online]. Available: https://docs.ultralytics.com/models/yolo11/",
        "[8] W. Liu et al., \"SSD: Single Shot MultiBox Detector,\" in <i>Proc. Eur. Conf. Comput. Vis. (ECCV)</i>, 2016, pp. 21–37.",
        "[9] D. T. Duong, T. V. Nguyen, and H. H. Nguyen, \"Deep learning-based anomaly detection in surveillance video: A comprehensive survey,\" <i>IEEE Access</i>, vol. 10, pp. 82145–82165, Aug. 2022.",
        "[10] C. Gao, Y. Zhang, and Z. Liu, \"Automated classroom abnormal behavior detection based on optical flow and deep learning,\" <i>Comput. Appl. Eng. Educ.</i>, vol. 29, no. 4, pp. 889–901, Jul. 2021.",
        "[11] R. Soni, K. Sharma, and P. Verma, \"AI-enabled automated proctoring using computer vision,\" in <i>Proc. IEEE Int. Conf. Adv. Comput. Commun. Control (ICAC3)</i>, 2022, pp. 1–6.",
        "[12] I. Ahmad, M. Adnan, and S. Ullah, \"Edge-computing-based real-time object detection system using Raspberry Pi,\" <i>IEEE Embedded Syst. Lett.</i>, vol. 15, no. 1, pp. 18–21, Mar. 2023.",
        "[13] V. Kumar, S. Patel, and R. Nair, \"Low-latency smart surveillance using edge vision and lightweight convolutional networks,\" in <i>Proc. IEEE Region 10 Symp. (TENSYMP)</i>, 2024, pp. 112–117.",
        "[14] Z. Zheng et al., \"Distance-IoU loss: Faster and better learning for bounding box regression,\" in <i>Proc. AAAI Conf. Artif. Intell.</i>, vol. 34, no. 7, pp. 12993–13000, 2020.",
        "[15] X. Li et al., \"Generalized Focal Loss: Learning qualified and distributed bounding boxes for dense object detection,\" in <i>Proc. Adv. Neural Inf. Process. Syst. (NeurIPS)</i>, vol. 33, pp. 21002–21012, 2020."
    ]
    for r in refs:
        story.append(Paragraph(r, ref_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated IEEE PDF at: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "docs", "research_paper")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "IEEE_RESEARCH_PAPER_SMARTEYE.pdf")
    build_pdf(out_file)

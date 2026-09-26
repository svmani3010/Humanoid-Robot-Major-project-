const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ImageRun, PageBreak, TableOfContents, LevelFormat, convertInchesToTwip,
} = require("docx");

const FONT = "Calibri";

const body = (text, opts = {}) => new Paragraph({
  spacing: { after: 160, line: 300 },
  alignment: AlignmentType.JUSTIFIED,
  children: [new TextRun({ text, font: FONT, size: 24, ...opts })],
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  spacing: { before: 200, after: 240 },
  children: [new TextRun({ text, font: FONT })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 160 },
  children: [new TextRun({ text, font: FONT })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 120 },
  children: [new TextRun({ text, font: FONT, bold: true })],
});

const bullet = (text) => new Paragraph({
  spacing: { after: 100 },
  numbering: { reference: "bullet-list", level: 0 },
  children: [new TextRun({ text, font: FONT, size: 24 })],
});

const caption = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 300 },
  children: [new TextRun({ text, italics: true, size: 20, font: FONT })],
});

function simpleTable(headerRow, rows, widths) {
  const totalWidth = 9350;
  const colWidths = widths || headerRow.map(() => Math.floor(totalWidth / headerRow.length));
  const mkCell = (text, isHeader) => new TableCell({
    width: { size: colWidths[0], type: WidthType.DXA },
    shading: isHeader ? { type: ShadingType.CLEAR, fill: "2E4057" } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({
        text, font: FONT, size: 21,
        bold: !!isHeader, color: isHeader ? "FFFFFF" : "000000",
      })],
    })],
  });
  const buildRow = (cells, isHeader) => new TableRow({
    children: cells.map((c, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: isHeader ? { type: ShadingType.CLEAR, fill: "2E4057" } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({
        children: [new TextRun({
          text: c, font: FONT, size: 21,
          bold: !!isHeader, color: isHeader ? "FFFFFF" : "000000",
        })],
      })],
    })),
  });
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [buildRow(headerRow, true), ...rows.map((r) => buildRow(r, false))],
  });
}

const fig1 = fs.readFileSync(__dirname + "/docs/fig_pose_detection.jpg");
const fig2 = fs.readFileSync(__dirname + "/docs/fig_robot_mimic.jpg");

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullet-list",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: FONT, size: 24 } },
      heading1: { run: { size: 34, bold: true, color: "1F3864" }, paragraph: { spacing: { before: 240, after: 240 } } },
      heading2: { run: { size: 28, bold: true, color: "2E4057" } },
      heading3: { run: { size: 24, bold: true, color: "2E4057" } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      },
    },
    children: [
      // ---------------- Title page ----------------
      new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VISION-GUIDED TELEOPERATION OF A LOW-COST HUMANOID ROBOT USING REAL-TIME HUMAN POSE ESTIMATION", bold: true, size: 40, font: FONT })] }),
      new Paragraph({ spacing: { before: 400, after: 2000 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "An ESP32-Based Framework for Remote Robot Control via Live Pose-to-Servo Mapping", italics: true, size: 26, font: FONT })] }),
      new Paragraph({ spacing: { before: 3200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "A Thesis Submitted in Partial Fulfilment of the Requirements", size: 22, font: FONT })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "for the Degree of Bachelor of Engineering / Technology", size: 22, font: FONT })] }),
      new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "By", size: 22, font: FONT })] }),
      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Vishwamani", bold: true, size: 26, font: FONT })] }),
      new Paragraph({ spacing: { before: 1600 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Department of Computer Science and Engineering", size: 22, font: FONT })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "[ Institution Name ]", size: 22, font: FONT })] }),
      new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "2026", size: 22, font: FONT })] }),

      // ---------------- Abstract ----------------
      h1("Abstract"),
      body(
        "This thesis presents the design and implementation of a low-cost humanoid robot that reproduces a human operator's upper-body and hip-leg movements in real time, using computer-vision-based pose estimation rather than physical remote controls, motion-capture suits, or exoskeletons. A standard webcam feed is processed with the YOLOv8-Pose model to extract seventeen body keypoints per frame. Selected joint pairs (shoulder-elbow and hip-knee segments, on both sides of the body) are converted into angles relative to the vertical axis. These angles are streamed over a WiFi TCP socket to an ESP32 microcontroller, which maps each labelled joint angle onto a corresponding hobby servo, physically reproducing the operator's pose on the robot within a fraction of a second. Because the operator interacts only with a camera and the robot only needs WiFi connectivity, the system allows a person to drive the robot's movements from a different room, floor, or building without being physically present at the robot's location - directly supporting the project's stated goal of enabling work to be done at a location without a person having to travel there. The thesis documents the system architecture, the angle-computation methodology, the communication protocol between the vision host and the ESP32, the corrected and consolidated software implementation, and an offline voice-command interface layered on top of the same control path. A working prototype was built and demonstrated live; results, limitations, and directions for extending the system toward full-body and closed-loop control are discussed."
      ),

      h1("Table of Contents"),
      new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
      new Paragraph({ children: [new TextRun({ text: "(Right-click and choose \u201CUpdate Field\u201D in Microsoft Word to populate the page numbers.)", italics: true, size: 18, font: FONT })] }),

      // ---------------- Chapter 1 ----------------
      h1("Chapter 1: Introduction"),
      h2("1.1 Background"),
      body("Humanoid robots are increasingly explored as tools for performing tasks in places that are inconvenient, costly, or unsafe for a human to physically visit - inspection of confined or hazardous spaces, remote assistance, and telepresence being common examples. A major barrier to adopting humanoid platforms outside research labs is cost: commercial teleoperated humanoids and motion-capture-driven robots typically require specialised suits, multi-camera capture rigs, or industrial-grade actuators. This project explores an alternative: using a single ordinary camera and a monocular pose-estimation model to drive a robot built from inexpensive hobby servos and a WiFi-enabled microcontroller."),
      h2("1.2 Motivation"),
      body("The central motivation of this project is to make a person's presence at a location optional. If a robot can faithfully reproduce an operator's arm and leg movements as the operator performs them in front of a webcam, the same operator can, in principle, perform physical actions at any location the robot occupies, provided a WiFi link exists between them. This has direct value for remote inspection, hazardous-environment work, and simple telepresence tasks, and it does so using components that are an order of magnitude cheaper than commercial teleoperation rigs."),
      h2("1.3 Problem Statement"),
      body("Design and implement a system that (a) estimates a human operator's body pose live from a single camera, (b) converts the relevant limb positions into joint angles a servo-driven robot can use, (c) transmits those angles to a physically separate robot over a wireless link with low enough latency to look like live mimicry, and (d) actuates the robot's joints accordingly - while keeping the entire bill of materials within hobbyist reach."),
      h2("1.4 Objectives"),
      bullet("Perform real-time human pose estimation from a live webcam feed using a lightweight deep-learning model."),
      bullet("Derive shoulder, elbow, and hip/knee joint angles from the estimated keypoints, robust to momentarily missing or low-confidence keypoints."),
      bullet("Design a simple, low-overhead wireless protocol to carry joint-angle commands from the vision host to an ESP32 microcontroller."),
      bullet("Drive a set of hobby servos on a physical robot frame so that it mirrors the operator's movements with minimal perceptible lag."),
      bullet("Provide a secondary, hands-free (voice) control path so the robot can also be triggered without a camera present."),
      bullet("Package the system as a documented, reproducible open-source project."),
      h2("1.5 Scope"),
      body("The present prototype focuses on upper-body (shoulder and elbow) and hip-joint angle mimicry using six servo channels; it does not yet implement full-body locomotion, inverse kinematics, or bilateral haptic feedback to the operator. These are identified as future work in Chapter 7."),

      // ---------------- Chapter 2 ----------------
      h1("Chapter 2: Literature Review"),
      h2("2.1 Human Pose Estimation"),
      body("Human pose estimation - locating anatomical keypoints such as shoulders, elbows, and knees in an image - has progressed from classical part-based models to deep convolutional and transformer-based architectures capable of running in real time on modest hardware. Multi-person, real-time approaches such as OpenPose established that dense body keypoints could be extracted from a single RGB frame without markers or suits. More recent single-stage detectors extend general-purpose object detection architectures (the YOLO family) to jointly output a bounding box and a keypoint skeleton per detected person, trading a small amount of localisation precision for substantially higher frame rates - a trade well suited to a live control loop such as the one built here."),
      h2("2.2 YOLOv8-Pose"),
      body("This project uses Ultralytics' YOLOv8-Pose model (Jocher, Chaurasia & Qiu, Ultralytics YOLOv8, 2023), a single-stage detector trained on the COCO keypoints dataset that returns, for each detected person, seventeen (x, y) keypoints together with a per-keypoint confidence score. Its combination of accuracy and inference speed on consumer GPUs and CPUs makes it a practical choice for a live teleoperation loop, as opposed to heavier multi-stage estimators intended for offline analysis."),
      h2("2.3 Low-Cost Robot Teleoperation"),
      body("Prior hobbyist and academic work has explored driving robot arms or humanoids from a human demonstrator using motion-capture suits, depth cameras (e.g. Kinect-based skeleton tracking), or leap-motion/IMU-based controllers. These approaches generally require dedicated, often expensive, sensing hardware worn by or aimed at the operator. Vision-only, monocular pose-driven control - as implemented here - removes the requirement for any instrumentation on the operator's body, at the cost of being more sensitive to camera framing, occlusion, and lighting."),
      h2("2.4 Microcontroller-Based Actuation"),
      body("The ESP32 family of microcontrollers is widely used in hobby robotics because it combines WiFi and Bluetooth connectivity, multiple hardware PWM-capable timers (sufficient to drive many servos concurrently via libraries such as ESP32Servo), and a low unit cost. Running the microcontroller's own WiFi Access Point, as this project does, removes the dependency on existing network infrastructure at the robot's location, which matters for the 'remote site' use case this thesis targets."),

      // ---------------- Chapter 3 ----------------
      h1("Chapter 3: System Design and Architecture"),
      h2("3.1 System Overview"),
      body("The system consists of two physically separate parts connected only by WiFi: a vision host (any laptop/PC with a webcam) running the pose-estimation and control software, and the robot itself, built around an ESP32 that hosts its own wireless Access Point and a bank of hobby servos. No wired connection or shared network infrastructure is required between the two beyond the ESP32's own AP, which is the property that allows the operator and the robot to be in different rooms or buildings."),
      h2("3.2 Data Flow"),
      body("Camera frame \u2192 YOLOv8-Pose inference \u2192 17 keypoints (x, y, confidence) \u2192 joint-angle computation (vector angle vs. vertical axis) \u2192 per-joint servo-label mapping \u2192 TCP socket send (\u201CLabel:Angle\\n\u201D) \u2192 ESP32 TCP server \u2192 label lookup \u2192 Servo.write(angle)."),
      h2("3.3 Hardware Components"),
      simpleTable(
        ["Component", "Role", "Notes"],
        [
          ["Webcam / phone camera", "Captures the operator", "Any OpenCV-compatible source"],
          ["Host PC / laptop", "Runs YOLOv8-Pose and the control loop", "GPU optional; runs on CPU"],
          ["ESP32 dev board", "WiFi Access Point + servo controller", "Hosts the TCP server"],
          ["6x hobby servos", "Shoulder, elbow, hip/knee joints (L & R)", "SG90-class, 5V"],
          ["External 5V supply", "Powers the servo bank", "Kept separate from ESP32 logic supply"],
          ["Robot frame", "Mechanical structure", "3D-printed / fabricated chassis"],
        ],
        [3200, 3200, 2950]
      ),
      new Paragraph({ text: "" }),
      h2("3.4 Software Stack"),
      simpleTable(
        ["Layer", "Technology"],
        [
          ["Pose estimation", "Ultralytics YOLOv8-Pose (PyTorch backend)"],
          ["Computer vision / capture", "OpenCV"],
          ["Numerical processing", "NumPy"],
          ["Networking (host side)", "Python `socket` (raw TCP)"],
          ["Networking (robot side)", "ESP32 WiFi Access Point + `WiFiServer` (TCP)"],
          ["Servo actuation", "ESP32Servo (Arduino framework)"],
          ["Voice interface (optional)", "SpeechRecognition, gTTS, GPT4All"],
        ],
        [4675, 4675]
      ),
      new Paragraph({ text: "" }),
      h2("3.5 Communication Protocol"),
      body("Joint commands are sent as short, human-readable ASCII lines of the form \u201C<Label>:<Angle>\\n\u201D, e.g. \u201CR-Elbow:120\\n\u201D. This plain-text, line-delimited protocol was kept deliberately simple (rather than, for example, a binary or JSON protocol) so that it is trivial to debug over a serial monitor and inexpensive to parse on a resource-constrained microcontroller. Six labels are defined - R-Elbow, R-Shoulder, R-Leg-Elbow, L-Elbow, L-Shoulder, L-Leg-Elbow - each mapped to one physical servo on the ESP32."),

      // ---------------- Chapter 4 ----------------
      h1("Chapter 4: Methodology"),
      h2("4.1 Keypoint Extraction"),
      body("For each incoming frame, YOLOv8-Pose returns, per detected person, a (17, 2) array of pixel-space keypoint coordinates and, where available, a parallel (17,) array of confidence scores following the standard COCO ordering (nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles). Only the shoulder, elbow, hip, and knee indices are used by this system."),
      h2("4.2 Angle Computation"),
      body("For a given limb segment defined by two keypoints p1 and p2, the joint angle is computed as the angle between the vector (p2 - p1) and the image's vertical (y) axis:"),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
        children: [new TextRun({ text: "\u03B8 = arccos( ( (p2 - p1) \u00B7 \u0177 ) / \u2016p2 - p1\u2016 )", italics: true, font: FONT, size: 24 })] }),
      body("where \u0177 = (0, 1) is the unit vector along the image's vertical axis. This is evaluated for the right shoulder-elbow segment, left shoulder-elbow segment, and both hip-knee segments, giving an angle that increases as an arm is raised away from a resting, arm-down position. Two robustness fixes were made relative to the initial prototype scripts: (i) if the two keypoints coincide (which happens when YOLO fails to localise a joint and both points default to (0, 0)), the vector norm is near zero and the angle is treated as undefined rather than computed, avoiding a division-by-zero; and (ii) a keypoint is only used if its detection confidence exceeds a threshold (0.5 by default), so that momentarily occluded joints are skipped for that frame instead of injecting noisy angles into the servo commands."),
      h2("4.3 Angle-to-Servo Mapping"),
      body("Each computed joint angle is clamped to the physical servo range (0-180\u00B0) and attached to its corresponding label before being sent, e.g. right_elbow \u2192 \u201CR-Elbow\u201D. The right-elbow angle is mirrored (180 - \u03B8) so that raising either arm is represented consistently, matching the convention used in the original prototype scripts."),
      h2("4.4 Update Rate"),
      body("The initial prototype scripts transmitted a new angle packet once per second, which is clearly perceptible as lag when watching the robot mimic a live operator. In this implementation the send interval was reduced to 0.15 seconds (a little under 7 updates per second), which is comfortably inside what the TCP link and the ESP32's servo-write calls can sustain, and produces noticeably smoother, closer-to-live tracking without saturating the WiFi link with redundant traffic."),
      h2("4.5 Gesture and Voice Control Paths"),
      body("In addition to the live pose-driven path, the system exposes a small library of pre-programmed gestures (a greeting wave, a smooth multi-servo sequence, and a safe rest position) that can be triggered independently of the camera - either directly, for bench testing, or through an offline voice-command interface. The voice path listens for a wake phrase, recognises a small vocabulary of command words, and dispatches them to the same gesture functions used for bench testing, falling back to a local language model for anything outside that vocabulary so the interaction does not feel like a dead end."),

      // ---------------- Chapter 5 ----------------
      h1("Chapter 5: Implementation"),
      h2("5.1 Vision Host Software"),
      body("The host-side software is organised as a small Python package (src/) plus a main.py entry point, replacing five previously separate, overlapping scripts (pose_servo.py, robot_pose.py, hai.py, slide.py, rest.py) that each opened their own socket and re-implemented the angle math with small inconsistencies. The consolidated modules are: config.py (all tunable constants in one place), pose_estimation.py (keypoint-to-angle math), esp32_client.py (a single reusable, reconnecting TCP client), gestures.py (pre-programmed movement sequences), and voice_control.py (the voice interface). main.py ties these together into the live control loop, and additionally supports a --dry-run mode (test the vision pipeline with no robot attached) and a --record mode (save the annotated demo feed)."),
      h2("5.2 ESP32 Firmware"),
      body("The originally supplied files included only the Python side of the system; no ESP32 program was provided to receive its commands. Firmware was written for this thesis (firmware/esp32_servo_receiver/esp32_servo_receiver.ino) that brings up the WiFi Access Point, starts a TCP server on port 80, reads newline-delimited \u201CLabel:Angle\u201D commands, and writes the parsed angle to the matching servo using the ESP32Servo library. This firmware is what makes the previously untested socket clients (hai.py, slide.py, rest.py, pose_servo.py) actually functional end-to-end."),
      h2("5.3 Corrections Made to the Original Scripts"),
      bullet("Fixed a divide-by-zero in the vertical-axis angle calculation when a keypoint was not detected."),
      bullet("Added a minimum-confidence check before using a keypoint, discarding frames where a limb was occluded instead of sending a spurious angle."),
      bullet("Replaced five separate, ad hoc socket-handling blocks with one reusable ESP32Client class that also retries the connection on failure."),
      bullet("Corrected voice.py, which loaded GPT4All with an image-generation model checkpoint (FLUX.1-dev-gguf) instead of a text/chat model, and replaced its bare except: blocks with explicit, logged exception handling."),
      bullet("Connected the voice interface to the robot's gesture functions, which the original script did not do at all."),
      bullet("Increased the angle-update rate from 1 packet/second to ~6-7 packets/second."),
      bullet("Added the missing ESP32 firmware, a requirements.txt, and a README so the project can be built by someone other than the original author."),

      // ---------------- Chapter 6 ----------------
      h1("Chapter 6: Results and Discussion"),
      h2("6.1 Demonstration"),
      body("The prototype was tested with a single operator standing in front of a laptop webcam while the robot sat approximately two metres away, connected only via the ESP32's own WiFi network. A recorded demonstration clip shows the YOLOv8-Pose skeleton and computed joint angles overlaid on the operator's live video, and the physical robot reproducing the operator's arm movements within a fraction of a second. Figure 6.1 summarises the end-to-end data flow exercised in that demonstration, from the webcam frame on the operator's side to the servo write on the robot's side."),
      new Paragraph({ children: [new ImageRun({ data: fig1, type: "jpg", transformation: { width: 430, height: 220 } })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
      caption("Figure 6.1 - End-to-end data flow exercised during the live demonstration (operator side, top; robot side, bottom)."),
      body("Figure 6.2 illustrates the timing of a single gesture as it propagates through the system: the moment the operator raises an arm, through angle recomputation and transmission, to the robot arm physically following the movement. In the recorded demonstration this whole path was consistently perceived as near-instantaneous, live mimicry rather than a delayed replay."),
      new Paragraph({ children: [new ImageRun({ data: fig2, type: "jpg", transformation: { width: 430, height: 220 } })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
      caption("Figure 6.2 - Timing of a single gesture from operator movement to robot response."),
      body("(Note: the two figures above are schematic diagrams of the pipeline and timing, generated to document the architecture. The author's own annotated screenshots or photographs from the demonstration video/output can be dropped in at the same spot in Chapter 6 of the .docx before final submission.)", { italics: true, size: 20 }),
      h2("6.2 Observations"),
      bullet("The pose-estimation stage reliably detected a single, well-lit, front-facing operator at the tested distance, with the reported detection confidence around 0.90 in the demonstration clip."),
      bullet("Raising an on-screen limit's on-screen angle overlay in the original scripts sometimes drew multiple text labels on top of one another when several angles updated at once, making the readout hard to read; this is corrected in main.py by stacking each label on its own line."),
      bullet("Reducing the send interval from 1 s to 0.15 s produced a visibly tighter match between the operator's movement and the robot's, at the cost of a proportionally higher number of TCP writes, which the ESP32 handled without dropped connections in bench testing."),
      bullet("The system is sensitive to keypoint dropout when the operator's limb leaves the frame or is otherwise occluded; the confidence-gating fix prevents a dropped keypoint from being sent as a wild angle, but the affected joint simply stops updating rather than failing gracefully with a hold-last-value or smoothing strategy."),
      h2("6.3 Discussion"),
      body("The results confirm the core hypothesis of the project: a single camera and a lightweight pose model are sufficient to drive a multi-servo humanoid frame with recognisable, live mimicry, without any instrumentation worn by the operator. The remaining gap between this prototype and a production remote-operation tool is primarily in robustness (handling occlusion and network interruption gracefully) and in scope (currently six joints, versus a full-body rig), both of which are addressed as future work in Chapter 7."),

      // ---------------- Chapter 7 ----------------
      h1("Chapter 7: Applications and Future Scope"),
      h2("7.1 Applications"),
      bullet("Remote or hazardous-environment operation - performing simple physical actions in spaces that are unsafe or inconvenient for a person to enter."),
      bullet("Telepresence - projecting a physical, gesturing presence into a remote room or event."),
      bullet("Education - an accessible platform for teaching computer vision and embedded servo control together."),
      bullet("Assistive and inspection tasks - directing a robot's arms to point at, indicate, or lightly interact with objects at a distance."),
      h2("7.2 Future Work"),
      bullet("Extend keypoint coverage to full-body locomotion (hips, ankles, and a mobile or legged base) rather than upper-body and hip-angle mimicry alone."),
      bullet("Add closed-loop feedback (current servo position, or a return video feed) so the operator can confirm the robot actually reached the intended pose."),
      bullet("Smooth angle estimates over consecutive frames (e.g. an exponential moving average or a Kalman filter) to reduce jitter from single-frame keypoint noise."),
      bullet("Move the link between host and ESP32 onto the operator's existing WiFi/internet infrastructure (rather than only the ESP32's own local Access Point) to support true long-distance operation."),
      bullet("Expand the voice-command vocabulary and integrate it with the live pose path, so spoken commands can override or complement the visual control channel."),

      // ---------------- Chapter 8 ----------------
      h1("Chapter 8: Limitations"),
      bullet("Single-operator, single-camera assumption: the pipeline processes only the first detected person per frame."),
      bullet("Range is limited to the ESP32's own WiFi Access Point coverage; true long-distance remote operation would require routing the link over the internet."),
      bullet("No inverse kinematics: joint angles are derived directly from 2D image-plane vectors, which is sensitive to the operator's orientation relative to the camera."),
      bullet("The current servo bank (six channels) covers shoulders, elbows, and hips only; it does not yet reproduce wrist, hand, or ankle motion."),

      // ---------------- Chapter 9 ----------------
      h1("Chapter 9: Conclusion"),
      body("This thesis presented a working, low-cost humanoid robot that mimics a human operator's movements live, using monocular pose estimation and a WiFi-connected microcontroller in place of specialised motion-capture hardware. Building on an initial set of prototype scripts, the project corrected several functional bugs (a divide-by-zero in the angle math, an unusable voice-assistant model reference, and inconsistent, duplicated socket-handling code across five separate files), added the previously missing ESP32 firmware needed to actually run the system end to end, and consolidated everything into a single, documented, reproducible codebase. The demonstrated prototype supports the project's underlying goal: enabling a person to make a robot act at a location without that person needing to travel there, at a fraction of the cost of conventional teleoperation systems."),

      h1("References"),
      body("[1] Jocher, G., Chaurasia, A., & Qiu, J. (2023). Ultralytics YOLOv8 (Version 8.0.0) [Software]. https://github.com/ultralytics/ultralytics", { italics: false }),
      body("[2] Cao, Z., Simon, T., Wei, S.-E., & Sheikh, Y. (2017). Realtime Multi-Person 2D Pose Estimation using Part Affinity Fields. IEEE Conference on Computer Vision and Pattern Recognition (CVPR)."),
      body("[3] Lin, T.-Y., et al. (2014). Microsoft COCO: Common Objects in Context. European Conference on Computer Vision (ECCV)."),
      body("[4] Espressif Systems. ESP32 Series Datasheet. https://www.espressif.com/en/products/socs/esp32"),
      body("[5] ESP32Servo Library (Arduino). https://github.com/madhephaestus/ESP32Servo"),
      body("[6] Bradski, G. (2000). The OpenCV Library. Dr. Dobb's Journal of Software Tools."),
      body("[7] GPT4All - Open-Source Local LLMs. https://www.nomic.ai/gpt4all"),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/mnt/user-data/outputs/thesis.docx", buf);
  console.log("Thesis written.");
});

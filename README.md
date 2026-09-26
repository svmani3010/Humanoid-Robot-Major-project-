# Vision-Guided Teleoperation of a Low-Cost Humanoid Robot

A webcam + YOLOv8-Pose estimate a human operator's body pose in real time,
convert the relevant joints to angles, and stream them over WiFi to an
ESP32-driven humanoid robot that reproduces the pose live on six hobby
servos. The robot and operator only need to share a WiFi link (the
ESP32's own Access Point), so the operator does not need to be at the
robot's physical location — the whole point of the project.

```
Webcam -> YOLOv8-Pose -> joint angles -> TCP "Label:Angle\n" -> ESP32 -> servos
```

## Repository layout

```
main.py                          # entry point (live loop / gestures / voice)
src/
  config.py                      # every tunable constant lives here
  pose_estimation.py             # keypoints -> joint angles
  esp32_client.py                # single reusable, reconnecting TCP client
  gestures.py                    # canned gestures (hai, wave, rest)
  voice_control.py               # offline wake-word voice interface
firmware/
  esp32_servo_receiver/
    esp32_servo_receiver.ino     # ESP32 firmware (AP + TCP server + servos)
docs/
  fig_pose_detection.jpg         # architecture diagram (used in the thesis)
  fig_robot_mimic.jpg            # timing diagram (used in the thesis)
  make_figures.py                # regenerates the two diagrams above
  thesis.docx                    # full thesis document (see below)
requirements.txt
```

## Hardware

| Component | Notes |
|---|---|
| Webcam / phone camera | any OpenCV-compatible source |
| Host PC / laptop | GPU optional, runs on CPU |
| ESP32 dev board | hosts its own WiFi AP + TCP server |
| 6x hobby servos (SG90-class) | shoulder, elbow, hip/knee, L & R |
| External 5V supply for the servos | do **not** power servos from the ESP32's own 5V/3V3 pin |
| Robot frame | 3D-printed / fabricated |

Servo → GPIO pin mapping is defined in `firmware/esp32_servo_receiver/esp32_servo_receiver.ino`
(`channels[]` array) — change the pin numbers there to match your wiring.

## Getting started

### 1. Flash the ESP32

1. Install the Arduino IDE (or PlatformIO) with ESP32 board support.
2. Install the **ESP32Servo** library (Library Manager → search "ESP32Servo").
3. Open `firmware/esp32_servo_receiver/esp32_servo_receiver.ino`, adjust
   `AP_SSID` / `AP_PASSWORD` / pin numbers if needed, and upload it to the board.
4. Power the board; it will print its Access Point IP (normally `192.168.4.1`)
   over Serial at 115200 baud.

### 2. Set up the vision host

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Connect the host machine's WiFi to the `HumanoidRobot` Access Point the
ESP32 is broadcasting, then confirm `src/config.py`'s `ESP32_IP` /
`ESP32_PORT` match the firmware.

### 3. Run it

```bash
# Live pose-to-servo control (opens the camera, needs the ESP32 connected)
python main.py

# Test the vision pipeline only, no robot required
python main.py --dry-run

# Also save the annotated demo video
python main.py --record output_pose.avi

# Run one canned gesture on the bench (hai / wave / rest)
python main.py --gesture wave

# Start the offline voice-command interface
python main.py --voice
```

Press `q` in the video window, or `Ctrl+C` in the terminal, to stop — on
exit the robot is sent back to a safe rest position.

## What changed from the original prototype scripts

The uploaded prototype was five separate scripts (`pose_servo.py`,
`robot_pose.py`, `hai.py`, `slide.py`, `rest.py`) that each opened their
own socket and duplicated the angle math, plus a `voice.py` that wasn't
wired to the robot at all, and no ESP32 firmware. This repo fixes/adds:

- **Divide-by-zero fix** in the vertical-axis angle formula when a
  keypoint wasn't detected (both points defaulting to `(0, 0)`).
- **Confidence gating** — a keypoint below `MIN_KEYPOINT_CONFIDENCE` is
  skipped for that frame instead of being sent as a noisy angle.
- **One reusable `ESP32Client`** (with automatic reconnect) replacing
  five near-identical, non-reconnecting socket blocks.
- **`voice.py` loaded an image-generation checkpoint** (`FLUX.1-dev-gguf`)
  into a text-chat API, which cannot work; `voice_control.py` uses a
  local GPT4All *chat* model instead, and its bare `except:` blocks are
  now explicit, logged exceptions.
- **Voice commands are now dispatched to the robot** (`wave` / `hello` /
  `rest`, etc.) — previously the voice script only echoed replies via
  text-to-speech and never touched the servos.
- **Update rate raised from 1 packet/second to ~6-7/second** (`SEND_INTERVAL
  = 0.15s`), which is a visibly tighter live match.
- **On-screen angle labels no longer overlap** — each is drawn on its own line.
- **Added the ESP32 firmware**, which the original project never included,
  so the existing Python socket clients had nothing to actually talk to.

## Thesis

`docs/thesis.docx` is a full thesis write-up of this project (background,
literature review, architecture, methodology, implementation, results,
limitations, future work). The two figures in Chapter 6 are schematic
diagrams generated by `docs/make_figures.py`; swap in your own annotated
screenshots or photos from the demonstration video before final submission.

## Known limitations

- Single operator, single camera, first detected person only per frame.
- Range limited to the ESP32's own AP — true long-distance operation would
  need the link routed over the internet instead.
- No inverse kinematics; angles come directly from 2D image-plane vectors.
- Six servo channels only (shoulders, elbows, hips) — no wrist, hand, ankle,
  or locomotion yet.

## License

Add a license of your choice (MIT is a common default for hobby-robotics
projects) before publishing the repository publicly.

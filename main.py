"""
main.py
--------
Entry point for the vision-host side of the system.

    python main.py                 # live: camera -> pose -> angles -> ESP32
    python main.py --dry-run       # run the vision pipeline, print angles,
                                    #   do NOT open a socket to the robot
    python main.py --record out.avi  # also save the annotated feed
    python main.py --gesture wave  # skip the camera, run one canned gesture
    python main.py --voice         # start the offline voice interface

Consolidates and replaces: pose_servo.py, robot_pose.py, hai.py, slide.py,
rest.py, angle_receiver.py and receiver.py, each of which previously
opened its own socket and re-implemented the angle math with small,
inconsistent bugs (see README.md "What changed" for the full list).
"""

import argparse
import logging
import time

import cv2

from src import config, gestures
from src.esp32_client import ESP32Client
from src.pose_estimation import compute_joint_angles

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("main")


def run_live(dry_run: bool, record_path: str | None):
    from ultralytics import YOLO

    model = YOLO(config.MODEL_WEIGHTS)
    cap = cv2.VideoCapture(config.CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError("Could not open camera at index %d" % config.CAMERA_INDEX)

    client = None
    if not dry_run:
        client = ESP32Client()
        client.connect()

    writer = None
    if record_path:
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"XVID")
        writer = cv2.VideoWriter(record_path, fourcc, 20, (width, height))

    last_sent = 0.0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                log.warning("Failed to grab frame")
                break

            results = model(frame, verbose=False)
            annotated = results[0].plot()
            kp_result = results[0].keypoints

            if kp_result is not None and len(kp_result.xy) > 0:
                kp_xy = kp_result.xy[0].cpu().numpy()
                kp_conf = kp_result.conf[0].cpu().numpy() if kp_result.conf is not None else None

                angles = compute_joint_angles(kp_xy, kp_conf)

                if angles:
                    y = 30
                    for label, value in angles.items():
                        cv2.putText(annotated, f"{label}: {value} deg", (10, y),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
                        y += 20  # one line per label, no more overlapping text

                    now = time.time()
                    if now - last_sent >= config.SEND_INTERVAL:
                        log.info("Angles: %s", angles)
                        if client is not None:
                            client.send_angles(angles)
                        last_sent = now

            cv2.imshow("Pose Estimation", annotated)
            if writer is not None:
                writer.write(annotated)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    except KeyboardInterrupt:
        log.info("Interrupted by user")
    finally:
        cap.release()
        if writer is not None:
            writer.release()
        cv2.destroyAllWindows()
        if client is not None:
            client.go_to_rest()
            client.close()


def run_gesture(name: str):
    if name not in gestures.GESTURES:
        raise SystemExit(f"Unknown gesture '{name}'. Options: {list(gestures.GESTURES)}")
    with ESP32Client() as client:
        gestures.GESTURES[name](client)


def run_voice():
    from src.voice_control import VoiceController

    with ESP32Client() as client:
        controller = VoiceController(client, gestures)
        controller.run_forever()


def parse_args():
    p = argparse.ArgumentParser(description="Pose-to-servo humanoid robot control")
    p.add_argument("--dry-run", action="store_true",
                    help="run the vision pipeline without connecting to the ESP32")
    p.add_argument("--record", metavar="FILE.avi", default=None,
                    help="save the annotated camera feed to this file")
    p.add_argument("--gesture", choices=list(gestures.GESTURES), default=None,
                    help="run one canned gesture (no camera) and exit")
    p.add_argument("--voice", action="store_true",
                    help="start the offline voice-command interface")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.gesture:
        run_gesture(args.gesture)
    elif args.voice:
        run_voice()
    else:
        run_live(dry_run=args.dry_run, record_path=args.record)

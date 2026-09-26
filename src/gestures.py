"""
gestures.py
------------
Pre-programmed movement sequences, usable independently of the live
camera pipeline (bench testing, or dispatched from voice_control.py).

Consolidates the logic that used to be duplicated across hai.py,
slide.py and rest.py into functions that all take an ESP32Client
instead of opening their own socket.
"""

import logging
import time

from . import config
from .esp32_client import ESP32Client

log = logging.getLogger("gestures")


def move_smooth(client: ESP32Client, label: str, start: int, end: int, step: int = 3):
    """Step a single servo from start to end in small increments."""
    rng = range(start, end + 1, step) if start < end else range(start, end - 1, -step)
    for angle in rng:
        client.send_angle(label, angle)
        time.sleep(config.GESTURE_STEP_DELAY)


def wave(client: ESP32Client, label: str, center: int = 90, amplitude: int = 40,
         duration: float = 3.0, period: float = 0.25):
    """Oscillate one servo around `center` for `duration` seconds."""
    start_time = time.time()
    while time.time() - start_time < duration:
        client.send_angle(label, center + amplitude)
        time.sleep(period)
        client.send_angle(label, center - amplitude)
        time.sleep(period)


def hai_pose(client: ESP32Client, right_up: bool = True):
    """'Hai' / greeting gesture: raise (or lower) both arms together."""
    if right_up:
        angles = {
            config.LABEL_R_ELBOW: 150, config.LABEL_R_SHOULDER: 40,
            config.LABEL_R_LEG_ELBOW: 60,
            config.LABEL_L_ELBOW: 150, config.LABEL_L_SHOULDER: 140,
            config.LABEL_L_LEG_ELBOW: 60,
        }
    else:
        angles = {label: 90 for label in config.ALL_LABELS}
    client.send_angles(angles)


def wave_sequence(client: ESP32Client):
    """The full left/right wave-and-gesture routine (formerly slide.py)."""
    log.info("Performing left/right gesture sequence")

    # Left arm
    move_smooth(client, config.LABEL_L_ELBOW, 30, 100)
    move_smooth(client, config.LABEL_L_SHOULDER, 180, 0)
    move_smooth(client, config.LABEL_L_ELBOW, 100, 40)
    wave(client, config.LABEL_L_LEG_ELBOW, center=50, amplitude=90, duration=6)
    client.send_angle(config.LABEL_L_LEG_ELBOW, 160)
    move_smooth(client, config.LABEL_L_ELBOW, 40, 90)
    move_smooth(client, config.LABEL_L_SHOULDER, 0, 170)
    move_smooth(client, config.LABEL_L_ELBOW, 90, 30)

    # Right arm
    move_smooth(client, config.LABEL_R_ELBOW, 150, 100)
    move_smooth(client, config.LABEL_R_SHOULDER, 180, 0)
    move_smooth(client, config.LABEL_R_ELBOW, 100, 130)
    wave(client, config.LABEL_R_LEG_ELBOW, center=50, amplitude=90, duration=6)
    client.send_angle(config.LABEL_R_LEG_ELBOW, 160)
    move_smooth(client, config.LABEL_R_ELBOW, 130, 90)
    move_smooth(client, config.LABEL_R_SHOULDER, 0, 170)
    move_smooth(client, config.LABEL_R_ELBOW, 90, 150)


def rest(client: ESP32Client):
    """Send the safe, arms-down rest position."""
    log.info("Moving to rest position")
    client.go_to_rest()


# Name -> function, used by both the CLI and the voice interface.
GESTURES = {
    "hai": lambda client: hai_pose(client, right_up=True),
    "wave": wave_sequence,
    "rest": rest,
}

"""
pose_estimation.py
-------------------
Turns a YOLOv8-Pose result into a dict of {servo_label: angle_degrees}.

Fixes applied relative to the original prototype scripts (pose_servo.py,
robot_pose.py):
  1. Divide-by-zero: angle_with_y_axis() no longer computes an angle when
     the two keypoints coincide (norm ~ 0) — it returns None instead.
  2. Low-confidence keypoints (a joint YOLO couldn't really see) are
     skipped for that frame rather than being sent as a noisy angle.
"""

import numpy as np

from . import config

_Y_AXIS = np.array([0.0, 1.0])
_EPS = 1e-6


def angle_with_y_axis(p1: np.ndarray, p2: np.ndarray):
    """Angle in degrees between vector (p2 - p1) and the image's vertical
    axis. Returns None if the vector is degenerate (missing keypoint)."""
    vec = p2 - p1
    norm = np.linalg.norm(vec)
    if norm < _EPS:
        return None
    unit = vec / norm
    dot = np.clip(np.dot(unit, _Y_AXIS), -1.0, 1.0)
    return float(np.degrees(np.arccos(dot)))


def _confident(conf_array, idx) -> bool:
    """True if we have a confidence score for idx and it clears the
    threshold. If no confidence array is available, keypoints are
    trusted (older model exports don't return one)."""
    if conf_array is None:
        return True
    try:
        return float(conf_array[idx]) >= config.MIN_KEYPOINT_CONFIDENCE
    except (IndexError, TypeError):
        return False


def compute_joint_angles(keypoints_xy: np.ndarray, keypoints_conf=None):
    """
    keypoints_xy:   (17, 2) array of pixel coordinates for one detected person.
    keypoints_conf: optional (17,) array of per-keypoint confidence scores.

    Returns a dict {servo_label: angle_degrees}. A joint is omitted
    entirely (not sent) if either endpoint is missing/low-confidence or
    the angle is undefined — the caller should hold the last known
    servo position for that channel rather than treat 0 as a real angle.
    """
    angles = {}

    def pair_ok(i, j):
        return _confident(keypoints_conf, i) and _confident(keypoints_conf, j)

    # Right arm: shoulder->elbow, mirrored (180 - theta) to match the
    # left arm's convention (raising either arm increases the angle).
    if pair_ok(config.RIGHT_SHOULDER, config.RIGHT_ELBOW):
        theta = angle_with_y_axis(
            keypoints_xy[config.RIGHT_SHOULDER], keypoints_xy[config.RIGHT_ELBOW]
        )
        if theta is not None:
            angles[config.LABEL_R_ELBOW] = 180 - theta
            angles[config.LABEL_R_SHOULDER] = theta

    # Left arm: shoulder->elbow
    if pair_ok(config.LEFT_SHOULDER, config.LEFT_ELBOW):
        theta = angle_with_y_axis(
            keypoints_xy[config.LEFT_SHOULDER], keypoints_xy[config.LEFT_ELBOW]
        )
        if theta is not None:
            angles[config.LABEL_L_ELBOW] = theta
            angles[config.LABEL_L_SHOULDER] = theta

    # Hips -> knees ("leg-elbow" servo channels)
    if pair_ok(config.LEFT_HIP, config.LEFT_KNEE):
        theta = angle_with_y_axis(
            keypoints_xy[config.LEFT_HIP], keypoints_xy[config.LEFT_KNEE]
        )
        if theta is not None:
            angles[config.LABEL_L_LEG_ELBOW] = theta

    if pair_ok(config.RIGHT_HIP, config.RIGHT_KNEE):
        theta = angle_with_y_axis(
            keypoints_xy[config.RIGHT_HIP], keypoints_xy[config.RIGHT_KNEE]
        )
        if theta is not None:
            angles[config.LABEL_R_LEG_ELBOW] = theta

    # Clamp everything to the physical servo range.
    for label, value in list(angles.items()):
        angles[label] = int(
            max(config.SERVO_MIN_ANGLE, min(config.SERVO_MAX_ANGLE, value))
        )

    return angles

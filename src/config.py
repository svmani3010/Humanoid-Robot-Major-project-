"""
config.py
---------
Single place for every tunable constant used by the vision host.
Nothing in the other modules should hard-code an IP, port, threshold,
or keypoint index — they all read from here.
"""

# ---- Network -----------------------------------------------------------
ESP32_IP = "192.168.4.1"      # ESP32 Access Point default IP
ESP32_PORT = 80
SOCKET_TIMEOUT = 3.0          # seconds, connect/reconnect timeout
RECONNECT_DELAY = 1.0         # seconds between reconnect attempts

# ---- Camera / model ------------------------------------------------------
CAMERA_INDEX = 0
MODEL_WEIGHTS = "yolov8n-pose.pt"
MIN_KEYPOINT_CONFIDENCE = 0.5  # a keypoint below this is treated as "not seen"

# ---- Control loop timing -------------------------------------------------
SEND_INTERVAL = 0.15          # seconds between angle packets (~6-7 Hz)
GESTURE_STEP_DELAY = 0.03     # delay between steps of a smooth gesture move

# ---- YOLOv8-Pose COCO keypoint indices ------------------------------------
LEFT_SHOULDER = 5
RIGHT_SHOULDER = 6
LEFT_ELBOW = 7
RIGHT_ELBOW = 8
LEFT_HIP = 11
RIGHT_HIP = 12
LEFT_KNEE = 13
RIGHT_KNEE = 14

# ---- Servo channel labels (must match the ESP32 firmware) ----------------
LABEL_R_ELBOW = "R-Elbow"
LABEL_R_SHOULDER = "R-Shoulder"
LABEL_R_LEG_ELBOW = "R-Leg-Elbow"
LABEL_L_ELBOW = "L-Elbow"
LABEL_L_SHOULDER = "L-Shoulder"
LABEL_L_LEG_ELBOW = "L-Leg-Elbow"

ALL_LABELS = [
    LABEL_R_ELBOW, LABEL_R_SHOULDER, LABEL_R_LEG_ELBOW,
    LABEL_L_ELBOW, LABEL_L_SHOULDER, LABEL_L_LEG_ELBOW,
]

# Safe, arms-down rest position sent on startup / shutdown / error
REST_POSITION = {
    LABEL_R_ELBOW: 180,
    LABEL_R_SHOULDER: 180,
    LABEL_R_LEG_ELBOW: 90,
    LABEL_L_ELBOW: 180,
    LABEL_L_SHOULDER: 0,
    LABEL_L_LEG_ELBOW: 90,
}

SERVO_MIN_ANGLE = 0
SERVO_MAX_ANGLE = 180

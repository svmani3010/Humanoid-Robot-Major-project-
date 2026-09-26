"""
esp32_client.py
-----------------
One reusable TCP client for talking to the ESP32 servo receiver.

Replaces the five separate, near-duplicate socket-handling blocks that
used to live at the top of pose_servo.py, hai.py, slide.py, rest.py and
receiver.py. Adds automatic reconnection, which none of the originals had.
"""

import logging
import socket
import time

from . import config

log = logging.getLogger("esp32_client")


class ESP32Client:
    def __init__(self, host=config.ESP32_IP, port=config.ESP32_PORT):
        self.host = host
        self.port = port
        self.sock = None

    def connect(self):
        """Block until a connection is established, retrying forever."""
        while self.sock is None:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(config.SOCKET_TIMEOUT)
                s.connect((self.host, self.port))
                s.settimeout(None)
                self.sock = s
                log.info("Connected to ESP32 at %s:%s", self.host, self.port)
            except OSError as exc:
                log.warning("Connect to ESP32 failed (%s), retrying...", exc)
                time.sleep(config.RECONNECT_DELAY)
        return self.sock

    def send_angle(self, label: str, angle: int):
        """Send one 'Label:Angle\\n' command, reconnecting if needed."""
        angle = int(max(config.SERVO_MIN_ANGLE, min(config.SERVO_MAX_ANGLE, angle)))
        message = f"{label}:{angle}\n".encode()
        self._send_with_retry(message)

    def send_angles(self, angles: dict):
        """Send a dict of {label: angle} as consecutive commands."""
        for label, angle in angles.items():
            self.send_angle(label, angle)

    def _send_with_retry(self, message: bytes, attempts: int = 2):
        for attempt in range(attempts):
            try:
                if self.sock is None:
                    self.connect()
                self.sock.sendall(message)
                return
            except OSError as exc:
                log.warning("Send failed (%s), reconnecting (attempt %d/%d)",
                            exc, attempt + 1, attempts)
                self.close()
                self.connect()
        log.error("Giving up on sending %r after %d attempts", message, attempts)

    def go_to_rest(self):
        """Send the safe, arms-down rest position."""
        self.send_angles(config.REST_POSITION)

    def close(self):
        if self.sock is not None:
            try:
                self.sock.close()
            except OSError:
                pass
            self.sock = None

    # Context-manager support: `with ESP32Client() as client:`
    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

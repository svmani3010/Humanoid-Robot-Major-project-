/*
 * esp32_servo_receiver.ino
 * -------------------------
 * Robot-side firmware. This was entirely missing from the original
 * project: the Python scripts (hai.py, slide.py, rest.py, pose_servo.py)
 * all connected to 192.168.4.1:80 and sent "Label:Angle\n" lines, but
 * nothing on the ESP32 was ever written to receive them.
 *
 * What it does:
 *   1. Brings up its own WiFi Access Point (no external router needed --
 *      this is what lets the robot and the operator be on different
 *      networks/rooms, as long as the operator's machine joins this AP).
 *   2. Runs a TCP server on port 80.
 *   3. Reads newline-delimited "Label:Angle" commands.
 *   4. Looks the label up in a small table and writes the angle to the
 *      matching servo with ESP32Servo.
 *
 * Wiring: connect each servo's signal wire to the GPIO pin listed in
 * SERVO_PINS below, servo power (5V) to an external supply (NOT the
 * ESP32's own 5V/3V3 pin), and grounds tied together.
 *
 * Library required: ESP32Servo (Kevin Harrington / madhephaestus)
 *   Arduino IDE: Sketch -> Include Library -> Manage Libraries -> "ESP32Servo"
 */

#include <WiFi.h>
#include <ESP32Servo.h>

// ---- Access Point credentials -------------------------------------------
const char *AP_SSID = "HumanoidRobot";
const char *AP_PASSWORD = "robot1234";   // 8+ chars required by WiFi.softAP
const uint16_t TCP_PORT = 80;

// ---- Servo channel table (must match src/config.py ALL_LABELS) ----------
struct ServoChannel {
  const char *label;
  uint8_t pin;
  Servo servo;
};

ServoChannel channels[] = {
  {"R-Elbow",      13, Servo()},
  {"R-Shoulder",   12, Servo()},
  {"R-Leg-Elbow",  14, Servo()},
  {"L-Elbow",      27, Servo()},
  {"L-Shoulder",   26, Servo()},
  {"L-Leg-Elbow",  25, Servo()},
};
const size_t NUM_CHANNELS = sizeof(channels) / sizeof(channels[0]);

WiFiServer server(TCP_PORT);
String lineBuffer;

void setup() {
  Serial.begin(115200);

  // Attach every servo and move it to a safe mid position before anything
  // else happens, so the arms don't twitch to a random pose on boot.
  for (size_t i = 0; i < NUM_CHANNELS; i++) {
    channels[i].servo.setPeriodHertz(50);
    channels[i].servo.attach(channels[i].pin, 500, 2400);
    channels[i].servo.write(90);
  }

  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.print("[ESP32] Access Point started. IP: ");
  Serial.println(WiFi.softAPIP());   // normally 192.168.4.1

  server.begin();
  Serial.println("[ESP32] TCP server listening on port 80");
}

void applyCommand(const String &label, int angle) {
  angle = constrain(angle, 0, 180);
  for (size_t i = 0; i < NUM_CHANNELS; i++) {
    if (label.equals(channels[i].label)) {
      channels[i].servo.write(angle);
      Serial.printf("[ESP32] %s -> %d\n", channels[i].label, angle);
      return;
    }
  }
  Serial.printf("[ESP32] Unknown label: %s\n", label.c_str());
}

void handleLine(const String &line) {
  int sep = line.indexOf(':');
  if (sep < 0) return;
  String label = line.substring(0, sep);
  String angleStr = line.substring(sep + 1);
  label.trim();
  angleStr.trim();
  if (label.length() == 0 || angleStr.length() == 0) return;
  applyCommand(label, angleStr.toInt());
}

void loop() {
  WiFiClient client = server.available();
  if (!client) return;

  Serial.println("[ESP32] Client connected");
  lineBuffer = "";

  while (client.connected()) {
    while (client.available()) {
      char c = client.read();
      if (c == '\n') {
        handleLine(lineBuffer);
        lineBuffer = "";
      } else if (c != '\r') {
        lineBuffer += c;
      }
    }
  }

  client.stop();
  Serial.println("[ESP32] Client disconnected");
}

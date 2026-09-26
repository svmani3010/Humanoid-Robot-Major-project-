import matplotlib.pyplot as plt
import matplotlib.patches as patches

plt.rcParams["font.family"] = "DejaVu Sans"

def box(ax, xy, w, h, text, fc="#2E4057", tc="white", fs=10):
    rect = patches.FancyBboxPatch(xy, w, h, boxstyle="round,pad=0.02,rounding_size=0.05",
                                   linewidth=1.2, edgecolor="#1F3864", facecolor=fc)
    ax.add_patch(rect)
    ax.text(xy[0] + w / 2, xy[1] + h / 2, text, ha="center", va="center",
             color=tc, fontsize=fs, wrap=True)

def arrow(ax, p1, p2, text=""):
    ax.annotate("", xy=p2, xytext=p1,
                arrowprops=dict(arrowstyle="-|>", color="#333333", lw=1.4))
    if text:
        mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        ax.text(mx, my + 0.15, text, ha="center", fontsize=8, color="#333333")

# ---- Figure 6.1: System / data-flow architecture ----
fig, ax = plt.subplots(figsize=(8.6, 4.4))
ax.set_xlim(0, 10); ax.set_ylim(0, 5); ax.axis("off")

box(ax, (0.3, 2.6), 1.8, 1.0, "Webcam\n(operator)")
box(ax, (2.6, 2.6), 2.0, 1.0, "YOLOv8-Pose\n(17 keypoints)")
box(ax, (5.1, 2.6), 2.0, 1.0, "Joint-angle\ncomputation")
box(ax, (7.6, 2.6), 2.1, 1.0, "TCP socket\n\u201CLabel:Angle\\n\u201D")

box(ax, (2.6, 0.6), 2.0, 1.0, "ESP32\nWiFi Access Point")
box(ax, (5.1, 0.6), 2.0, 1.0, "TCP server +\nlabel lookup")
box(ax, (7.6, 0.6), 2.1, 1.0, "Servo.write(angle)\n(6 channels)")

arrow(ax, (2.1, 3.1), (2.6, 3.1))
arrow(ax, (4.6, 3.1), (5.1, 3.1))
arrow(ax, (7.1, 3.1), (7.6, 3.1))
arrow(ax, (8.65, 2.6), (8.65, 1.6), "WiFi")
arrow(ax, (7.6, 1.1), (7.1, 1.1))
arrow(ax, (5.1, 1.1), (4.6, 1.1))

ax.text(5, 4.3, "Vision host (operator's location)", ha="center", fontsize=11, weight="bold", color="#1F3864")
ax.text(5, 0.0, "Robot (remote location, connected only via ESP32 WiFi AP)", ha="center", fontsize=11, weight="bold", color="#1F3864")

plt.tight_layout()
plt.savefig("fig_pose_detection.jpg", dpi=200)
plt.close()

# ---- Figure 6.2: Protocol / timing diagram ----
fig, ax = plt.subplots(figsize=(8.6, 4.4))
ax.set_xlim(0, 10); ax.set_ylim(0, 5); ax.axis("off")

box(ax, (0.4, 3.4), 2.6, 1.0, "Operator raises\nan arm on camera", fc="#3E5C76")
box(ax, (3.6, 3.4), 2.8, 1.0, "Angle recomputed\nevery ~0.15 s (\u22486-7 Hz)", fc="#3E5C76")
box(ax, (7.0, 3.4), 2.6, 1.0, "R-Elbow:120\\n\nsent over TCP", fc="#3E5C76")

box(ax, (0.4, 1.2), 2.6, 1.0, "ESP32 parses\nthe line", fc="#2E4057")
box(ax, (3.6, 1.2), 2.8, 1.0, "Matching servo\nreceives new angle", fc="#2E4057")
box(ax, (7.0, 1.2), 2.6, 1.0, "Robot arm follows\nthe operator's pose", fc="#2E4057")

arrow(ax, (3.0, 3.9), (3.6, 3.9))
arrow(ax, (6.4, 3.9), (7.0, 3.9))
arrow(ax, (8.3, 3.4), (8.3, 2.2))
arrow(ax, (7.0, 1.7), (6.4, 1.7))
arrow(ax, (3.6, 1.7), (3.0, 1.7))

ax.text(5, 4.85, "Live pose-to-servo timing", ha="center", fontsize=11, weight="bold", color="#1F3864")

plt.tight_layout()
plt.savefig("fig_robot_mimic.jpg", dpi=200)
plt.close()

print("Figures written.")

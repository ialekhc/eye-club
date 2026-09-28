import type { FrameRenderer, RenderScene } from "../types";

export class CanvasRenderer implements FrameRenderer {
  render(canvas: HTMLCanvasElement, scene: RenderScene): void {
    // Keep source resolution for a crisp responsive canvas. CSS handles layout;
    // geometry stays in photo pixels and never depends on viewport dimensions.
    canvas.width = scene.photoSize.width;
    canvas.height = scene.photoSize.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(scene.photo, 0, 0, canvas.width, canvas.height);
    const { transform } = scene;
    context.save();
    context.translate(transform.position.x, transform.position.y);
    context.rotate(transform.rotation);
    context.scale(transform.scale, transform.scale);
    context.drawImage(scene.frame, -transform.pivot.x, -transform.pivot.y, scene.frameSize.width, scene.frameSize.height);
    context.restore();
    if (scene.landmarks) {
      const radius = Math.max(1, canvas.width / 700);
      context.fillStyle = "rgba(52, 211, 153, 0.7)";
      for (const landmark of scene.landmarks) {
        context.beginPath();
        context.arc(landmark.x * canvas.width, landmark.y * canvas.height, radius, 0, Math.PI * 2);
        context.fill();
      }
      if (scene.geometry) {
        const { leftEye, rightEye, noseBridge } = scene.geometry;
        context.strokeStyle = "#fbbf24";
        context.lineWidth = Math.max(2, canvas.width / 500);
        context.beginPath(); context.moveTo(leftEye.x, leftEye.y); context.lineTo(rightEye.x, rightEye.y); context.stroke();
        for (const point of [leftEye, rightEye, noseBridge]) {
          context.beginPath(); context.arc(point.x, point.y, radius * 3, 0, Math.PI * 2); context.stroke();
        }
      }
    }
  }
}

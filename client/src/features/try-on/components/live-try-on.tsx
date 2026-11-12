"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@eyewear/ui";
import { CanvasRenderer, FaceGeometryCalculator, FrameTransformCalculator } from "@eyewear/tryon-engine";
import { FaceLandmarkDetector } from "@eyewear/tryon-engine/face";
import type { LoadedFrame } from "@/lib/frame-schema";

/** The camera and inference session belong to this mounted feature only. */
export function LiveTryOn({ frame }: { frame: LoadedFrame | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(frame);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Start your camera to try frames live.");
  useEffect(() => { frameRef.current = frame; }, [frame]);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    let detector: FaceLandmarkDetector | undefined;
    let animation = 0;
    let permissionTimer: ReturnType<typeof setTimeout> | undefined;
    const geometry = new FaceGeometryCalculator();
    const transforms = new FrameTransformCalculator();
    const renderer = new CanvasRenderer();
    let lastVideoTime = -1;
    let lastStatus = "";
    const report = (message: string) => {
      if (!cancelled && message !== lastStatus) { lastStatus = message; setStatus(message); }
    };
    const release = () => {
      cancelAnimationFrame(animation);
      clearTimeout(permissionTimer);
      stream?.getTracks().forEach((track) => track.stop());
      detector?.dispose();
      if (videoRef.current) videoRef.current.srcObject = null;
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = 0; canvas.height = 0; }
    };
    const start = async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("Live try-on needs HTTPS or localhost and a browser with camera support.");
        }
        report("Allow camera access to start your live fitting.");
        permissionTimer = setTimeout(() => report("Waiting for camera permission. If no prompt appears in this preview, open localhost:3000/try-on in Chrome or Safari and allow camera access."), 10_000);
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
        clearTimeout(permissionTimer);
        if (cancelled) { release(); return; }
        const video = videoRef.current;
        if (!video) throw new Error("Camera preview is unavailable.");
        video.srcObject = stream;
        await video.play();
        if (cancelled) { release(); return; }
        report("Loading face tracking on your device…");
        detector = new FaceLandmarkDetector({
          wasmPath: process.env.NEXT_PUBLIC_VISION_WASM_PATH || "/vision",
          modelPath: process.env.NEXT_PUBLIC_FACE_MODEL_PATH || "/models/face_landmarker.task",
          runningMode: "VIDEO",
        });
        await detector.initialize();
        if (cancelled) { release(); return; }
        const tick = () => {
          if (cancelled) return;
          try {
            const canvas = canvasRef.current;
            const selected = frameRef.current;
            if (canvas && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
              lastVideoTime = video.currentTime;
              const size = { width: video.videoWidth, height: video.videoHeight };
              const faces = detector!.detectVideo(video, performance.now());
              const landmarks = faces.length === 1 ? faces[0] : undefined;
              if (landmarks && selected) {
                const face = geometry.calculate(landmarks, size);
                renderer.render(canvas, { photo: video, photoSize: size, frame: selected.image, frameSize: selected, transform: transforms.calculate(face, selected.calibration, selected) });
                report("Live · choose any frame below to change your look.");
              } else {
                canvas.width = size.width; canvas.height = size.height;
                canvas.getContext("2d")?.drawImage(video, 0, 0);
                report(faces.length > 1 ? "Keep just one face in view." : !selected ? "Choose a frame below." : "Look toward the camera in good light.");
              }
            }
            animation = requestAnimationFrame(tick);
          } catch (error) {
            release(); setRunning(false);
            report(error instanceof Error ? error.message : "Face tracking stopped. Try again.");
          }
        };
        animation = requestAnimationFrame(tick);
      } catch (error) {
        release();
        if (cancelled) return;
        setRunning(false);
        const cameraErrors: Record<string, string> = {
          NotAllowedError: "Camera access was denied. Allow camera access for localhost in your browser settings, then try again. If using an app preview, open this page in Chrome or Safari.",
          NotFoundError: "No camera was found. Connect a webcam, or use Photo upload above.",
          NotReadableError: "The camera is unavailable. Close other apps using it, then try again.",
          OverconstrainedError: "This camera does not support the requested video settings. Try another browser or Photo upload.",
        };
        report(error instanceof Error ? cameraErrors[error.name] ?? error.message : "Could not start your camera.");
      }
    };
    void start();
    const onVisibility = () => { if (document.hidden) { setRunning(false); report("Camera stopped while the page is hidden."); } };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisibility); release(); };
  }, [running]);

  return <section className="preview-panel" aria-label="Live camera try-on">
    <div className="preview-toolbar"><strong>Live fitting mirror</strong>
      <Button disabled={!frame && !running} onClick={() => { if (running) setStatus("Camera stopped."); setRunning(!running); }}>{running ? "Stop camera" : "Start camera"}</Button>
    </div>
    <video ref={videoRef} muted playsInline className="sr-only" aria-hidden="true" />
    <div className="preview-area"><canvas ref={canvasRef} className={running ? "tryon-canvas" : "hidden"} style={{ transform: "scaleX(-1)" }} aria-label={`Live mirror with ${frame?.name ?? "selected glasses"}`} />
      {!running && <div className="upload-empty"><h2>Try it on. Move with it.</h2><p>Start the camera, then explore the frames below.</p></div>}
    </div>
    <p role="status" className="preview-footer">{status}</p>
    {running && <p className="preview-footer">If camera permission does not appear, open this page in Chrome or Safari. You can also stop the camera and choose Photo upload.</p>}
    <p className="preview-footer">Video stays on this device. Best viewed facing forward. Placement is a visual preview.</p>
  </section>;
}

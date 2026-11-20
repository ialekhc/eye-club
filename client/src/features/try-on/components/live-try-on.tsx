"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@eyewear/ui";
import {
  applyManualAdjustment,
  AUTOMATIC_FIT,
  CanvasRenderer,
  FaceGeometryCalculator,
  FaceGeometryStabilizer,
  FrameTransformCalculator,
  type ManualAdjustment,
  stabilizeIrisLandmarks,
} from "@eyewear/tryon-engine";
import { FaceLandmarkDetector } from "@eyewear/tryon-engine/face";
import type { LoadedFrame } from "@/lib/frame-schema";
import { FitControls } from "./fit-controls";

/** The camera and inference session belong to this mounted feature only. */
export function LiveTryOn({
  frame,
  adjustment = AUTOMATIC_FIT,
  onAdjustmentChange,
  onResetFit,
}: {
  frame: LoadedFrame | null;
  adjustment?: ManualAdjustment;
  onAdjustmentChange?: (next: ManualAdjustment) => void;
  onResetFit?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(frame);
  const adjustmentRef = useRef(adjustment);
  const frozenRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const showLandmarksRef = useRef(false);
  const [fps, setFps] = useState<number>(0);
  const [trackingLocked, setTrackingLocked] = useState(false);
  const [status, setStatus] = useState("Start your camera to try frames live.");

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    adjustmentRef.current = adjustment;
  }, [adjustment]);

  useEffect(() => {
    frozenRef.current = frozen;
  }, [frozen]);

  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
  }, [showLandmarks]);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    let detector: FaceLandmarkDetector | undefined;
    let animation = 0;
    let permissionTimer: ReturnType<typeof setTimeout> | undefined;

    const geometry = new FaceGeometryCalculator();
    const stabilizer = new FaceGeometryStabilizer({
      minAlpha: 0.22,
      maxAlpha: 0.88,
      velocityScale: 1.75,
      deadbandRatio: 0.0045,
      graceHoldMs: 200,
    });
    const transforms = new FrameTransformCalculator();
    const renderer = new CanvasRenderer();

    let lastVideoTime = -1;
    let lastStatus = "";
    let frameCounter = 0;
    let fpsWindowStart = performance.now();

    const report = (message: string) => {
      if (!cancelled && message !== lastStatus) {
        lastStatus = message;
        setStatus(message);
      }
    };

    const release = () => {
      cancelAnimationFrame(animation);
      clearTimeout(permissionTimer);
      stabilizer.reset();
      stream?.getTracks().forEach((track) => track.stop());
      detector?.dispose();
      if (videoRef.current) videoRef.current.srcObject = null;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setTrackingLocked(false);
      setFps(0);
    };

    const start = async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Live try-on needs HTTPS or localhost and a browser with camera support.",
          );
        }
        report("Allow camera access to start your live fitting.");
        permissionTimer = setTimeout(
          () =>
            report(
              "Waiting for camera permission. If no prompt appears in this preview, open localhost:3000/try-on in Chrome or Safari and allow camera access.",
            ),
          10_000,
        );
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 960 },
            height: { ideal: 720 },
            frameRate: { ideal: 60, min: 24 },
          },
        });
        clearTimeout(permissionTimer);
        if (cancelled) {
          release();
          return;
        }
        const video = videoRef.current;
        if (!video) throw new Error("Camera preview is unavailable.");
        video.srcObject = stream;
        await video.play();
        if (cancelled) {
          release();
          return;
        }
        report("Loading face tracking on your device…");
        detector = new FaceLandmarkDetector({
          wasmPath: process.env.NEXT_PUBLIC_VISION_WASM_PATH || "/vision",
          modelPath:
            process.env.NEXT_PUBLIC_FACE_MODEL_PATH || "/models/face_landmarker.task",
          runningMode: "VIDEO",
        });
        await detector.initialize();
        if (cancelled) {
          release();
          return;
        }

        const tick = () => {
          if (cancelled) return;
          try {
            const canvas = canvasRef.current;
            const selected = frameRef.current;
            const now = performance.now();

            frameCounter += 1;
            if (now - fpsWindowStart >= 500) {
              setFps(Math.round((frameCounter * 1000) / (now - fpsWindowStart)));
              frameCounter = 0;
              fpsWindowStart = now;
            }

            if (canvas && video.readyState >= 2) {
              const size = { width: video.videoWidth, height: video.videoHeight };
              const hasNewVideoFrame =
                !frozenRef.current && video.currentTime !== lastVideoTime;

              let activeGeometry = stabilizer.holdOrClear(now);
              let rawLandmarks: readonly { x: number; y: number; z?: number }[] | undefined;

              if (hasNewVideoFrame) {
                lastVideoTime = video.currentTime;
                const faces = detector!.detectVideo(video, now);
                rawLandmarks = faces.length === 1 ? faces[0] : undefined;
                if (rawLandmarks) {
                  const stabilizedLandmarks = stabilizeIrisLandmarks(rawLandmarks, size);
                  const rawFace = geometry.calculate(stabilizedLandmarks, size);
                  activeGeometry = stabilizer.update(rawFace, now);
                } else if (faces.length > 1) {
                  stabilizer.reset();
                  activeGeometry = null;
                }
              }

              if (activeGeometry && selected) {
                setTrackingLocked(true);
                const baseTransform = transforms.calculate(
                  activeGeometry,
                  selected.calibration,
                  selected,
                );
                const adjustedTransform = applyManualAdjustment(
                  baseTransform,
                  adjustmentRef.current,
                  activeGeometry.eyeDistance,
                );
                renderer.render(canvas, {
                  photo: video,
                  photoSize: size,
                  frame: selected.image,
                  frameSize: selected,
                  transform: adjustedTransform,
                  landmarks: showLandmarksRef.current ? rawLandmarks : undefined,
                  geometry: showLandmarksRef.current ? activeGeometry : undefined,
                });
                report(
                  frozenRef.current
                    ? "Pose frozen · switch frames below to compare fit."
                    : "Live stabilized fit · choose any frame below to change your look.",
                );
              } else if (!frozenRef.current) {
                setTrackingLocked(false);
                if (canvas.width !== size.width) canvas.width = size.width;
                if (canvas.height !== size.height) canvas.height = size.height;
                canvas.getContext("2d")?.drawImage(video, 0, 0);
                report(
                  !selected
                    ? "Choose a frame below."
                    : "Look toward the camera in good light.",
                );
              }
            }
            animation = requestAnimationFrame(tick);
          } catch (error) {
            release();
            setRunning(false);
            report(
              error instanceof Error
                ? error.message
                : "Face tracking stopped. Try again.",
            );
          }
        };
        animation = requestAnimationFrame(tick);
      } catch (error) {
        release();
        if (cancelled) return;
        setRunning(false);
        const cameraErrors: Record<string, string> = {
          NotAllowedError:
            "Camera access was denied. Allow camera access for localhost in your browser settings, then try again. If using an app preview, open this page in Chrome or Safari.",
          NotFoundError:
            "No camera was found. Connect a webcam, or use Photo upload above.",
          NotReadableError:
            "The camera is unavailable. Close other apps using it, then try again.",
          OverconstrainedError:
            "This camera does not support the requested video settings. Try another browser or Photo upload.",
        };
        report(
          error instanceof Error
            ? cameraErrors[error.name] ?? error.message
            : "Could not start your camera.",
        );
      }
    };
    void start();
    const onVisibility = () => {
      if (document.hidden) {
        setRunning(false);
        setFrozen(false);
        report("Camera stopped while the page is hidden.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
  }, [running]);

  return (
    <section className="preview-panel" aria-label="Live camera try-on">
      <div className="preview-toolbar">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${
              running && trackingLocked
                ? "bg-emerald-500 animate-pulse"
                : running
                  ? "bg-amber-400"
                  : "bg-stone-300"
            }`}
          />
          <strong>Live fitting mirror</strong>
          {running && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/10 text-emerald-900">
              {trackingLocked ? "1-Euro Stabilized" : "Searching face"}
              {fps > 0 ? ` · ${fps} FPS` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFrozen((prev) => !prev)}
            >
              {frozen ? "Resume video" : "Freeze pose"}
            </Button>
          )}
          <Button
            disabled={!frame && !running}
            onClick={() => {
              if (running) {
                setStatus("Camera stopped.");
                setFrozen(false);
              }
              setRunning(!running);
            }}
          >
            {running ? "Stop camera" : "Start camera"}
          </Button>
        </div>
      </div>
      <video ref={videoRef} muted playsInline className="sr-only" aria-hidden="true" />
      <div className="preview-area">
        <canvas
          ref={canvasRef}
          className={running ? "tryon-canvas" : "hidden"}
          style={{ transform: "scaleX(-1)" }}
          aria-label={`Live mirror with ${frame?.name ?? "selected glasses"}`}
        />
        {!running && (
          <div className="upload-empty">
            <h2>Try it on. Move with it.</h2>
            <p>Start the camera, then explore the frames below with stabilized tracking.</p>
          </div>
        )}
      </div>
      <div className="preview-footer">
        <span>{status}</span>
        {running && (
          <label className="debug-switch">
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={() => setShowLandmarks((v) => !v)}
            />
            <span>Show landmarks</span>
          </label>
        )}
      </div>
      {running && trackingLocked && onAdjustmentChange && onResetFit && (
        <FitControls
          value={adjustment}
          onChange={onAdjustmentChange}
          onReset={onResetFit}
        />
      )}
      {running && (
        <p className="preview-footer">
          If camera permission does not appear, open this page in Chrome or Safari. You can
          also stop the camera and choose Photo upload.
        </p>
      )}
      <p className="preview-footer">
        Video stays on this device. Temporal smoothing locks the frame steady when you pause
        and tracks smoothly when you turn.
      </p>
    </section>
  );
}

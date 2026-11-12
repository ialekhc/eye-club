"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUTOMATIC_FIT, applyManualAdjustment, CanvasRenderer, FaceGeometryCalculator, FrameTransformCalculator, type FaceGeometry, type Landmark, type ManualAdjustment } from "@eyewear/tryon-engine";
import { FaceLandmarkDetector } from "@eyewear/tryon-engine/face";
import { decodePhoto, releasePhoto } from "@/lib/images";
import type { LoadedFrame } from "@/lib/frame-schema";

export type TryOnStatus = "idle" | "validating" | "loading-model" | "detecting" | "rendering" | "ready" | "error";
interface PhotoSession { photo: HTMLCanvasElement; geometry: FaceGeometry; landmarks: readonly Landmark[] }
const geometryCalculator = new FaceGeometryCalculator();
const transformCalculator = new FrameTransformCalculator();
const renderer = new CanvasRenderer();
const paint = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

function draw(canvas: HTMLCanvasElement, session: PhotoSession, frame: LoadedFrame, adjustment: ManualAdjustment, debug: boolean) {
  const automatic = transformCalculator.calculate(session.geometry, frame.calibration, frame);
  renderer.render(canvas, {
    photo: session.photo, photoSize: { width: session.photo.width, height: session.photo.height },
    frame: frame.image, frameSize: frame,
    transform: applyManualAdjustment(automatic, adjustment, session.geometry.eyeDistance),
    ...(debug ? { landmarks: session.landmarks, geometry: session.geometry } : {}),
  });
}

export function useTryOn(frame: LoadedFrame | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<FaceLandmarkDetector | null>(null);
  const sessionRef = useRef<PhotoSession | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(false);
  const [geometry, setGeometry] = useState<FaceGeometry | null>(null);
  const [adjustment, setAdjustment] = useState<ManualAdjustment>({ ...AUTOMATIC_FIT });

  useEffect(() => {
    mounted.current = true;
    const requestGeneration = generation;
    return () => {
      mounted.current = false;
      requestGeneration.current++;
      detectorRef.current?.dispose();
      detectorRef.current = null;
      releasePhoto(sessionRef.current?.photo);
      sessionRef.current = null;
    };
  }, []);

  const renderCurrent = useCallback(() => {
    if (!canvasRef.current || !sessionRef.current || !frame || status !== "ready") return;
    try { draw(canvasRef.current, sessionRef.current, frame, adjustment, debug); }
    catch { setError("The preview couldn’t render. Please upload your photo again."); setStatus("error"); }
  }, [frame, adjustment, debug, status]);
  useEffect(() => {
    // Coalesce slider/anchor updates into one browser paint, and cancel stale draws.
    const pending = requestAnimationFrame(renderCurrent);
    return () => cancelAnimationFrame(pending);
  }, [renderCurrent]);

  const previewCalibration = useCallback((canvas: HTMLCanvasElement, candidate: LoadedFrame): boolean => {
    if (!sessionRef.current) return false;
    draw(canvas, sessionRef.current, candidate, AUTOMATIC_FIT, false);
    return true;
  }, []);

  const resetFit = useCallback(() => setAdjustment({ ...AUTOMATIC_FIT }), []);
  const reset = useCallback(() => {
    generation.current++;
    releasePhoto(sessionRef.current?.photo);
    sessionRef.current = null;
    if (canvasRef.current) { canvasRef.current.width = 0; canvasRef.current.height = 0; }
    setGeometry(null); setDebug(false); setError(""); setStatus("idle"); resetFit();
  }, [resetFit]);

  const upload = useCallback(async (file: File) => {
    if (!frame) return;
    reset();
    const current = generation.current;
    const active = () => mounted.current && current === generation.current;
    let photo: HTMLCanvasElement | undefined;
    try {
      setStatus("validating");
      photo = await decodePhoto(file);
      if (!active()) { releasePhoto(photo); return; }
      setStatus("loading-model");
      detectorRef.current ??= new FaceLandmarkDetector({
        wasmPath: process.env.NEXT_PUBLIC_VISION_WASM_PATH || "/vision",
        modelPath: process.env.NEXT_PUBLIC_FACE_MODEL_PATH || "/models/face_landmarker.task",
      });
      const detector = detectorRef.current;
      await detector.initialize();
      if (!active()) { releasePhoto(photo); return; }
      setStatus("detecting"); await paint();
      if (!active()) { releasePhoto(photo); return; }
      const faces = detector.detect(photo);
      if (faces.length === 0) throw new Error("No face detected. Try a well-lit, frontal photo with your eyes clearly visible.");
      if (faces.length > 1) throw new Error("More than one face detected. Please choose a photo of just you.");
      const landmarks = faces[0];
      if (!landmarks) throw new Error("Face landmarks are unavailable. Please try another photo.");
      const face = geometryCalculator.calculate(landmarks, { width: photo.width, height: photo.height });
      const session = { photo, landmarks, geometry: face };
      setStatus("rendering"); await paint();
      if (!active()) { releasePhoto(photo); return; }
      if (!canvasRef.current) throw new Error("Preview is unavailable. Please refresh the page.");
      draw(canvasRef.current, session, frame, AUTOMATIC_FIT, false);
      sessionRef.current = session;
      setGeometry(face); setStatus("ready");
    } catch (cause: unknown) {
      releasePhoto(photo);
      if (!active()) return;
      const message = cause instanceof Error ? cause.message : "Something went wrong. Please try again.";
      setError(/fetch|wasm|model|network|404/i.test(message)
        ? "The face model couldn’t load. Check your connection and try again. For local setup, run npm run assets:setup."
        : message);
      setStatus("error");
    }
  }, [frame, reset]);

  const toggleDebug = useCallback(() => setDebug((value) => !value), []);
  return { canvasRef, status, error, debug, geometry, upload, reset, toggleDebug,
    adjustment, setAdjustment, resetFit, previewCalibration };
}

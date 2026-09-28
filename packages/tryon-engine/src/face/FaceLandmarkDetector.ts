import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { Landmark } from "../types";

export interface DetectorConfiguration { wasmPath: string; modelPath: string }
export interface LandmarkDetector {
  initialize(): Promise<void>;
  detect(image: HTMLCanvasElement): readonly (readonly Landmark[])[];
  dispose(): void;
}

export class FaceLandmarkDetector implements LandmarkDetector {
  private landmarker: FaceLandmarker | undefined;
  private initialization: Promise<void> | undefined;
  private disposed = false;
  constructor(private readonly configuration: DetectorConfiguration) {}

  initialize(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("Face detector has been released."));
    this.initialization ??= this.load().catch((error: unknown) => {
      this.initialization = undefined;
      throw error;
    });
    return this.initialization;
  }

  private async load(): Promise<void> {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const files = await FilesetResolver.forVisionTasks(this.configuration.wasmPath);
    const landmarker = await FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: this.configuration.modelPath, delegate: "CPU" },
      runningMode: "IMAGE",
      // A limit of one would hide additional faces instead of rejecting them.
      numFaces: 2,
      minFaceDetectionConfidence: 0.6,
      minFacePresenceConfidence: 0.6,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    if (this.disposed) { landmarker.close(); return; }
    this.landmarker = landmarker;
  }

  detect(image: HTMLCanvasElement): readonly (readonly Landmark[])[] {
    if (!this.landmarker) throw new Error("Face detector is not ready.");
    return this.landmarker.detect(image).faceLandmarks;
  }

  dispose(): void {
    this.disposed = true;
    this.landmarker?.close();
    this.landmarker = undefined;
  }
}

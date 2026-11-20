import type { FaceGeometry, Landmark, Point, Size } from "../types";
import { denormalize } from "./FaceGeometryCalculator";

export interface StabilizerConfig {
  /** Minimum smoothing factor when head is nearly stationary (0 < minAlpha <= maxAlpha <= 1). */
  minAlpha?: number;
  /** Maximum smoothing factor during fast head movement. */
  maxAlpha?: number;
  /** Movement speed (in eye-distance units per second) at which alpha reaches maxAlpha. */
  velocityScale?: number;
  /** Sub-pixel deadband (as fraction of eyeDistance) to suppress micro-jitter when still. */
  deadbandRatio?: number;
  /** Duration in milliseconds to hold last valid geometry during brief 1-3 frame detection dropouts. */
  graceHoldMs?: number;
}

const DEFAULT_CONFIG: Required<StabilizerConfig> = {
  minAlpha: 0.22,
  maxAlpha: 0.88,
  velocityScale: 1.8,
  deadbandRatio: 0.0045,
  graceHoldMs: 180,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(prev: number, next: number, alpha: number): number {
  return prev + (next - prev) * alpha;
}

function lerpPoint(prev: Point, next: Point, alpha: number, deadbandPx: number): Point {
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const dist = Math.hypot(dx, dy);
  if (dist < deadbandPx) {
    return {
      x: lerp(prev.x, next.x, alpha * 0.35),
      y: lerp(prev.y, next.y, alpha * 0.35),
    };
  }
  return {
    x: lerp(prev.x, next.x, alpha),
    y: lerp(prev.y, next.y, alpha),
  };
}

/** Interpolates angles across the -PI / +PI boundary using the shortest arc. */
export function lerpAngle(prev: number, next: number, alpha: number, deadbandRad = 0.003): number {
  let delta = ((next - prev + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(delta) < deadbandRad) {
    return prev + delta * (alpha * 0.3);
  }
  return prev + delta * alpha;
}

/**
 * Blends iris centers (468, 473) with anatomical eye corners (33/133 and 362/263)
 * when present so that eye-gaze shifts do not slide the frame across the nose bridge.
 */
export function stabilizeIrisLandmarks(landmarks: readonly Landmark[], size: Size): readonly Landmark[] {
  const irisA = landmarks[468];
  const irisB = landmarks[473];
  const outerA = landmarks[33];
  const innerA = landmarks[133];
  const innerB = landmarks[362];
  const outerB = landmarks[263];

  if (!irisA || !irisB || !outerA || !innerA || !innerB || !outerB) {
    return landmarks;
  }

  // Verify corners are non-degenerate (not all identical dummy coordinates)
  const cornerSpanA = Math.hypot(
    (outerA.x - innerA.x) * size.width,
    (outerA.y - innerA.y) * size.height,
  );
  const cornerSpanB = Math.hypot(
    (outerB.x - innerB.x) * size.width,
    (outerB.y - innerB.y) * size.height,
  );
  if (cornerSpanA < 4 || cornerSpanB < 4) {
    return landmarks;
  }

  const socketCenterA: Landmark = {
    x: (outerA.x + innerA.x) / 2,
    y: (outerA.y + innerA.y) / 2,
  };
  const socketCenterB: Landmark = {
    x: (outerB.x + innerB.x) / 2,
    y: (outerB.y + innerB.y) / 2,
  };

  // Match each iris to its closest eye socket center
  const distAtoA = Math.hypot(irisA.x - socketCenterA.x, irisA.y - socketCenterA.y);
  const distAtoB = Math.hypot(irisA.x - socketCenterB.x, irisA.y - socketCenterB.y);
  const [socketFor468, socketFor473] =
    distAtoA <= distAtoB ? [socketCenterA, socketCenterB] : [socketCenterB, socketCenterA];

  // Blend 65% anatomical eye-socket center + 35% iris center for gaze stability
  const copy = landmarks.slice();
  copy[468] = {
    x: socketFor468.x * 0.65 + irisA.x * 0.35,
    y: socketFor468.y * 0.65 + irisA.y * 0.35,
  };
  copy[473] = {
    x: socketFor473.x * 0.65 + irisB.x * 0.35,
    y: socketFor473.y * 0.65 + irisB.y * 0.35,
  };
  return copy;
}

/**
 * Velocity-adaptive temporal smoother (1-Euro Filter principle) for live video try-on.
 * Eliminates high-frequency landmark jitter when stationary while remaining responsive
 * during intentional head motion and holding pose across brief 1-3 frame dropouts.
 */
export class FaceGeometryStabilizer {
  private readonly config: Required<StabilizerConfig>;
  private state: FaceGeometry | null = null;
  private lastTimestampMs: number | null = null;
  private lastSeenMs: number | null = null;

  constructor(config: StabilizerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  update(raw: FaceGeometry, timestampMs: number): FaceGeometry {
    if (!this.state || this.lastTimestampMs === null) {
      this.state = {
        leftEye: { ...raw.leftEye },
        rightEye: { ...raw.rightEye },
        midpoint: { ...raw.midpoint },
        noseBridge: { ...raw.noseBridge },
        eyeDistance: raw.eyeDistance,
        roll: raw.roll,
        faceWidth: raw.faceWidth,
      };
      this.lastTimestampMs = timestampMs;
      this.lastSeenMs = timestampMs;
      return this.state;
    }

    const dtSeconds = Math.max(0.004, Math.min(0.25, (timestampMs - this.lastTimestampMs) / 1000));
    const eyeScale = Math.max(16, this.state.eyeDistance);
    const displacement = Math.hypot(
      raw.midpoint.x - this.state.midpoint.x,
      raw.midpoint.y - this.state.midpoint.y,
    );
    const normalizedVelocity = displacement / eyeScale / dtSeconds;

    const velocityRatio = clamp(normalizedVelocity / this.config.velocityScale, 0, 1);
    const alpha = lerp(this.config.minAlpha, this.config.maxAlpha, velocityRatio);
    const deadbandPx = eyeScale * this.config.deadbandRatio;

    const leftEye = lerpPoint(this.state.leftEye, raw.leftEye, alpha, deadbandPx);
    const rightEye = lerpPoint(this.state.rightEye, raw.rightEye, alpha, deadbandPx);
    const midpoint = lerpPoint(this.state.midpoint, raw.midpoint, alpha, deadbandPx);
    const noseBridge = lerpPoint(this.state.noseBridge, raw.noseBridge, alpha, deadbandPx);
    const eyeDistance = lerp(this.state.eyeDistance, raw.eyeDistance, alpha);
    const faceWidth = lerp(this.state.faceWidth, raw.faceWidth, alpha);
    const roll = lerpAngle(this.state.roll, raw.roll, alpha);

    this.state = {
      leftEye,
      rightEye,
      midpoint,
      noseBridge,
      eyeDistance,
      roll,
      faceWidth,
    };
    this.lastTimestampMs = timestampMs;
    this.lastSeenMs = timestampMs;
    return this.state;
  }

  /**
   * Returns the held geometry if a face briefly drops out within graceHoldMs,
   * or null once the grace window expires.
   */
  holdOrClear(timestampMs: number): FaceGeometry | null {
    if (!this.state || this.lastSeenMs === null) return null;
    if (timestampMs - this.lastSeenMs <= this.config.graceHoldMs) {
      return this.state;
    }
    this.reset();
    return null;
  }

  reset(): void {
    this.state = null;
    this.lastTimestampMs = null;
    this.lastSeenMs = null;
  }
}

export { denormalize };

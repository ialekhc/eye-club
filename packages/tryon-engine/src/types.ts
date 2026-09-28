export interface Point { x: number; y: number }
export interface Size { width: number; height: number }
export interface Landmark extends Point { z?: number }
export interface FaceGeometry {
  leftEye: Point;
  rightEye: Point;
  midpoint: Point;
  noseBridge: Point;
  eyeDistance: number;
  roll: number;
  faceWidth: number;
}
/** Anchors are normalized to the original asset. Offsets are in eye-distance units;
 * rotationOffset is radians. Left/right always refer to image coordinates. */
export interface FrameCalibration {
  leftAnchorX: number; leftAnchorY: number;
  rightAnchorX: number; rightAnchorY: number;
  bridgeX: number; bridgeY: number;
  scaleMultiplier: number;
  offsetX: number; offsetY: number;
  rotationOffset: number;
}
export interface FrameTransform {
  position: Point;
  pivot: Point;
  scale: number;
  rotation: number;
}
export interface RenderScene {
  photo: CanvasImageSource;
  photoSize: Size;
  frame: CanvasImageSource;
  frameSize: Size;
  transform: FrameTransform;
  landmarks?: readonly Landmark[];
  geometry?: FaceGeometry;
}
export interface FrameRenderer { render(canvas: HTMLCanvasElement, scene: RenderScene): void }

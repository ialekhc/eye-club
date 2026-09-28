import type { FrameCalibration } from "@eyewear/tryon-engine";

/** Original sample artwork; anchors measured against the 1000 × 360 PNG. */
export const SAMPLE_FRAME = {
  id: "atelier-01",
  name: "The Everyday",
  collection: "Atelier / 01",
  color: "Matte black",
  shape: "Soft square",
  source: "/frames/atelier-01.png",
  width: 1000,
  height: 360,
  calibration: {
    leftAnchorX: 0.258, leftAnchorY: 0.5,
    rightAnchorX: 0.742, rightAnchorY: 0.5,
    bridgeX: 0.5, bridgeY: 0.425,
    scaleMultiplier: 1,
    offsetX: 0, offsetY: 0,
    rotationOffset: 0,
  } satisfies FrameCalibration,
} as const;

export const SAMPLE_FRAMES = [SAMPLE_FRAME, {
  id: "atelier-02", name: "The Weekender", collection: "Atelier / 02",
  color: "Warm bronze", shape: "Round sunglasses", source: "/frames/atelier-02.png",
  width: 800, height: 360,
  calibration: {
    leftAnchorX: .265, leftAnchorY: .5, rightAnchorX: .735, rightAnchorY: .5,
    bridgeX: .5, bridgeY: .4, scaleMultiplier: 1, offsetX: 0, offsetY: 0, rotationOffset: 0,
  },
}] as const;

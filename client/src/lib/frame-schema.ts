import { z } from "zod";
import { FrameCalibrationEngine } from "@eyewear/tryon-engine";

const normalized = z.number().min(0).max(1);
export const calibrationSchema = z.object({
  leftAnchorX: normalized, leftAnchorY: normalized,
  rightAnchorX: normalized, rightAnchorY: normalized,
  bridgeX: normalized, bridgeY: normalized,
  scaleMultiplier: z.number().min(.25).max(3),
  offsetX: z.number().min(-1).max(1), offsetY: z.number().min(-1).max(1),
  rotationOffset: z.number().min(-Math.PI / 2).max(Math.PI / 2),
}).refine((value) => value.leftAnchorX < value.rightAnchorX, { message: "Left eye anchor must be left of the right eye anchor.", path: ["leftAnchorX"] });

export const calibrationFormSchema = z.object({
  name: z.string().trim().min(1, "Give this frame a name.").max(80),
  calibration: calibrationSchema,
});
export type CalibrationFormValues = z.infer<typeof calibrationFormSchema>;

export const storedFrameSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(80),
  collection: z.string().max(80), color: z.string().max(80), shape: z.string().max(80),
  width: z.number().int().min(64).max(4096), height: z.number().int().min(32).max(4096),
  assetHash: z.string().regex(/^[a-f0-9]{64}$/),
  blob: z.custom<Blob>((value) => value instanceof Blob && value.size > 0 && value.size <= 10 * 1024 * 1024, "Invalid frame image."),
  calibration: calibrationSchema,
}).superRefine((frame, context) => {
  try { new FrameCalibrationEngine().resolve(frame.calibration, frame); }
  catch (error) { context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid calibration." }); }
});
export type StoredFrame = z.infer<typeof storedFrameSchema>;
export interface LoadedFrame extends StoredFrame { source: string; image: HTMLImageElement; remote?: boolean; productUrl?: string }

export const INITIAL_CALIBRATION = {
  leftAnchorX: .25, leftAnchorY: .5, rightAnchorX: .75, rightAnchorY: .5,
  bridgeX: .5, bridgeY: .4, scaleMultiplier: 1, offsetX: 0, offsetY: 0, rotationOffset: 0,
};

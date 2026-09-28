"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FrameCalibrationEngine, type Point } from "@eyewear/tryon-engine";
import { Button } from "@eyewear/ui";
import { Check, X } from "lucide-react";
import { calibrationFormSchema, type CalibrationFormValues, type LoadedFrame } from "@/lib/frame-schema";
import { ANCHORS, type AnchorName } from "@/lib/calibration-editor";
import { AnchorCanvas } from "./anchor-canvas";

interface Props {
  frame: LoadedFrame;
  isNew: boolean;
  hasPhoto: boolean;
  preview: (canvas: HTMLCanvasElement, frame: LoadedFrame) => boolean;
  onSave: (frame: LoadedFrame) => Promise<void>;
  onClose: () => void;
}

export function CalibrationDialog({ frame, isNew, hasPhoto, preview, onSave, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<AnchorName>("left");
  const [confirmed, setConfirmed] = useState<Record<AnchorName, boolean>>({ left: !isNew, right: !isNew, bridge: !isNew });
  const [saveError, setSaveError] = useState("");
  const { register, control, setValue, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CalibrationFormValues>({
    resolver: zodResolver(calibrationFormSchema), mode: "onChange",
    defaultValues: { name: frame.name, calibration: { ...frame.calibration } },
  });
  const values = useWatch({ control });
  const validated = calibrationFormSchema.safeParse(values);
  const calibration = validated.success ? validated.data.calibration : frame.calibration;
  const allPlaced = confirmed.left && confirmed.right && confirmed.bridge;
  let validationMessage = validated.success ? "" : validated.error.issues[0]?.message ?? "Check calibration values.";
  if (validated.success) {
    try { new FrameCalibrationEngine().resolve(validated.data.calibration, frame); }
    catch (cause) { validationMessage = cause instanceof Error ? cause.message : "Check anchor placement."; }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => { dialog.close(); };
  }, []);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    if (validationMessage || !allPlaced) { canvas.width = 0; canvas.height = 0; return; }
    preview(canvas, { ...frame, calibration });
  }, [frame, calibration, preview, validationMessage, allPlaced]);

  const move = useCallback((anchor: AnchorName, position: Point) => {
    const fields = ANCHORS.find((item) => item.key === anchor)!;
    setValue(`calibration.${fields.x}`, Number(position.x.toFixed(4)), { shouldValidate: true });
    setValue(`calibration.${fields.y}`, Number(position.y.toFixed(4)), { shouldValidate: true });
    setConfirmed((current) => ({ ...current, [anchor]: true }));
  }, [setValue]);

  const submit = handleSubmit(async (data) => {
    setSaveError("");
    if (!allPlaced) { setSaveError("Place or confirm all three anchors before saving."); return; }
    try {
      new FrameCalibrationEngine().resolve(data.calibration, frame);
      await onSave({ ...frame, name: data.name, calibration: data.calibration });
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Could not save calibration. Please try again."); }
  });

  return <dialog ref={dialogRef} className="calibration-dialog" aria-labelledby="calibration-title" aria-describedby="calibration-description"
    onCancel={(event) => { event.preventDefault(); if (!isSubmitting) onClose(); }}>
    <form onSubmit={submit} noValidate>
      <header className="calibration-header"><div><p className="eyebrow">Frame workspace · Stored on this device</p><h2 id="calibration-title">Calibrate your frame</h2></div>
        <Button variant="ghost" size="icon" disabled={isSubmitting} onClick={onClose} aria-label="Close calibration"><X /></Button></header>
      <p id="calibration-description" className="calibration-description">Place the eye anchors where pupils should sit inside each lens, then mark the bridge. Left and right refer to the image. Drag a marker or enter its coordinates.</p>
      <fieldset disabled={isSubmitting} className="calibration-body">
        <div className="calibration-workspace">
          <label className="field-label">Frame name<input {...register("name")} autoComplete="off" maxLength={80} aria-invalid={!!errors.name} /></label>
          <div className="anchor-tabs" aria-label="Choose anchor">{ANCHORS.map((anchor) => <button key={anchor.key} type="button" aria-pressed={active === anchor.key} onClick={() => setActive(anchor.key)}>
            <span style={{ background: anchor.color }} />{anchor.label}{confirmed[anchor.key] && <Check size={12} />}</button>)}</div>
          <AnchorCanvas frame={frame} calibration={calibration} active={active} confirmed={confirmed} onMove={move} onSelect={setActive} />
          <p className="editor-hint">{frame.width} × {frame.height} px · Original asset preserved · Arrow keys nudge the selected anchor</p>
          <div className="anchor-fields">{ANCHORS.map((anchor) => <div key={anchor.key}><span className="anchor-field-title">{anchor.label}</span>
            <label>X<input type="number" min={0} max={1} step="0.001" aria-label={`${anchor.label} X`} {...register(`calibration.${anchor.x}`, { valueAsNumber: true, onChange: () => setConfirmed((current) => ({ ...current, [anchor.key]: true })) })} /></label>
            <label>Y<input type="number" min={0} max={1} step="0.001" aria-label={`${anchor.label} Y`} {...register(`calibration.${anchor.y}`, { valueAsNumber: true, onChange: () => setConfirmed((current) => ({ ...current, [anchor.key]: true })) })} /></label>
          </div>)}</div>
          <div className="calibration-adjustments">{([
            { key: "scaleMultiplier", label: "Scale multiplier", min: .25, max: 3, step: .01 },
            { key: "offsetX", label: "X offset", min: -1, max: 1, step: .01 },
            { key: "offsetY", label: "Y offset", min: -1, max: 1, step: .01 },
            { key: "rotationOffset", label: "Rotation (radians)", min: -1.57, max: 1.57, step: .01 },
          ] as const).map((field) => <label key={field.key} className="field-label">{field.label}<input type="number" min={field.min} max={field.max} step={field.step} {...register(`calibration.${field.key}`, { valueAsNumber: true })} /></label>)}</div>
          <p className="editor-hint">X/Y anchors: 0–1 of the image. Offsets: fractions of eye distance. Rotation: radians.</p>
        </div>
        <section className="calibration-live" aria-label="Live calibration preview"><p className="eyebrow">Live preview</p>
          <div className="calibration-live-image"><canvas ref={previewRef} aria-label="Your photo with the draft frame calibration" hidden={!hasPhoto || !allPlaced || !!validationMessage} />
            {!hasPhoto ? <p>Add your photo in the fitting room to see calibration updates on your face. No photo is saved.</p> : !allPlaced ? <p>Place all three anchors to see your live preview.</p> : validationMessage ? <p>Correct the calibration values to update the preview.</p> : null}</div>
          <p className="editor-hint">Preview uses automatic fitting. Customer fine-tuning does not affect saved calibration.</p>
          <p className="calibration-status">{allPlaced ? "All anchors placed" : `${Object.values(confirmed).filter(Boolean).length} of 3 anchors placed`}</p>
        </section>
      </fieldset>
      {(validationMessage || saveError) && <p role="alert" className="calibration-error">{saveError || validationMessage}</p>}
      <footer className="calibration-footer"><Button variant="ghost" disabled={isSubmitting} onClick={() => { reset({ name: frame.name, calibration: { ...frame.calibration } }); setConfirmed({ left: !isNew, right: !isNew, bridge: !isNew }); setSaveError(""); }}>Reset draft</Button>
        <div><Button variant="outline" disabled={isSubmitting} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!allPlaced || !!validationMessage || isSubmitting}>{isSubmitting ? "Saving…" : "Save calibration"}</Button></div></footer>
    </form>
  </dialog>;
}

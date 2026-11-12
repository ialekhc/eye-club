import type { ManualAdjustment } from "@eyewear/tryon-engine";
import { Button } from "@eyewear/ui";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

export function FitControls({ value, onChange, onReset }: { value: ManualAdjustment; onChange: (value: ManualAdjustment) => void; onReset: () => void }) {
  return <details className="fit-controls"><summary><SlidersHorizontal size={14} />Fine-tune your fit</summary>
    <p>Small corrections for this photo only. Your frame calibration stays unchanged.</p>
    <div className="fit-sliders">{([
      { key: "x", label: "Horizontal", min: -.4, max: .4, step: .01, display: `${Math.round(value.x * 100)}%` },
      { key: "y", label: "Vertical", min: -.4, max: .4, step: .01, display: `${Math.round(value.y * 100)}%` },
      { key: "scale", label: "Size", min: .7, max: 1.3, step: .01, display: `${Math.round(value.scale * 100)}%` },
      { key: "rotation", label: "Rotation", min: -.26, max: .26, step: .01, display: `${(value.rotation * 180 / Math.PI).toFixed(1)}°` },
    ] as const).map((field) => <label key={field.key}><span>{field.label}<output>{field.display}</output></span>
      <input type="range" min={field.min} max={field.max} step={field.step} value={value[field.key]} onChange={(event) => onChange({ ...value, [field.key]: Number(event.target.value) })} />
    </label>)}</div>
    <Button variant="outline" size="sm" onClick={onReset}><RotateCcw />Reset automatic positioning</Button>
  </details>;
}

"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { ArrowRight, Check, CircleHelp, Eye, ImagePlus, LoaderCircle, LockKeyhole, RotateCcw, ScanFace, ShieldCheck, Upload, X, SlidersHorizontal, Plus } from "lucide-react";
import { Button } from "@eyewear/ui";
import { useTryOn, type TryOnStatus } from "@/features/try-on/hooks/use-try-on";
import { LiveTryOn } from "./live-try-on";
import { FrameDetails } from "./frame-details";
import { PhotoGuide } from "./photo-guide";
import { useFrameLibrary } from "@/features/try-on/hooks/use-frame-library";
import { importFrame } from "@/lib/frame-assets";
import type { LoadedFrame } from "@/lib/frame-schema";
import { CalibrationDialog } from "./calibration-dialog";
import { FitControls } from "./fit-controls";
import { createTryOnSession, trackTryOnEvent } from "@/lib/api-client";

const progressMessages: Partial<Record<TryOnStatus, { title: string; detail: string }>> = {
  validating: { title: "Preparing your photo", detail: "Checking the image and removing photo metadata." },
  "loading-model": { title: "Getting the studio ready", detail: "Loading the face model. The first visit takes a little longer." },
  detecting: { title: "Finding your fit", detail: "Locating your eyes and nose bridge on this device." },
  rendering: { title: "The finishing touch", detail: "Aligning the original frame to your face." },
};

function FaceIllustration() {
  return <svg viewBox="0 0 180 180" className="face-illustration" fill="none" aria-hidden="true">
    <path d="M37 63V42a8 8 0 0 1 8-8h20M115 34h20a8 8 0 0 1 8 8v21M143 117v21a8 8 0 0 1-8 8h-20M65 146H45a8 8 0 0 1-8-8v-21" stroke="#779185" strokeWidth="1.5" />
    <path d="M57 80c0-29 12-44 33-44s33 15 33 44v19c0 27-18 45-33 45s-33-18-33-45V80Z" fill="#e8ede6" stroke="#b1bfb2" strokeWidth="1.3" />
    <path d="M60 72c11-3 20-11 27-20 5 13 20 20 34 21M66 87h12m24 0h12M90 88l-4 19h8m-15 13c6 4 16 4 22 0" stroke="#92a28f" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M55 79c7-2 22-2 28 0l2 7h10l2-7c6-2 21-2 28 0l-3 18c-1 7-21 9-24 0l-3-11m-10 0-3 11c-3 9-23 7-24 0l-3-18Z" stroke="#244c3b" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="73" cy="88" r="2" fill="#244c3b" /><circle cx="107" cy="88" r="2" fill="#244c3b" />
    <path d="M73 88h34" stroke="#638d73" strokeDasharray="2 3" />
  </svg>;
}

export function TryOnStudio() {
  const library = useFrameLibrary();
  const [mode, setMode] = useState<"live" | "photo">("live");
  const { canvasRef, status, error, debug, geometry, upload, reset, toggleDebug, adjustment, setAdjustment, resetFit, previewCalibration } = useTryOn(library.selected);
  const [editor, setEditor] = useState<{ frame: LoadedFrame; isNew: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [frameError, setFrameError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [publicSession, setPublicSession] = useState<string | null>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);
  const draftUrls = useRef(new Set<string>());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const organization = new URLSearchParams(window.location.search).get("organization");
    if (organization) void createTryOnSession(organization).then((session) => { if (alive.current) setPublicSession(session.publicId); void trackTryOnEvent(session.publicId, "TRYON_STARTED").catch(() => undefined); }).catch(() => undefined);
    const urls = draftUrls.current;
    return () => { alive.current = false; urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear(); };
  }, []);
  const closeEditor = () => {
    if (editor?.isNew) { URL.revokeObjectURL(editor.frame.source); draftUrls.current.delete(editor.frame.source); }
    setEditor(null);
  };
  const saveCalibration = async (frame: LoadedFrame) => {
    await library.save(frame);
    draftUrls.current.delete(frame.source);
    resetFit(); setEditor(null); setConfirmRemoval(false); setNotice(`${frame.name} calibration saved on this device.`);
  };
  const uploadFrame = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setImporting(true); setFrameError(""); setNotice("");
    try {
      const frame = await importFrame(file);
      if (!alive.current) { URL.revokeObjectURL(frame.source); return; }
      draftUrls.current.add(frame.source); setEditor({ frame, isNew: true });
    } catch (cause) { if (alive.current) setFrameError(cause instanceof Error ? cause.message : "The frame could not be imported."); }
    finally { if (alive.current) setImporting(false); }
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dropError, setDropError] = useState("");
  const ready = status === "ready";
  const busy = !["idle", "error", "ready"].includes(status);
  const progress = progressMessages[status];
  const choosePhoto = () => inputRef.current?.click();
  const shareFrame = async () => { if (!library.selected) return; const shareData = { title: `${library.selected.name} · eye club`, text: "Try this frame in the eye club fitting room.", url: window.location.href }; try { if (navigator.share) await navigator.share(shareData); else await navigator.clipboard.writeText(window.location.href); setNotice("Share link copied."); } catch { setNotice("Sharing was cancelled."); } };
  const acceptFiles = (files: FileList | null) => {
    if (!files?.length || busy || !library.selected) return;
    if (files.length !== 1) { setDropError("Please choose one photo at a time."); return; }
    const file = files[0];
    if (file) { setDropError(""); void upload(file); }
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => { acceptFiles(event.target.files); event.target.value = ""; };
  const onDrop = (event: DragEvent) => { event.preventDefault(); setDragging(false); acceptFiles(event.dataTransfer.files); };

  return <>
    <a href="#studio" className="skip-link">Skip to fitting studio</a>
    <header className="site-header"><a href="/" aria-label="Eye Club home" className="wordmark"><Eye size={27} strokeWidth={1.6} /><span>eye club<span className="wordmark-dot">.</span></span></a>
      <nav aria-label="Main navigation" className="header-nav"><a href="#studio" aria-current="page">Try-on studio</a><a href="#how-it-works">How it works</a><a href="/eyeglasses">Shop Frames</a></nav>
      <a href="#privacy" className="header-privacy"><ShieldCheck size={15} strokeWidth={1.5} /><span>Private by design</span></a>
    </header>
    <main id="studio" className="studio-shell">
      <div className="page-heading"><div><p className="eyebrow flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-800" />Your personal fitting room</p>
        <h1>Your next frame, <span>on you.</span></h1><p className="page-description">A little less guessing. A whole new way to find your look.</p></div>
        <span className="phase-label">LIVE + PHOTO TRY-ON <span>01</span></span></div>
      <ol className="steps" aria-label="Try-on progress">{(mode === "live" ? ["Start your camera", "Choose a frame", "Move and explore"] : ["Add your photo", "Find your fit", "See your look"]).map((label, index) => {
        const done = ready || (busy && index === 0);
        const current = ready ? index === 2 : busy ? index === 1 : index === 0;
        return <li key={label} className={current || done ? "step active" : "step"} aria-current={current ? "step" : undefined}>
          <span className="step-number">{done && index < 2 ? <Check size={12} /> : `0${index + 1}`}</span>{label}{index < 2 && <span className="step-line" />}</li>;
      })}</ol>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={onChange} className="sr-only" tabIndex={-1} aria-label="Take or choose your face photo" disabled={busy || !library.selected || importing} />
      <div className="collection-actions" role="group" aria-label="Try-on mode">
        <Button aria-pressed={mode === "live"} onClick={() => { reset(); setMode("live"); }}>Live camera</Button>
        <Button aria-pressed={mode === "photo"} onClick={() => setMode("photo")}>Photo upload</Button>
      </div>
      <div className="studio-grid">
        {mode === "live" && <LiveTryOn frame={library.selected} />}
        <section style={{ display: mode === "photo" ? undefined : "none" }} className="preview-panel" aria-label="Virtual try-on preview">
          <div className="preview-toolbar"><span className="flex items-center gap-2 text-xs font-medium"><span className={`size-1.5 rounded-full ${ready ? "bg-emerald-600" : "bg-stone-300"}`} />{ready ? "Your fitting preview" : "Your photo"}</span>
            <div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={choosePhoto} disabled={busy || !library.selected || importing}><ImagePlus />{ready ? "Change photo" : "Add photo"}</Button>
              {(ready || busy || status === "error") && <Button variant="ghost" size="icon" onClick={() => { reset(); setDropError(""); }} aria-label={busy ? "Cancel photo processing" : "Remove photo and reset"}>{busy ? <X /> : <RotateCcw />}</Button>}</div></div>
          <div className={`preview-area ${dragging ? "is-dragging" : ""} ${ready ? "has-photo" : ""}`}
            onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} aria-busy={busy}>
            <canvas ref={canvasRef} className={ready ? "tryon-canvas" : "hidden"} aria-label={`Your photo with ${library.selected?.name ?? "the selected frame"} fitted over your eyes`} />
            {!ready && !busy && <div className="upload-empty"><span className="corner corner-tl" /><span className="corner corner-tr" /><span className="corner corner-bl" /><span className="corner corner-br" />
              <FaceIllustration /><p className="empty-eyebrow">SEE YOURSELF IN SOMETHING NEW</p><h2>Let’s find your look.</h2><p className="empty-description">Add a clear photo of yourself.<br />We’ll take care of the fit.</p>
              <Button onClick={choosePhoto} disabled={!library.selected || importing} className="mt-7 min-w-44"><Upload size={16} />Upload your photo<ArrowRight size={16} /></Button>
              <p className="mt-3 text-[11px] text-stone-500">or drop it here · JPG, PNG, WebP · up to 10 MB</p>
              <p className="mt-7 flex items-center gap-1.5 text-[11px] text-stone-500"><LockKeyhole size={12} />Your photo stays on your device.</p>
            </div>}
            {busy && <div className="loading-state" role="status"><LoaderCircle className="size-7 animate-spin text-emerald-800" /><h2>{progress?.title}</h2><p>{progress?.detail}</p><Button variant="ghost" size="sm" onClick={reset}>Cancel</Button></div>}
            {ready && <div className="auto-fit-badge"><ScanFace size={14} />{adjustment.x || adjustment.y || adjustment.rotation || adjustment.scale !== 1 ? "Manually adjusted" : "Automatically fitted"}</div>}
          </div>
          {(error || dropError) && <div role="alert" className="error-message"><CircleHelp className="size-4 shrink-0" /><p>{dropError || error}</p></div>}
          <div className="preview-footer"><span className="flex items-center gap-2"><LockKeyhole size={13} />On-device processing</span>
            <label className={`debug-switch ${!ready ? "opacity-50" : ""}`}><input type="checkbox" checked={debug} disabled={!ready} onChange={toggleDebug} /><span>Show landmarks</span></label></div>
          {debug && geometry && <dl className="debug-metrics"><div><dt>Eye distance</dt><dd>{geometry.eyeDistance.toFixed(1)} px</dd></div><div><dt>Head roll</dt><dd>{(geometry.roll * 180 / Math.PI).toFixed(1)}°</dd></div><div><dt>Face width</dt><dd>{geometry.faceWidth.toFixed(1)} px</dd></div></dl>}
          {ready && <FitControls value={adjustment} onChange={setAdjustment} onReset={resetFit} />}
        </section>
        {library.selected ? <FrameDetails ready={ready} frame={library.selected} count={library.frames.length} favorite={favorites.has(library.selected.id)} onFavorite={() => { const selectedId = library.selected!.id; setFavorites((current) => { const next = new Set(current); if (next.has(selectedId)) next.delete(selectedId); else next.add(selectedId); return next; }); if (publicSession) void trackTryOnEvent(publicSession, "FRAME_FAVORITED", selectedId).catch(() => undefined); }} onShare={() => { if (publicSession) void trackTryOnEvent(publicSession, "RESULT_SHARED", library.selected!.id).catch(() => undefined); void shareFrame(); }} productUrl={library.selected.productUrl} onProductClick={() => { if (publicSession) void trackTryOnEvent(publicSession, "PRODUCT_CLICKED", library.selected!.id).catch(() => undefined); }} /> : <aside className="frame-details"><p role="status">{library.loading ? "Loading your frames…" : "No frames available. Add a transparent frame below."}</p></aside>}
      </div>

      <section className="collection" aria-labelledby="collection-title"><div className="collection-heading"><h2 id="collection-title">The fitting collection <span>{String(library.frames.length).padStart(2, "0")}</span></h2>
        <div className="collection-actions"><Button variant="outline" size="sm" disabled={busy || importing || !library.selected} onClick={() => { if (library.selected) setEditor({ frame: library.selected, isNew: false }); }}><SlidersHorizontal />Calibrate frame</Button><Button variant="outline" size="sm" disabled={busy || importing} onClick={() => { setCompareMode((value) => !value); setCompareIds([]); }}>{compareMode ? "Close compare" : "Compare"}</Button>
          <Button size="sm" disabled={busy || importing || library.loading} onClick={() => frameInputRef.current?.click()}><Plus />{importing ? "Reading asset…" : "Add frame"}</Button></div></div>
        <input ref={frameInputRef} type="file" accept="image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Upload a transparent frame" onChange={(event) => { void uploadFrame(event); }} />
        <div className="frame-carousel">{library.frames.map((frame) => <button key={frame.id} type="button" className="frame-card" aria-label={compareMode ? `Compare ${frame.name}` : `Try ${frame.name}`} aria-pressed={compareMode ? compareIds.includes(frame.id) : library.selected?.id === frame.id}
          disabled={busy || importing} onClick={() => { if (compareMode) { setCompareIds((current) => current.includes(frame.id) ? current.filter((id) => id !== frame.id) : current.length < 2 ? [...current, frame.id] : current); return; } library.select(frame.id); if (publicSession) void trackTryOnEvent(publicSession, "FRAME_SELECTED", frame.id).catch(() => undefined); resetFit(); setNotice(""); setConfirmRemoval(false); }}>
          <div className="frame-card-image"><Image src={frame.source} alt="" width={frame.width} height={frame.height} unoptimized />{library.selected?.id === frame.id && <span className="selected-check"><Check size={11} /></span>}</div>
          <div><h3>{frame.name}</h3><p>{frame.color} · {frame.shape}</p></div>
        </button>)}</div>{compareMode && <div className="compare-panel"><p className="eyebrow">Side-by-side comparison · choose up to two frames</p><div className="compare-grid">{compareIds.map((id) => { const frame = library.frames.find((item) => item.id === id); return frame ? <article key={frame.id}><Image src={frame.source} alt={frame.name} width={frame.width} height={frame.height} unoptimized /><h3>{frame.name}</h3><p>{frame.color} · {frame.shape}</p></article> : null; })}</div></div>}
        <p className="editor-hint">Twelve original samples, plus your transparent PNG/WebP frames. Calibrations are saved in this browser; photos are never saved.</p>
        {(library.error || frameError) && <p role="alert" className="error-message">{frameError || library.error}</p>}
        {notice && <p role="status" className="save-notice">{notice}</p>}
        {library.removable && <div className="local-frame-removal">{confirmRemoval ? <>
          <p>Remove this frame and its calibration from this browser? Your original file is unaffected.</p>
          <Button variant="outline" size="sm" disabled={busy || importing} onClick={async () => {
            if (!library.selected) return;
            setImporting(true);
            try { await library.remove(library.selected); resetFit(); setConfirmRemoval(false); setNotice("Local frame removed."); }
            catch (cause) { setFrameError(cause instanceof Error ? cause.message : "Could not remove the frame."); }
            finally { setImporting(false); }
          }}>Confirm removal</Button><Button variant="ghost" size="sm" disabled={importing} onClick={() => setConfirmRemoval(false)}>Keep frame</Button>
        </> : <Button variant="ghost" size="sm" disabled={busy || importing} onClick={() => setConfirmRemoval(true)}>Remove saved frame</Button>}</div>}
      </section>
      {editor && <CalibrationDialog key={editor.frame.source} frame={editor.frame} isNew={editor.isNew} hasPhoto={ready} preview={previewCalibration} onSave={saveCalibration} onClose={closeEditor} />}
      <PhotoGuide />
      <details id="privacy" className="privacy-details"><summary><ShieldCheck size={16} />Your photo. Your privacy.</summary><p>Your photo and face landmarks are processed in your browser’s memory. They are never uploaded, logged, or saved by this application. The model is served from this app; no third-party detection service is used. Reset or close this page to release the photo. This version does not save results or collect analytics. Virtual placement is an approximate visual preview, not a measurement of physical fit.</p></details>
    </main>
    <footer className="site-footer"><span className="font-medium text-stone-700">eye club.</span><p>A clearer picture of your next pair.</p><span>Calibration studio · Phase 2</span></footer>
  </>;
}

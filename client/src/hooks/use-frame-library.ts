"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SAMPLE_FRAMES } from "@/lib/sample-frame";
import { hydrateFrame, readFrameAsset } from "@/lib/frame-assets";
import { loadFrame } from "@/lib/images";
import { frameStorage } from "@/lib/frame-storage";
import type { LoadedFrame } from "@/lib/frame-schema";
import { getPublicCatalogue } from "@/lib/api-client";

export function useFrameLibrary() {
  const [frames, setFrames] = useState<LoadedFrame[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_FRAMES[0]!.id);
  const urls = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    const ownedUrls = urls.current;
    const fallbackTimer = window.setTimeout(() => {
      if (!active) return;
      const fallback = SAMPLE_FRAMES.map((sample) => { const image = new Image(); image.src = sample.source; return { ...sample, image, source: sample.source, assetHash: "0".repeat(64), version: 1 as const, blob: new Blob(["fallback"], { type: "image/png" }) }; });
      setFrames((current) => current.length ? current : fallback);
      setError((current) => current || "Local frame storage is unavailable; using built-in samples.");
      setLoading(false);
    }, 3_000);
    async function load() {
      const loaded: LoadedFrame[] = [];
      const issues: string[] = [];
      const organization = new URLSearchParams(window.location.search).get("organization");
      if (organization) {
        try {
          const catalogue = await getPublicCatalogue(organization);
          for (const product of catalogue) {
            if (!product.asset) continue;
            const response = await fetch(product.asset.url);
            if (!response.ok) continue;
            const blob = await response.blob();
            const asset = await readFrameAsset(blob);
            loaded.push({ ...asset, version: 1, id: product.id, blob, name: product.name, collection: "Merchant collection", color: product.frameColor ?? "Original asset", shape: product.frameShape ?? "Custom frame", calibration: { leftAnchorX: Number(product.calibration?.leftAnchorX ?? .25), leftAnchorY: Number(product.calibration?.leftAnchorY ?? .5), rightAnchorX: Number(product.calibration?.rightAnchorX ?? .75), rightAnchorY: Number(product.calibration?.rightAnchorY ?? .5), bridgeX: Number(product.calibration?.bridgeX ?? .5), bridgeY: Number(product.calibration?.bridgeY ?? .4), scaleMultiplier: Number(product.calibration?.scaleMultiplier ?? 1), offsetX: Number(product.calibration?.offsetX ?? 0), offsetY: Number(product.calibration?.offsetY ?? 0), rotationOffset: Number(product.calibration?.rotationOffset ?? 0) }, remote: true, productUrl: product.productUrl ?? undefined });
          }
        } catch (cause) { issues.push(cause instanceof Error ? cause.message : "The merchant catalogue could not load."); }
      }
      let saved: Awaited<ReturnType<typeof frameStorage.list>> = [];
      try {
        saved = await Promise.race([
          frameStorage.list(),
          new Promise<Awaited<ReturnType<typeof frameStorage.list>>>((resolve) => window.setTimeout(() => resolve([]), 750)),
        ]);
      }
      catch (cause) { issues.push(cause instanceof Error ? cause.message : "Local frame storage is unavailable."); }
      for (const sample of SAMPLE_FRAMES) {
        if (saved.some((record) => record.id === sample.id)) continue;
        try {
          const response = await fetch(sample.source);
          if (!response.ok) throw new Error(`Could not load ${sample.name}.`);
          const blob = await response.blob();
          const image = await loadFrame(sample.source);
          loaded.push({ ...sample, image, source: sample.source, assetHash: "0".repeat(64), version: 1, blob });
        } catch (cause) { issues.push(cause instanceof Error ? cause.message : "A sample frame could not load."); }
      }
      for (const record of saved) {
        try { loaded.push(await hydrateFrame(record)); }
        catch (cause) { issues.push(cause instanceof Error ? cause.message : "A saved frame could not load."); }
      }
      if (!active) { loaded.forEach((frame) => URL.revokeObjectURL(frame.source)); return; }
      loaded.forEach((frame) => ownedUrls.add(frame.source));
      const requestedFrame = new URLSearchParams(window.location.search).get("frame");
      const requested = requestedFrame ? loaded.find((frame) => frame.id === requestedFrame) : undefined;
      setFrames(loaded); if (requested) setSelectedId(requested.id); setError(issues.join(" ")); setLoading(false);
    }
    void load().catch(() => { if (active) { setError("The frame library could not load. Refresh to retry."); setLoading(false); } });
    return () => { active = false; window.clearTimeout(fallbackTimer); ownedUrls.forEach((source) => URL.revokeObjectURL(source)); ownedUrls.clear(); };
  }, []);

  const save = useCallback(async (frame: LoadedFrame) => {
    await frameStorage.save(frame); // Publish to the collection only after a committed transaction.
    urls.current.add(frame.source);
    setFrames((current) => [...current.filter((item) => item.id !== frame.id), frame]);
    setSelectedId(frame.id);
  }, []);

  const remove = useCallback(async (frame: LoadedFrame) => {
    if (SAMPLE_FRAMES.some((sample) => sample.id === frame.id)) throw new Error("Built-in samples cannot be removed.");
    await frameStorage.remove(frame.id);
    setFrames((current) => current.filter((item) => item.id !== frame.id));
    setSelectedId(SAMPLE_FRAMES[0]!.id);
    urls.current.delete(frame.source); URL.revokeObjectURL(frame.source);
  }, []);

  return { frames, selected: frames.find((frame) => frame.id === selectedId) ?? frames[0] ?? null,
    select: setSelectedId, save, remove, loading, error,
    removable: !!frames.find((frame) => frame.id === selectedId && !frame.remote && !SAMPLE_FRAMES.some((sample) => sample.id === frame.id)) };
}

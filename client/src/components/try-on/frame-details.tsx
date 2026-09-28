import Image from "next/image";
import { Check, Glasses, Heart, MoveUpRight, Share2, ExternalLink } from "lucide-react";
import { Button } from "@eyewear/ui";
import type { LoadedFrame } from "@/lib/frame-schema";

export function FrameDetails({ ready, frame, count, favorite, onFavorite, onShare, productUrl, onProductClick }: { ready: boolean; frame: LoadedFrame; count: number; favorite: boolean; onFavorite: () => void; onShare: () => void; productUrl?: string; onProductClick?: () => void }) {
  return <aside className="frame-details" aria-labelledby="frame-title">
    <div className="flex items-center justify-between"><span className="eyebrow">In the fitting room</span><span className="text-xs text-stone-400">{count} calibrated</span></div>
    <div className="product-image"><Image src={frame.source} alt={`Front view of ${frame.name}`} width={frame.width} height={frame.height} loading="eager" unoptimized /></div>
    <p className="text-xs tracking-widest text-stone-500 uppercase">{frame.collection}</p>
    <h2 id="frame-title" className="mt-2 text-[30px] font-medium tracking-tight">{frame.name}</h2>
    <p className="mt-3 text-sm leading-6 text-stone-500">The original frame asset, independently calibrated to follow your eye distance and head angle.</p>
    <div className="my-6 flex items-center gap-2.5 text-xs"><span className="size-5 rounded-full border-4 border-white bg-[#242824] ring-1 ring-stone-300" />{frame.color}</div>
    <dl className="product-specs"><div><dt>Shape</dt><dd>{frame.shape}</dd></div><div><dt>Style</dt><dd>{frame.shape.includes("sunglasses") ? "Sunglasses" : "Eyeglasses"}</dd></div><div><dt>Asset</dt><dd>{frame.blob.type === "image/webp" ? "Transparent WebP" : "Transparent PNG"}</dd></div><div><dt>Fit calibration</dt><dd className="inline-flex items-center gap-1.5 text-emerald-800"><Check className="size-3.5" />Ready</dd></div></dl>
    <div className="fit-note"><Glasses className="size-5 shrink-0" strokeWidth={1.5} /><p>{ready ? "Automatically fitted to your eye distance and head angle." : "Your frame will be fitted automatically when you add a photo."}</p></div>
    <div className="frame-actions"><Button variant="outline" size="sm" onClick={onFavorite} aria-pressed={favorite}><Heart className={favorite ? "fill-current" : ""} />{favorite ? "Favorited" : "Favorite"}</Button><Button variant="outline" size="sm" onClick={onShare}><Share2 />Share</Button></div>
    {productUrl && <a className="product-link" href={productUrl} target="_blank" rel="noreferrer" onClick={onProductClick}>View product <ExternalLink /></a>}
    <div className="mt-auto pt-7"><p className="flex items-center gap-2 text-xs font-medium text-stone-600">Local frame collection <MoveUpRight className="size-3" /></p>
      <p className="mt-2 text-xs leading-5 text-stone-500">Frames and calibration are saved on this device. Merchant accounts and shared catalogues arrive in Phase 3.</p></div>
  </aside>;
}

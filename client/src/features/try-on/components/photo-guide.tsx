import { Glasses, ScanFace, Sun } from "lucide-react";

const tips = [
  { icon: ScanFace, title: "Face the camera", description: "One person, eyes open, head facing forward." },
  { icon: Sun, title: "Find your light", description: "Even, natural light gives the clearest fit." },
  { icon: Glasses, title: "Start without glasses", description: "Keep your eyes and the bridge of your nose visible." },
];

export function PhotoGuide() {
  return <section id="how-it-works" className="photo-guide scroll-mt-8" aria-labelledby="guide-title">
    <div className="guide-heading"><span className="eyebrow">A better photo. A better fit.</span>
      <h2 id="guide-title" className="sr-only">How to get the best try-on result</h2></div>
    <div className="grid gap-6 sm:grid-cols-3">{tips.map(({ icon: Icon, title, description }) =>
      <div key={title} className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-stone-500" strokeWidth={1.5} />
        <div><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p></div>
      </div>)}</div>
  </section>;
}

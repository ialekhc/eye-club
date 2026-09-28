"use client";
import { Button } from "@eyewear/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-5 px-6">
    <p className="eyebrow">Eye Club</p><h1 className="text-3xl">The studio couldn’t open.</h1>
    <p className="text-stone-600">Please try again. Your photo has not been uploaded or saved to a server.</p>
    <Button onClick={reset}>Try again</Button>
  </main>;
}

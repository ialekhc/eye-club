import Link from "next/link";
export default function NotFound() {
  return <main className="mx-auto max-w-lg px-6 py-32"><p className="eyebrow">404</p>
    <h1 className="my-5 text-3xl">This page isn’t in the collection.</h1>
    <Link href="/" className="underline underline-offset-4">Back to the collection</Link></main>;
}

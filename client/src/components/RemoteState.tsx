'use client';
import Link from 'next/link';
export function RemoteError({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{message}</p><div className="mt-2 flex gap-4">{retry ? <button onClick={retry} className="underline">Try again</button> : null}<Link href="/login" className="underline">Sign in</Link></div></div>;
}

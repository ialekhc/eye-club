'use client';
import Link from 'next/link';
import { useResource } from '@/lib/use-resource';
import { Store } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
export default function StoresPage() {
  const { data, error, loading, reload } = useResource<Store[]>('/stores');
  return <div className="container mx-auto px-4 py-12"><h1 className="mb-8 text-3xl font-bold">Our stores</h1>{error ? <RemoteError message={error} retry={reload} /> : null}{loading ? <p>Loading stores…</p> : null}<div className="grid gap-6 md:grid-cols-2">{data?.map(store => <article key={store.id} className="rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">{store.name}</h2><p>{store.address}</p>{store.phone ? <a className="underline" href={`tel:${store.phone}`}>{store.phone}</a> : null}<p className="my-3">{store.openingHours}</p><p>{store.services.join(' · ')}</p><Link className="mt-4 inline-block underline" href="/book-exam">Book an eye exam</Link><a className="ml-4 underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} target="_blank" rel="noreferrer">Directions</a></article>)}</div>{data?.length === 0 ? <p>No stores listed yet.</p> : null}</div>;
}

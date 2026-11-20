'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useResource } from '@/lib/use-resource';
import { commerceRequest } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
type Item = { id: string; product: { name: string; slug: string } };
export default function WishlistPage() {
  const { data, loading, error, reload } = useResource<Item[]>('/wishlist'); const [actionError, setActionError] = useState('');
  async function remove(id: string) { try { await commerceRequest(`/wishlist/${id}`, { method: 'DELETE' }); reload(); } catch(e) { setActionError((e as Error).message); } }
  return <div className="mx-auto max-w-3xl p-8"><h1 className="mb-6 text-3xl font-bold">Wishlist</h1>{error || actionError ? <RemoteError message={error || actionError} retry={reload} /> : null}{loading ? <p>Loading wishlist…</p> : null}{data?.length === 0 ? <p>No saved frames yet.</p> : null}{data?.map(item => <article key={item.id} className="my-4 flex justify-between rounded-xl border p-5"><Link className="underline" href={`/products/${item.product.slug}`}>{item.product.name}</Link><button onClick={() => remove(item.id)}>Remove</button></article>)}</div>;
}

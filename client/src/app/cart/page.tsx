'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CartItem, commerceRequest, jsonBody, linePrice, money } from '@/lib/commerce-api';
import { useResource } from '@/lib/use-resource';
import { RemoteError } from '@/components/RemoteState';
export default function CartPage() {
  const resource = useResource<CartItem[]>('/cart');
  const items = resource.data ?? [];
  const [actionError, setError] = useState('');
  const error = actionError || resource.error;
  const loading = resource.loading;
  const load = resource.reload;
  const [busy, setBusy] = useState(false);
  async function update(id: string, quantity?: number) { setBusy(true); try { await commerceRequest(`/cart/${id}`, { method: quantity ? 'PUT' : 'DELETE', body: quantity ? jsonBody({ quantity }) : undefined }); await load(); window.dispatchEvent(new Event('cart-updated')); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } }
  const subtotal = items.reduce((sum, item) => sum + linePrice(item) * item.quantity, 0);
  const shipping = subtotal >= 5000 || !items.length ? 0 : 200;
  return <div className="container mx-auto max-w-4xl px-4 py-12"><h1 className="mb-8 text-3xl font-bold">Shopping cart</h1>{error ? <RemoteError message={error} retry={load} /> : null}{loading ? <p role="status">Loading cart…</p> : !items.length && !error ? <p>Your cart is empty. <Link className="underline" href="/eyeglasses">Browse frames</Link></p> : null}<div className="space-y-4">{items.map(item => <article key={item.id} className="rounded-xl border bg-white p-6"><h2 className="text-lg font-bold">{item.product.name}</h2><p>{item.variant.color} · {item.variant.size}</p>{item.lensPackage ? <p>Lenses: {item.lensPackage.name}</p> : null}<p className="my-3">{money(linePrice(item))} each</p><div className="flex items-center gap-4"><button aria-label={`Decrease ${item.product.name} quantity`} disabled={busy || item.quantity <= 1} onClick={() => update(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.product.name} quantity`} disabled={busy || item.quantity >= 20} onClick={() => update(item.id, item.quantity + 1)}>+</button><button disabled={busy} className="ml-auto text-red-700 underline" onClick={() => update(item.id)}>Remove</button></div></article>)}</div>{items.length ? <aside className="mt-8 rounded-xl border p-6"><p>Subtotal: {money(subtotal)}</p><p>Shipping: {money(shipping)}</p><p className="my-4 text-xl font-bold">Total: {money(subtotal + shipping)}</p><Link className="inline-block rounded-xl bg-primary px-6 py-3 text-white" href="/checkout">Proceed to checkout</Link></aside> : null}</div>;
}

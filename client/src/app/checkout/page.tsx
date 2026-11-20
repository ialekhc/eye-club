'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { CartItem, commerceRequest, jsonBody, linePrice, money, Order } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { commerceRequest<CartItem[]>('/cart').then(setItems).catch(e => setError(e.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting.current) return; submitting.current = true; setBusy(true); setError('');
    const address = Object.fromEntries(new FormData(event.currentTarget));
    try { setOrder(await commerceRequest<Order>('/orders/checkout', { method: 'POST', body: jsonBody({ address, paymentMethod: 'CASH_ON_DELIVERY' }) })); window.dispatchEvent(new Event('cart-updated')); }
    catch(e) { setError((e as Error).message); } finally { submitting.current = false; setBusy(false); }
  }
  if (order) return <div className="mx-auto max-w-xl p-12"><h1 className="text-3xl font-bold">Order received</h1><p className="my-4">{order.orderNumber}</p><p>Pay {money(order.totalAmount)} on delivery.</p><Link className="mt-6 inline-block underline" href="/account/orders">Track your order</Link></div>;
  const subtotal = items?.reduce((sum, item) => sum + linePrice(item) * item.quantity, 0) ?? 0;
  return <div className="mx-auto max-w-2xl px-4 py-12"><h1 className="mb-6 text-3xl font-bold">Checkout</h1>{error ? <RemoteError message={error} /> : null}{!items ? <p>Loading checkout…</p> : !items.length ? <p>Your cart is empty. <Link href="/eyeglasses" className="underline">Browse frames</Link></p> : <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">Delivery address</h2>{[['fullName','Full name'],['phone','Phone number'],['province','Province'],['district','District'],['municipality','Municipality'],['ward','Ward (optional)'],['street','Street address'],['landmark','Landmark (optional)']].map(([name,label]) => <label key={name} className="block">{label}<input name={name} required={!['ward','landmark'].includes(name!)} maxLength={name === 'street' ? 250 : 120} className="mt-1 w-full rounded-lg border p-3" /></label>)}<fieldset className="rounded-lg bg-slate-50 p-4"><legend className="font-bold">Payment</legend>Cash on delivery. No online payment is charged.</fieldset><p className="text-xl font-bold">Total: {money(subtotal + (subtotal >= 5000 ? 0 : 200))}</p><p className="text-sm text-slate-600">Prices and available stock are checked when you place your order.</p><button disabled={busy} className="w-full rounded-xl bg-primary p-4 text-white disabled:opacity-50">{busy ? 'Placing order…' : 'Place order'}</button></form>}</div>;
}

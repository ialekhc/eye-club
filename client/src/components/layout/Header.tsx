'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { commerceRequest, CartItem } from '@/lib/commerce-api';
export function Header() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = () => { if (status === 'authenticated') commerceRequest<CartItem[]>('/cart').then(items => { if(active) setCount(items.reduce((total,item) => total + item.quantity,0)); }).catch(() => {}); };
    refresh(); window.addEventListener('cart-updated',refresh);
    return () => { active = false; window.removeEventListener('cart-updated',refresh); };
  }, [status]);
  const retail = session?.user.role && session.user.role !== 'CUSTOMER';
  return <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur"><div className="container mx-auto flex min-h-20 flex-wrap items-center justify-between gap-4 px-4 py-3"><Link href="/" className="text-2xl font-bold text-primary">Eye-Club.</Link><button className="rounded border px-3 py-2 lg:hidden" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(v => !v)}>Menu</button><nav id="main-navigation" aria-label="Main navigation" className={`${open ? 'flex' : 'hidden'} order-3 w-full flex-wrap gap-5 lg:order-none lg:flex lg:w-auto`}><Link href="/eyeglasses">Eyeglasses</Link><Link href="/sunglasses">Sunglasses</Link><Link href="/try-on">Virtual try-on</Link><Link href="/workstation" className="font-semibold text-teal-700">Workstation</Link><Link href="/pos" className="font-semibold text-indigo-600">POS</Link>{['SUPER_ADMIN','ADMIN'].includes(session?.user.role ?? '') || retail ? <Link href="/admin">Admin</Link> : null}</nav><div className="flex gap-4 text-sm"><Link href="/wishlist">Wishlist</Link><Link href={session ? '/account' : '/login'}>{session ? 'Account' : 'Sign in'}</Link><Link href="/cart">Cart ({status === 'authenticated' ? count : 0})</Link></div><form action="/eyeglasses" role="search" className="order-4 flex w-full gap-2"><label className="sr-only" htmlFor="catalog-search">Search frames</label><input id="catalog-search" name="search" placeholder="Search frames or brands" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm" /><button className="rounded-lg bg-primary px-4 py-2 text-sm text-white">Search</button></form></div></header>;
}

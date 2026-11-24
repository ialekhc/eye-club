'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { commerceRequest, CartItem } from '@/lib/commerce-api';

export function Header() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (status === 'authenticated') {
        commerceRequest<CartItem[]>('/cart')
          .then((items) => {
            if (active) setCount(items.reduce((total, item) => total + item.quantity, 0));
          })
          .catch(() => {});
      }
    };
    refresh();
    window.addEventListener('cart-updated', refresh);
    return () => {
      active = false;
      window.removeEventListener('cart-updated', refresh);
    };
  }, [status]);

  const role = session?.user.role ?? '';
  const isStaff = Boolean(role && role !== 'CUSTOMER');
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(role);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-expanded={open}
            aria-controls="main-navigation"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="text-xl font-extrabold tracking-tight text-primary">
            Eye-Club<span className="text-accent">.</span>
          </Link>

          <nav
            id="main-navigation"
            aria-label="Main navigation"
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex"
          >
            <Link href="/eyeglasses" className="hover:text-primary transition-colors">
              Eyeglasses
            </Link>
            <Link href="/sunglasses" className="hover:text-primary transition-colors">
              Sunglasses
            </Link>
            <Link href="/try-on" className="font-semibold text-teal-700 hover:text-teal-800">
              Virtual Try-On
            </Link>
            <Link href="/stores" className="hover:text-primary transition-colors">
              Stores
            </Link>
            {isStaff && (
              <>
                <Link href="/workstation" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Workstation
                </Link>
                <Link href="/pos" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  POS
                </Link>
              </>
            )}
            {isAdmin && (
              <Link href="/admin" className="font-semibold text-slate-900 hover:text-primary">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-primary"
            aria-label="Search frames"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Cart</span>
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">
              {status === 'authenticated' ? count : 0}
            </span>
          </Link>

          <Link
            href={session ? '/account' : '/login'}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-semibold text-white hover:opacity-90"
          >
            <User className="h-4 w-4" />
            <span>{session ? 'Account' : 'Sign In'}</span>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <form action="/eyeglasses" role="search" className="container mx-auto flex max-w-xl gap-2">
            <label className="sr-only" htmlFor="catalog-search">
              Search frames
            </label>
            <input
              id="catalog-search"
              name="search"
              autoFocus
              placeholder="Search by frame name, shape, or brand..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            />
            <button className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white">
              Search
            </button>
          </form>
        </div>
      )}

      {open && (
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-4 text-sm font-medium lg:hidden"
        >
          <Link href="/eyeglasses" onClick={() => setOpen(false)}>
            Eyeglasses
          </Link>
          <Link href="/sunglasses" onClick={() => setOpen(false)}>
            Sunglasses
          </Link>
          <Link href="/try-on" onClick={() => setOpen(false)} className="font-semibold text-teal-700">
            Virtual Try-On
          </Link>
          <Link href="/stores" onClick={() => setOpen(false)}>
            Stores
          </Link>
          <Link href="/wishlist" onClick={() => setOpen(false)}>
            Saved Frames
          </Link>
          {isStaff && (
            <>
              <Link href="/workstation" onClick={() => setOpen(false)} className="font-semibold text-indigo-600">
                Staff Workstation
              </Link>
              <Link href="/pos" onClick={() => setOpen(false)} className="font-semibold text-indigo-600">
                Optical POS
              </Link>
            </>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="font-semibold text-slate-900">
              Admin Portal
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

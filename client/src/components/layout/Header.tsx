'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Eye, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Badge, Button, Input } from '@eyewear/ui';
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
    <header className="sticky top-0 z-50 border-b border-[#EAECF0] bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="main-navigation"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#101828]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white shadow-xs">
              <Eye className="h-4 w-4" />
            </span>
            <span>Eye-Club</span>
          </Link>

          <nav
            id="main-navigation"
            aria-label="Main navigation"
            className="hidden items-center gap-1 text-sm font-medium text-[#475467] lg:flex"
          >
            <Link href="/eyeglasses" className="rounded-lg px-3 py-2 hover:bg-[#F9FAFB] hover:text-[#101828] transition-colors">
              Eyeglasses
            </Link>
            <Link href="/sunglasses" className="rounded-lg px-3 py-2 hover:bg-[#F9FAFB] hover:text-[#101828] transition-colors">
              Sunglasses
            </Link>
            <Link href="/try-on" className="rounded-lg px-3 py-2 font-semibold text-teal-700 hover:bg-teal-50 transition-colors">
              Virtual Try-On
            </Link>
            <Link href="/stores" className="rounded-lg px-3 py-2 hover:bg-[#F9FAFB] hover:text-[#101828] transition-colors">
              Stores
            </Link>
            {isStaff && (
              <>
                <Link href="/workstation" className="rounded-lg px-3 py-2 font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors">
                  Workstation
                </Link>
                <Link href="/pos" className="rounded-lg px-3 py-2 font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors">
                  POS
                </Link>
              </>
            )}
            {isAdmin && (
              <Link href="/admin" className="rounded-lg px-3 py-2 font-semibold text-[#101828] hover:bg-[#F2F4F7] transition-colors">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2.5 text-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search frames"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Link
            href="/cart"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] shadow-xs hover:bg-[#F9FAFB] transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-[#475467]" />
            <span>Cart</span>
            <Badge variant="default" className="px-1.5 py-0 text-[11px]">
              {status === 'authenticated' ? count : 0}
            </Badge>
          </Link>

          <Link
            href={session ? '/account' : '/login'}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors"
          >
            <User className="h-4 w-4" />
            <span>{session ? 'Account' : 'Sign In'}</span>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#EAECF0] bg-[#F9FAFB] px-4 py-3">
          <form action="/eyeglasses" role="search" className="container mx-auto flex max-w-xl gap-2">
            <label className="sr-only" htmlFor="catalog-search">
              Search frames
            </label>
            <Input
              id="catalog-search"
              name="search"
              autoFocus
              placeholder="Search by frame name, shape, or brand..."
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>
      )}

      {open && (
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col gap-1 border-t border-[#EAECF0] bg-white px-4 py-3 text-sm font-medium text-[#344054] lg:hidden"
        >
          <Link href="/eyeglasses" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-[#F9FAFB]">
            Eyeglasses
          </Link>
          <Link href="/sunglasses" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-[#F9FAFB]">
            Sunglasses
          </Link>
          <Link href="/try-on" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-teal-700 hover:bg-teal-50">
            Virtual Try-On
          </Link>
          <Link href="/stores" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-[#F9FAFB]">
            Stores
          </Link>
          <Link href="/wishlist" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-[#F9FAFB]">
            Saved Frames
          </Link>
          {isStaff && (
            <>
              <Link href="/workstation" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">
                Staff Workstation
              </Link>
              <Link href="/pos" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">
                Optical POS
              </Link>
            </>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-[#101828] hover:bg-[#F2F4F7]">
              Admin Portal
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

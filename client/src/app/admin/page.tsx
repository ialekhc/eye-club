'use client';
import Link from 'next/link';
import { Box, Building2, MonitorSmartphone, ShoppingCart } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import { money } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';

type Stats = {
  metrics: { totalOrders: number; totalProducts: number; totalUsers: number; revenue: number };
  recentOrders: Array<{ id: string; orderNumber: string; status: string; totalAmount: string }>;
};

export default function AdminPage() {
  const { data, error, loading, reload } = useResource<Stats>('/admin/dashboard');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Store Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Simple shortcuts to manage frames, photos, orders, and in-store sales.
        </p>
      </div>

      {/* Simple Quick-Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/catalog"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-500 hover:shadow-sm transition-all"
        >
          <Box className="w-6 h-6 text-teal-700 mb-3" />
          <h2 className="font-bold text-slate-900">Frames &amp; Photos</h2>
          <p className="text-xs text-slate-500 mt-1">Add new frames, upload photos, and set stock.</p>
        </Link>

        <Link
          href="/pos"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-500 hover:shadow-sm transition-all"
        >
          <MonitorSmartphone className="w-6 h-6 text-indigo-600 mb-3" />
          <h2 className="font-bold text-slate-900">Open POS Counter</h2>
          <p className="text-xs text-slate-500 mt-1">Create in-store sales and print receipts.</p>
        </Link>

        <Link
          href="/workstation"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-500 hover:shadow-sm transition-all"
        >
          <ShoppingCart className="w-6 h-6 text-emerald-600 mb-3" />
          <h2 className="font-bold text-slate-900">Patient Workstation</h2>
          <p className="text-xs text-slate-500 mt-1">Guide a patient from try-on to checkout.</p>
        </Link>

        <Link
          href="/admin/vendors"
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-sm transition-all"
        >
          <Building2 className="w-6 h-6 text-slate-700 mb-3" />
          <h2 className="font-bold text-slate-900">Vendors &amp; Stores</h2>
          <p className="text-xs text-slate-500 mt-1">Manage optical branches and staff accounts.</p>
        </Link>
      </div>

      {error ? <RemoteError message={error} retry={reload} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading store summary…</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Total Orders', data.metrics.totalOrders],
              ['Total Frames', data.metrics.totalProducts],
              ['Users & Staff', data.metrics.totalUsers],
              ['Collected Revenue', money(data.metrics.revenue)],
            ].map(([label, value]) => (
              <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-semibold text-teal-700 underline">
                View all orders
              </Link>
            </div>
            {data.recentOrders.length ? (
              <div className="divide-y divide-slate-100">
                {data.recentOrders.map((order) => (
                  <p className="py-3 text-sm flex justify-between" key={order.id}>
                    <span className="font-mono font-semibold text-slate-800">{order.orderNumber}</span>
                    <span className="text-slate-500">{order.status}</span>
                    <span className="font-bold text-slate-900">{money(order.totalAmount)}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No orders yet.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useResource } from '@/lib/use-resource';
import { money } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
type Stats = { metrics: { totalOrders: number; totalProducts: number; totalUsers: number; revenue: number }; recentOrders: Array<{ id: string; orderNumber: string; status: string; totalAmount: string }> };
export default function AdminPage() {
  const { data, error, loading, reload } = useResource<Stats>('/admin/dashboard');
  return <div><h1 className="mb-8 text-3xl font-bold">Retail overview</h1>{error ? <RemoteError message={error} retry={reload} /> : null}{loading ? <p>Loading metrics…</p> : null}{data ? <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Orders',data.metrics.totalOrders],['Products',data.metrics.totalProducts],['Customers and staff',data.metrics.totalUsers],['Collected revenue',money(data.metrics.revenue)]].map(([label,value]) => <article key={label} className="rounded-xl border bg-white p-6"><p>{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></article>)}</div><h2 className="mb-4 mt-10 text-xl font-bold">Recent orders</h2>{data.recentOrders.length ? data.recentOrders.map(order => <p className="my-3 rounded-lg border bg-white p-4" key={order.id}>{order.orderNumber} · {order.status} · {money(order.totalAmount)}</p>) : <p>No orders yet.</p>}</> : null}<div className="mt-8 flex flex-wrap gap-6"><Link href="/admin/catalog" className="underline">Manage catalogue</Link><Link href="/admin/orders" className="underline">Manage orders</Link><Link href="/admin/vendors" className="underline">Manage vendors</Link><Link href="/pos" className="font-semibold text-indigo-600 underline">Optical POS</Link></div></div>;
}

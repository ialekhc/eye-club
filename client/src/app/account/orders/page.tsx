'use client';
import { useResource } from '@/lib/use-resource';
import { money, Order } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
export default function OrdersPage() {
  const { data, error, loading, reload } = useResource<Order[]>('/orders');
  return <section className="rounded-xl border bg-white p-6"><h2 className="mb-6 text-2xl font-bold">My orders</h2>{error ? <RemoteError message={error} retry={reload} /> : null}{loading ? <p>Loading orders…</p> : null}{data?.length === 0 ? <p>No orders yet.</p> : null}<div className="space-y-4">{data?.map(order => <article key={order.id} className="rounded-xl border p-5"><h3 className="text-lg font-bold">{order.orderNumber}</h3><p>{new Date(order.createdAt).toLocaleDateString()} · {order.status.replaceAll('_',' ')}</p><p className="my-3 font-bold">{money(order.totalAmount)} · {order.paymentStatus.replaceAll('_',' ')}</p>{order.items.map(item => <p key={item.id}>{item.productName} × {item.quantity} — {money(item.totalPrice)}</p>)}<details className="mt-4"><summary className="cursor-pointer">Order history</summary>{order.statusHistory.map(entry => <p key={entry.id} className="mt-2">{new Date(entry.createdAt).toLocaleString()} — {entry.status.replaceAll('_',' ')}{entry.note ? `: ${entry.note}` : ''}</p>)}</details></article>)}</div></section>;
}

'use client';
import { useState } from 'react';
import { useResource } from '@/lib/use-resource';
import { commerceRequest, jsonBody, money, Order } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
const statuses = ['ORDER_PLACED','PRESCRIPTION_PENDING','PRESCRIPTION_VERIFICATION','PRESCRIPTION_CONFIRMED','LENS_PROCESSING','QUALITY_CHECK','READY_TO_SHIP','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];
export default function AdminOrdersPage() {
  const { data, error, loading, reload } = useResource<Order[]>('/admin/orders'); const [filter,setFilter] = useState(''); const [failure,setFailure] = useState(''); const [busy,setBusy] = useState(false);
  async function change(id: string,status: string) {setBusy(true);setFailure('');try {await commerceRequest(`/admin/orders/${id}/status`,{method:'PUT',body:jsonBody({status})});reload();}catch(e){setFailure((e as Error).message);}finally{setBusy(false);}}
  return <div><h1 className="mb-6 text-3xl font-bold">Orders</h1><label>Filter by status<select value={filter} onChange={e=>setFilter(e.target.value)} className="ml-3 rounded border p-2"><option value="">All</option>{statuses.map(status=><option key={status}>{status}</option>)}</select></label>{error || failure ? <RemoteError message={error || failure} retry={reload} /> : null}{loading ? <p>Loading orders…</p> : null}{data?.filter(order=>!filter || order.status === filter).map(order=><article key={order.id} className="my-4 rounded-xl border bg-white p-6"><h2 className="text-lg font-bold">{order.orderNumber}</h2><p>{money(order.totalAmount)} · {order.paymentStatus}</p>{order.items.map(item=><p key={item.id}>{item.productName} × {item.quantity}</p>)}<label className="mt-4 block">Order status<select aria-label={`Status for ${order.orderNumber}`} disabled={busy} value={order.status} onChange={e=>change(order.id,e.target.value)} className="ml-3 rounded border p-2">{Array.from(new Set([order.status,...statuses])).map(status=><option key={status}>{status}</option>)}</select></label></article>)}{data?.length === 0 ? <p>No orders yet.</p> : null}</div>;
}

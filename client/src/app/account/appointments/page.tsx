'use client';
import { useState } from 'react';
import { useResource } from '@/lib/use-resource';
import { commerceRequest } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
type Appointment = { id: string; dateTime: string; status: string; store: { name: string } };
export default function AppointmentsPage() {
  const { data, loading, error, reload } = useResource<Appointment[]>('/appointments/me'); const [actionError,setActionError] = useState('');
  async function cancel(id: string) { try { await commerceRequest(`/appointments/${id}/cancel`,{method:'PUT'}); reload(); } catch(e) {setActionError((e as Error).message);} }
  return <section className="rounded-xl border bg-white p-6"><h2 className="mb-6 text-2xl font-bold">My appointments</h2>{error || actionError ? <RemoteError message={error || actionError} retry={reload} /> : null}{loading ? <p>Loading appointments…</p> : null}{data?.length === 0 ? <p>No appointments yet.</p> : null}{data?.map(item => <article className="my-4 rounded-xl border p-4" key={item.id}><h3 className="font-bold">{item.store.name}</h3><p>{new Date(item.dateTime).toLocaleString('en-NP',{timeZone:'Asia/Kathmandu'})} (Nepal time)</p><p>{item.status}</p>{item.status === 'SCHEDULED' ? <button className="mt-3 underline" onClick={() => cancel(item.id)}>Cancel appointment</button> : null}</article>)}</section>;
}

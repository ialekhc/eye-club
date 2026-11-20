'use client';
import { FormEvent, useState } from 'react';
import { useResource } from '@/lib/use-resource';
import { commerceRequest, jsonBody } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
type Profile = { firstName: string; lastName: string; phone?: string; email: string };
export default function ProfilePage() {
  const { data, error, loading, reload } = useResource<Profile>('/users/profile');
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setSaveError(''); setNotice(''); try { await commerceRequest('/users/profile', { method: 'PUT', body: jsonBody(values) }); setNotice('Profile saved.'); reload(); } catch(e) { setSaveError((e as Error).message); } finally { setBusy(false); } }
  return <section className="rounded-xl border bg-white p-6"><h2 className="mb-6 text-2xl font-bold">Profile</h2>{error || saveError ? <RemoteError message={error || saveError} retry={reload} /> : null}{loading ? <p>Loading profile…</p> : null}{data ? <form key={JSON.stringify(data)} onSubmit={save} className="space-y-4"><p>{data.email}</p>{[['firstName','First name'],['lastName','Last name'],['phone','Phone']].map(([key,label]) => <label key={key} className="block">{label}<input name={key} defaultValue={data[key as keyof Profile] ?? ''} required={key !== 'phone'} maxLength={80} className="mt-1 w-full rounded-lg border p-3" /></label>)}<button disabled={busy} className="rounded-lg bg-primary p-3 text-white">{busy ? 'Saving…' : 'Save changes'}</button>{notice ? <p role="status">{notice}</p> : null}</form> : null}</section>;
}

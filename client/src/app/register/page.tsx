'use client';
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { commerceRequest, jsonBody } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';
export default function RegisterPage() {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setError(''); try { await commerceRequest('/auth/register', { method: 'POST', body: jsonBody(values) }); const result = await signIn('credentials', { email: values.email, password: values.password, redirect: false }); if (result?.error) throw new Error('Account created. Please sign in.'); router.push('/account'); router.refresh(); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } }
  return <div className="mx-auto max-w-md px-4 py-12"><h1 className="mb-6 text-3xl font-bold">Create an account</h1>{error ? <RemoteError message={error} /> : null}<form onSubmit={submit} className="space-y-4">{[['firstName','First name','text'],['lastName','Last name','text'],['email','Email','email'],['password','Password (at least 12 characters)','password']].map(([name,label,type]) => <label key={name} className="block">{label}<input name={name} type={type} required minLength={name === 'password' ? 12 : 1} maxLength={128} autoComplete={name === 'password' ? 'new-password' : name === 'email' ? 'email' : name === 'firstName' ? 'given-name' : 'family-name'} className="mt-1 w-full rounded-lg border p-3" /></label>)}<button disabled={busy} className="w-full rounded-xl bg-primary p-3 text-white">{busy ? 'Creating account…' : 'Create account'}</button></form><Link href="/login" className="mt-4 block underline">Already have an account? Sign in</Link></div>;
}

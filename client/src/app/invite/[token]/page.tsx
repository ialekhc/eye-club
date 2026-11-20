'use client';
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { commerceRequest,jsonBody } from '@/lib/commerce-api';
export default function InvitationPage({params}:{params:Promise<{token:string}>}){
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget));setBusy(true);try{const {token}=await params;await commerceRequest(`/auth/invitations/${encodeURIComponent(token)}/accept`,{method:'POST',body:jsonBody(values)});const result=await signIn('credentials',{...values,redirect:false});setMessage(result?.error?'Invitation accepted. Sign in to continue.':'Invitation accepted. Your retail access is active.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <main className="mx-auto max-w-md p-8"><h1 className="mb-4 text-3xl font-bold">Join your optical team</h1><p>Enter the invited email. Existing customers should use their account password; new staff should choose a password of at least 12 characters.</p><form onSubmit={submit} className="my-6 space-y-4"><label className="block">Email<input name="email" type="email" required className="mt-1 w-full rounded border p-3"/></label><label className="block">Password<input name="password" type="password" required minLength={12} className="mt-1 w-full rounded border p-3"/></label><button disabled={busy} className="rounded bg-primary p-3 text-white">{busy?'Accepting…':'Accept invitation'}</button></form>{message?<p role="status">{message}</p>:null}<Link href="/pos" className="mt-4 block underline">Open retail terminal</Link></main>;
}

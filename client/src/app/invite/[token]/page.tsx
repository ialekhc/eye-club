"use client";

import { FormEvent, useState } from "react";
import { acceptInvitation } from "@/lib/api-client";
import { ApiClientError, login } from "@/lib/api-client";

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const { token } = await params; await login(email, password); const result = await acceptInvitation(token); setMessage(`Invitation accepted. You now have ${result.role.toLowerCase().replaceAll("_", " ")} access.`); }
    catch (error) { setMessage(error instanceof ApiClientError ? error.message : "The invitation could not be accepted."); }
    finally { setBusy(false); }
  };
  return <main className="dashboard-shell"><section className="dashboard-panel invite-panel"><p className="eyebrow">Organization invitation</p><h1>Join your optical team</h1><p className="page-description">Sign in with the email address that received this invitation.</p><form className="dashboard-form" onSubmit={submit}><label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button type="submit" disabled={busy}>{busy ? "Accepting…" : "Sign in and accept"}</button></form>{message && <p className="dashboard-alert" role="status">{message}</p>}</section></main>;
}

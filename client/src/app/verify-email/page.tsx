"use client";

import { FormEvent, useState } from "react";
import { ApiClientError, confirmEmailVerification, requestEmailVerification } from "@/lib/api-client";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState(""); const [token, setToken] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const request = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); try { const result = await requestEmailVerification(email); setToken(result.token ?? ""); setMessage("If that account needs verification, a verification token has been created."); } catch (error) { setMessage(error instanceof ApiClientError ? error.message : "Verification request failed."); } finally { setBusy(false); } };
  const confirm = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); try { await confirmEmailVerification(token); setMessage("Email verified successfully."); } catch (error) { setMessage(error instanceof ApiClientError ? error.message : "Email verification failed."); } finally { setBusy(false); } };
  return <main className="dashboard-shell"><section className="dashboard-panel invite-panel"><p className="eyebrow">Account security</p><h1>Verify email</h1><p className="page-description">Request a verification token, then confirm it here.</p><form className="dashboard-form" onSubmit={request}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><button type="submit" disabled={busy}>Request verification</button></form><form className="dashboard-form" onSubmit={confirm}><label>Verification token<input required minLength={32} value={token} onChange={(event) => setToken(event.target.value)} /></label><button type="submit" disabled={busy}>Verify email</button></form>{message && <p className="dashboard-alert" role="status">{message}</p>}</section></main>;
}

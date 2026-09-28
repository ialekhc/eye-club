"use client";

import { FormEvent, useState } from "react";
import { ApiClientError, confirmPasswordReset, requestPasswordReset } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState(""); const [token, setToken] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const request = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); try { const result = await requestPasswordReset(email); setToken(result.token ?? ""); setMessage("If that account exists, reset instructions have been created."); } catch (error) { setMessage(error instanceof ApiClientError ? error.message : "Reset request failed."); } finally { setBusy(false); } };
  const confirm = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); try { await confirmPasswordReset(token, password); setMessage("Password reset complete. You can sign in now."); } catch (error) { setMessage(error instanceof ApiClientError ? error.message : "Password reset failed."); } finally { setBusy(false); } };
  return <main className="dashboard-shell"><section className="dashboard-panel invite-panel"><p className="eyebrow">Account security</p><h1>Reset password</h1><p className="page-description">Request a reset token, then choose a new password.</p><form className="dashboard-form" onSubmit={request}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><button type="submit" disabled={busy}>Request reset</button></form><form className="dashboard-form" onSubmit={confirm}><label>Reset token<input required minLength={32} value={token} onChange={(event) => setToken(event.target.value)} /></label><label>New password<input type="password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} /></label><button type="submit" disabled={busy}>Set new password</button></form>{message && <p className="dashboard-alert" role="status">{message}</p>}</section></main>;
}

"use client";

import { FormEvent, useState } from "react";
import { ApiClientError, createProduct, duplicateProduct, listProducts, login, type ProductInput, type ProductPage, updateProduct } from "@/lib/api-client";

export default function ProductsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [catalogue, setCatalogue] = useState<ProductPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<ProductInput>({ name: "", sku: "", type: "EYEGLASSES", productUrl: "" });

  const load = async (requestedPage = page) => {
    if (!organizationId.trim()) { setMessage("Enter an organization ID to load its catalogue."); return; }
    setBusy(true); setMessage("");
    try { setCatalogue(await listProducts(organizationId.trim(), { search: search.trim() || undefined, page: requestedPage })); }
    catch (error) { setMessage(error instanceof ApiClientError ? error.message : "The catalogue could not be loaded."); }
    finally { setBusy(false); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await login(email, password); setPage(1); await load(1); }
    catch (error) { setMessage(error instanceof ApiClientError ? error.message : "Sign-in failed."); setBusy(false); }
  };

  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await createProduct(organizationId.trim(), draft); setShowCreate(false); setDraft({ name: "", sku: "", type: "EYEGLASSES", productUrl: "" }); setPage(1); await load(1); }
    catch (error) { setMessage(error instanceof ApiClientError ? error.message : "The product could not be created."); setBusy(false); }
  };
  const duplicate = async (id: string) => { setBusy(true); setMessage(""); try { await duplicateProduct(organizationId.trim(), id); await load(page); } catch (error) { setMessage(error instanceof ApiClientError ? error.message : "The product could not be duplicated."); setBusy(false); } };
  const toggle = async (id: string, status: "ACTIVE" | "INACTIVE") => { setBusy(true); setMessage(""); try { await updateProduct(organizationId.trim(), id, { status }); await load(page); } catch (error) { setMessage(error instanceof ApiClientError ? error.message : "The product status could not be updated."); setBusy(false); } };

  return <main className="dashboard-shell">
    <header className="dashboard-header"><div><p className="eyebrow">Merchant workspace</p><h1>Product catalogue</h1><p className="page-description">Manage the frames available to your virtual fitting experience.</p></div><a className="dashboard-link" href="/try-on">Open try-on studio</a></header>
    <section className="dashboard-panel">
      <form className="dashboard-form" onSubmit={submit} aria-label="Sign in to catalogue">
        <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="owner@example.com" /></label>
        <label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
        <label>Organization ID<input required value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} placeholder="org_…" /></label>
        <button type="submit" disabled={busy}>{busy ? "Loading…" : "Sign in and load"}</button>
      </form>
      {message && <p className="dashboard-alert" role="alert">{message}</p>}
    </section>
    {catalogue && <section className="dashboard-panel" aria-live="polite"><div className="dashboard-panel-heading"><h2>Frames</h2><div className="dashboard-panel-actions"><span>{catalogue.total} total</span><button type="button" onClick={() => setShowCreate((value) => !value)}>Add product</button></div></div><form className="catalogue-search" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(); }}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or SKU" aria-label="Search products" /><button type="submit" disabled={busy}>Search</button></form>
      {showCreate && <form className="product-create-form" onSubmit={create}><label>Name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>SKU<input required value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} /></label><label>Type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as ProductInput["type"] })}><option value="EYEGLASSES">Eyeglasses</option><option value="SUNGLASSES">Sunglasses</option></select></label><label>Product URL<input type="url" value={draft.productUrl} onChange={(event) => setDraft({ ...draft, productUrl: event.target.value })} placeholder="https://…" /></label><button type="submit" disabled={busy}>Create</button></form>}
      {catalogue.items.length === 0 ? <p className="dashboard-empty">No products have been added to this organization yet.</p> : <div className="product-table-wrap"><table className="product-table"><thead><tr><th>Name</th><th>SKU</th><th>Type</th><th>Status</th><th>Calibration</th><th>Actions</th></tr></thead><tbody>{catalogue.items.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.sku}</td><td>{product.type.toLowerCase()}</td><td><span className={`status-pill ${product.status.toLowerCase()}`}>{product.status.toLowerCase()}</span></td><td>{product.calibrated ? "Ready" : "Needs calibration"}</td><td><div className="table-actions"><button type="button" disabled={busy} onClick={() => void duplicate(product.id)}>Duplicate</button>{product.status === "ACTIVE" ? <button type="button" disabled={busy} onClick={() => void toggle(product.id, "INACTIVE")}>Deactivate</button> : <button type="button" disabled={busy || !product.calibrated} onClick={() => void toggle(product.id, "ACTIVE")}>Publish</button>}</div></td></tr>)}</tbody></table></div>}
      {catalogue.total > catalogue.pageSize && <div className="pagination-controls"><button type="button" disabled={busy || page <= 1} onClick={() => { const nextPage = page - 1; setPage(nextPage); void load(nextPage); }}>Previous</button><span>Page {catalogue.page} of {Math.ceil(catalogue.total / catalogue.pageSize)}</span><button type="button" disabled={busy || page >= Math.ceil(catalogue.total / catalogue.pageSize)} onClick={() => { const nextPage = page + 1; setPage(nextPage); void load(nextPage); }}>Next</button></div>}
    </section>}
  </main>;
}

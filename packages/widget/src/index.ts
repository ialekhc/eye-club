type WidgetButton = HTMLElement & { dataset: DOMStringMap & { product?: string; organization?: string } };

const script = document.currentScript as HTMLScriptElement | null;
const configuredOrigin = script?.dataset.origin ?? "http://localhost:3000";
const publicKey = script?.dataset.publicKey;
const modalId = "virtual-eyewear-widget-modal";

function closeModal() { document.getElementById(modalId)?.remove(); document.body.style.overflow = ""; }

function openModal(button: WidgetButton) {
  closeModal();
  const product = button.dataset.product;
  if (!product) return;
  const organization = button.dataset.organization;
  const params = new URLSearchParams({ product });
  if (organization) params.set("organization", organization);
  if (publicKey) { params.set("widget", publicKey); params.set("parentOrigin",window.location.origin); }
  const backdrop = document.createElement("div"); backdrop.id = modalId; backdrop.setAttribute("role", "dialog"); backdrop.setAttribute("aria-modal", "true"); backdrop.setAttribute("aria-label", "Virtual try-on");
  Object.assign(backdrop.style, { position: "fixed", inset: "0", zIndex: "2147483647", display: "grid", placeItems: "center", padding: "16px", background: "rgb(20 35 19 / 0.62)" });
  const panel = document.createElement("div"); Object.assign(panel.style, { position: "relative", width: "min(100%, 980px)", height: "min(92vh, 760px)", background: "#fafaf7", borderRadius: "14px", overflow: "hidden", boxShadow: "0 24px 80px rgb(0 0 0 / 0.25)" });
  const close = document.createElement("button"); close.type = "button"; close.textContent = "Close"; close.setAttribute("aria-label", "Close virtual try-on"); Object.assign(close.style, { position: "absolute", right: "12px", top: "12px", zIndex: "1", padding: "8px 12px", border: "1px solid #c8d0c2", borderRadius: "6px", background: "white", color: "#294c37", cursor: "pointer" }); close.addEventListener("click", closeModal);
  const frame = document.createElement("iframe"); frame.title = "Virtual eyewear try-on"; frame.src = `${configuredOrigin.replace(/\/$/, "")}/try-on?${params}`; frame.setAttribute("allow", "camera"); Object.assign(frame.style, { width: "100%", height: "100%", border: "0" });
  panel.append(close, frame); backdrop.append(panel); backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeModal(); }); document.body.append(backdrop); document.body.style.overflow = "hidden"; close.focus();
}

function boot() { document.querySelectorAll<WidgetButton>("[data-virtual-tryon]").forEach((button) => button.addEventListener("click", () => openModal(button))); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();

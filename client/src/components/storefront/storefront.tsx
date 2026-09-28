"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Eye, Heart, ShoppingBag, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getPublicCatalogue, type PublicCatalogueProduct } from "@/lib/api-client";

type StoreProduct = {
  id: string;
  name: string;
  brand: string;
  category: "Optical" | "Sun";
  price: number;
  color: string;
  shape: string;
  image: string;
  badge?: string;
};

const products: StoreProduct[] = [
  { id: "atelier-01", name: "The Everyday", brand: "Atelier North", category: "Optical", price: 168, color: "Ink", shape: "Soft square", image: "/frames/atelier-01.png", badge: "Bestseller" },
  { id: "atelier-02", name: "The Weekender", brand: "Atelier North", category: "Sun", price: 192, color: "Warm bronze", shape: "Round", image: "/frames/atelier-02.png", badge: "New" },
  { id: "lumen-01", name: "Arc 01", brand: "Lumen Objects", category: "Optical", price: 224, color: "Brushed gold", shape: "Panto", image: "/frames/atelier-01.png" },
  { id: "lumen-02", name: "Arc 02", brand: "Lumen Objects", category: "Sun", price: 238, color: "Tortoise", shape: "Cat eye", image: "/frames/atelier-02.png" },
  { id: "northline-01", name: "Transit", brand: "Northline", category: "Optical", price: 156, color: "Clear olive", shape: "Rectangle", image: "/frames/atelier-01.png" },
  { id: "northline-02", name: "Daybreak", brand: "Northline", category: "Sun", price: 176, color: "Smoke", shape: "Aviator", image: "/frames/atelier-02.png" },
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
function categoryLabel(category: "All" | StoreProduct["category"]) {
  switch (category) {
    case "All": return "All frames";
    case "Optical": return "Optical";
    default: return "Sunglasses";
  }
}

function productFromApi(product: PublicCatalogueProduct): StoreProduct | null {
  if (!product.asset) return null;
  return { id: product.id, name: product.name, brand: product.brand?.name ?? "Independent brand", category: product.type === "SUNGLASSES" ? "Sun" : "Optical", price: Number(product.price ?? 0), color: product.frameColor ?? "Original asset", shape: product.category?.name ?? product.frameShape ?? "Frame", image: product.asset.url };
}

export function Storefront() {
  const [category, setCategory] = useState<"All" | StoreProduct["category"]>("All");
  const [brand, setBrand] = useState("All brands");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bag, setBag] = useState<StoreProduct[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [catalogue, setCatalogue] = useState<StoreProduct[]>(products);
  const [catalogueSource, setCatalogueSource] = useState<"demo" | "merchant">("demo");
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const brands = ["All brands", ...Array.from(new Set(catalogue.map((product) => product.brand)))];
  const visibleProducts = useMemo(() => catalogue.filter((product) => (category === "All" || product.category === category) && (brand === "All brands" || product.brand === brand)), [brand, category, catalogue]);

  useEffect(() => {
    const organization = new URLSearchParams(window.location.search).get("organization");
    if (!organization) return;
    let active = true;
    void getPublicCatalogue(organization).then((items) => {
      if (!active) return;
      const remote = items.map(productFromApi).filter((product): product is StoreProduct => !!product);
      if (remote.length) { setCatalogue(remote); setCatalogueSource("merchant"); }
    }).catch(() => undefined).finally(() => { if (active) setCatalogueLoading(false); });
    return () => { active = false; };
  }, []);

  const addToBag = (product: StoreProduct) => {
    setBag((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setNotice(`${product.name} added to your bag.`);
    setBagOpen(true);
  };

  return <>
    <a href="#collection" className="skip-link">Skip to collection</a>
    <header className="shop-header">
      <Link href="/" aria-label="Eye Club home" className="wordmark"><Eye size={27} strokeWidth={1.6} /><span>eye club<span className="wordmark-dot">.</span></span></Link>
      <nav className="shop-nav" aria-label="Main navigation"><a href="#collection">Shop frames</a><a href="#brands">Brands</a><Link href="/try-on">Virtual try-on</Link></nav>
      <button className="bag-button" type="button" onClick={() => setBagOpen(true)} aria-label={`Open bag, ${bag.length} items`}><ShoppingBag size={18} /><span>Bag</span><b>{bag.length}</b></button>
    </header>

    <main className="shop-shell">
      <section className="shop-hero">
        <div className="hero-copy"><p className="eyebrow"><Sparkles size={13} /> Independent frames, carefully chosen</p><h1>Good frames<br /><em>look better</em> on you.</h1><p className="hero-description">Discover considered eyewear from independent brands, then see your shortlist in your own light with our private virtual fitting room.</p><div className="hero-actions"><a className="primary-shop-button" href="#collection">Shop the collection <ArrowRight size={16} /></a><Link className="text-action" href="/try-on">Try on a frame <SlidersHorizontal size={15} /></Link></div></div>
        <div className="hero-art" aria-label="A selection of eyewear from independent brands"><div className="hero-note hero-note-top">Curated in small numbers</div><Image src="/frames/atelier-01.png" alt="The Everyday frame" width={1000} height={360} priority /><div className="hero-art-caption"><span>01</span><span>Atelier North / The Everyday</span><span>$168</span></div></div>
      </section>

      <section className="shop-trust" aria-label="Shopping benefits"><span><Check size={15} /> Independent brands</span><span><Check size={15} /> Private try-on</span><span><Check size={15} /> Easy returns</span><span><Check size={15} /> Ships worldwide</span></section>

      <section id="collection" className="collection-shop" aria-labelledby="collection-heading"><div className="shop-section-heading"><div><p className="eyebrow">{catalogueSource === "merchant" ? "Merchant collection" : "The collection"}</p><h2 id="collection-heading">Find your next pair.</h2></div><p>{catalogueLoading ? "Loading the latest frames…" : `${catalogue.length} frames, carefully chosen.`}<br />More arrivals every month.</p></div>
        <div className="shop-filters"><div className="filter-tabs" aria-label="Filter by category">{(["All", "Optical", "Sun"] as const).map((item) => <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>)}</div><label className="brand-filter"><span>Brand</span><select value={brand} onChange={(event) => setBrand(event.target.value)} aria-label="Filter by brand">{brands.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        <div className="shop-grid">{visibleProducts.map((product) => <article className="shop-card" key={product.id}><div className="shop-card-image"><Image src={product.image} alt={`${product.brand} ${product.name}`} width={1000} height={360} unoptimized /><span className="product-category">{product.category}</span><button className={`favorite-button ${favorites.includes(product.id) ? "is-favorite" : ""}`} type="button" aria-label={`${favorites.includes(product.id) ? "Remove" : "Add"} ${product.name} ${favorites.includes(product.id) ? "from" : "to"} favorites`} onClick={() => setFavorites((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])}><Heart size={17} fill="currentColor" /></button></div><div className="shop-card-info"><div><p className="product-brand">{product.brand}</p><h3>{product.name}</h3><p className="product-meta">{product.color} · {product.shape}</p></div><strong>{money.format(product.price)}</strong></div>{product.badge && <span className="product-badge">{product.badge}</span>}<div className="card-actions"><Link href={`/try-on?frame=${encodeURIComponent(product.id)}`} className="try-link">Try on <ArrowRight size={14} /></Link><button type="button" className="add-button" onClick={() => addToBag(product)}>Add to bag</button></div></article>)}</div>
      </section>

      <section id="brands" className="brand-story"><div><p className="eyebrow">Why Eye Club</p><h2>A better way to<br /><em>choose eyewear.</em></h2></div><div className="brand-story-copy"><p>We bring together independent eyewear brands that care about shape, material and the details you notice after the first glance.</p><p>Shortlist a pair, try it on privately, and buy from the brand that made it. No account required.</p><Link href="/try-on" className="text-action">Open the fitting room <ArrowRight size={15} /></Link></div></section>
    </main>

    <footer className="shop-footer"><span className="font-medium text-stone-700">eye club.</span><span>Independent eyewear, fitted to you.</span><span><Link href="/dashboard/products">Merchant login</Link></span></footer>
    {notice && <output className="shop-toast">{notice}</output>}
    {bagOpen && <div className="bag-backdrop"><button type="button" className="bag-dismiss" aria-label="Close bag" onClick={() => setBagOpen(false)} /><dialog open className="bag-drawer" aria-labelledby="bag-title"><div className="bag-heading"><div><p className="eyebrow">Your selection</p><h2 id="bag-title">The bag <span>{bag.length}</span></h2></div><button type="button" className="icon-button" aria-label="Close bag" onClick={() => setBagOpen(false)}><X size={19} /></button></div>{bag.length === 0 ? <div className="bag-empty"><ShoppingBag size={30} strokeWidth={1.3} /><p>Your bag is waiting.</p><span>Add a frame when something feels like you.</span></div> : <><div className="bag-items">{bag.map((product) => <div className="bag-item" key={product.id}><Image src={product.image} alt="" width={180} height={65} unoptimized /><div><p>{product.brand}</p><h3>{product.name}</h3><span>{money.format(product.price)}</span></div><button type="button" aria-label={`Remove ${product.name}`} onClick={() => setBag((current) => current.filter((item) => item.id !== product.id))}><X size={15} /></button></div>)}</div><div className="bag-total"><span>Subtotal</span><strong>{money.format(bag.reduce((total, item) => total + item.price, 0))}</strong></div><button type="button" className="checkout-button" onClick={() => setNotice("Checkout is ready to connect to your payment provider.")}>Continue to checkout <ArrowRight size={16} /></button><p className="checkout-note">Secure checkout and shipping are configured by each independent brand.</p></>}</dialog></div>}
  </>;
}

'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  Glasses,
  Minus,
  MonitorSmartphone,
  Plus,
  Printer,
  Receipt,
  Trash2,
  User,
  Wallet,
  X,
} from 'lucide-react';
import {
  fetchPosCatalog, fetchPosRegisters, openPosSession, closePosSession, type PosSessionRecord,
  fetchPosOrders,
  fetchSaasVendors,
  type LabStatusType,
  type PaymentMethodType,
  type PosCatalogProduct,
  type PosLensPackageOption,
  type PosOrderRecord,
  type PosPrescriptionData,
  submitPosOrder,
  updatePosOrderLabStatus,
  type VendorRecord,
} from '@/lib/saas-pos-api';

interface CartLineItem {
  cartItemId: string;
  productVariantId: string;
  productName: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lensPackage?: PosLensPackageOption;
  prescriptionData?: PosPrescriptionData;
}

const EMPTY_RX: PosPrescriptionData = {
  odSph: '',
  odCyl: '',
  odAxis: '',
  odAdd: '',
  osSph: '',
  osCyl: '',
  osAxis: '',
  osAdd: '',
  pd: '',
  lensType: 'Single Vision',
  coating: 'Blue-Cut + Anti-Glare',
  doctorName: '',
  notes: '',
};

export function OpticalPosTerminal({
  initialVendorId,
  initialStoreId,
}: {
  initialVendorId?: string;
  initialStoreId?: string;
}) {
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState<PosCatalogProduct[]>([]);
  const [lensPackages, setLensPackages] = useState<PosLensPackageOption[]>([]);
  const [session, setSession] = useState<PosSessionRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>(initialVendorId || 'vendor-1');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || 'store-1');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('reg-1');

  // Active tab: 'terminal' | 'lab'
  const [activeTab, setActiveTab] = useState<'terminal' | 'lab'>('terminal');

  // Shift / Cash Drawer state
  const [shiftOpen, setShiftOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState(5000);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [countedClosingCash, setCountedClosingCash] = useState('');

  // Catalog filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'eyeglasses' | 'sunglasses'>('all');

  // Cart & Customer state
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [includeVat, setIncludeVat] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Optical Customizer Modal state
  const [customizingProduct, setCustomizingProduct] = useState<{
    product: PosCatalogProduct;
    variant: PosCatalogProduct['variants'][0];
  } | null>(null);
  const [selectedLensPkgId, setSelectedLensPkgId] = useState<string>('');
  const [rxForm, setRxForm] = useState<PosPrescriptionData>(EMPTY_RX);

  // Checkout & Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [depositMode, setDepositMode] = useState<'FULL' | 'HALF' | 'CUSTOM'>('FULL');
  const [customPaidAmount, setCustomPaidAmount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Completed Receipt / Lab Slip preview
  const [receiptOrder, setReceiptOrder] = useState<PosOrderRecord | null>(null);

  // POS Orders & Lab Queue
  const [posOrders, setPosOrders] = useState<PosOrderRecord[]>([]);
  const [labFilter, setLabFilter] = useState<'ALL' | LabStatusType>('ALL');

  useEffect(() => {
    let active = true;
    fetchSaasVendors().then((vendorList) => {
      if (!active) return;
      setVendors(vendorList);
      if (!vendorList.length) setError('No active retail membership found. Ask a vendor administrator for an invitation.');


      const defaultVendor =
        vendorList.find((v) => v.id === (initialVendorId || 'vendor-1')) ?? vendorList[0];
      if (defaultVendor) {
        setSelectedVendorId(defaultVendor.id);
        const defaultStore =
          defaultVendor.stores.find((s) => s.id === initialStoreId) ?? defaultVendor.stores[0];
        if (defaultStore) {
          setSelectedStoreId(defaultStore.id);
          if (defaultStore.posRegisters[0]) {
            setSelectedRegisterId(defaultStore.posRegisters[0].id);
          }
        }
      }
    }).catch(e => { if(active) setError(e.message); });
    return () => {
      active = false;
    };
  }, [initialVendorId, initialStoreId]);

  const currentVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) ?? vendors[0] ?? null,
    [vendors, selectedVendorId],
  );

  const currentStore = useMemo(
    () =>
      currentVendor?.stores.find((s) => s.id === selectedStoreId) ??
      currentVendor?.stores[0] ??
      null,
    [currentVendor, selectedStoreId],
  );

  const currentRegister = useMemo(
    () =>
      currentStore?.posRegisters.find((r) => r.id === selectedRegisterId) ??
      currentStore?.posRegisters[0] ??
      null,
    [currentStore, selectedRegisterId],
  );

  const vendorId = currentVendor?.id;
  const storeId = currentStore?.id;
  const registerId = currentRegister?.id;
  useEffect(() => {
    if (!vendorId || !storeId) return;
    let active = true;
    Promise.all([fetchPosCatalog(vendorId, storeId), fetchPosRegisters(vendorId, storeId), fetchPosOrders(vendorId, storeId)]).then(([data, registers, orders]) => {
      if(!active) return;
      setCatalog(data.products); setLensPackages(data.packages); setPosOrders(orders);
      const currentSession = registers.find(register => register.id === registerId)?.sessions?.[0] ?? null;
      setSession(currentSession); setShiftOpen(Boolean(currentSession)); setOpeningCash(Number(currentSession?.openingCash ?? 0));
    }).catch(e => { if(active) setError(e.message); });
    return () => { active = false; };
  }, [vendorId, storeId, registerId]);
  async function changeShift(close: boolean) {
    setBusy(true); setError('');
    try {
      if (close && session) { await closePosSession(session.id, Number(countedClosingCash)); setSession(null); setShiftOpen(false); }
      else if (vendorId && storeId && registerId) { const opened = await openPosSession({ vendorId, storeId, registerId, openingCash }); setSession(opened); setShiftOpen(true); }
      setShowShiftModal(false);
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const filteredCatalog = useMemo(() => {
    return catalog.filter((product) => {
      const matchesCategory =
        categoryFilter === 'all' || product.category.slug === categoryFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.skuBase.toLowerCase().includes(q) ||
        product.frameShape.toLowerCase().includes(q) ||
        product.brand.name.toLowerCase().includes(q) ||
        product.variants.some((v) => v.sku.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, categoryFilter, catalog]);

  const vendorOrders = useMemo(() => {
    return posOrders.filter((o) => {
      const matchesVendor = !currentVendor || o.vendorId === currentVendor.id;
      const matchesLab = labFilter === 'ALL' || o.labStatus === labFilter;
      return matchesVendor && matchesLab;
    });
  }, [posOrders, currentVendor, labFilter]);

  // Shift totals calculated from orders
  const shiftSummary = useMemo(() => {
    const shiftOrders = vendorOrders.filter(order => order.posSessionId === session?.id);
    const cashSales = shiftOrders
      .filter((o) => o.paymentMethod === 'CASH' || o.paymentMethod === 'SPLIT')
      .reduce((acc, o) => acc + (o.paymentBreakdown?.cash ?? o.paidAmount), 0);
    const cardSales = shiftOrders
      .filter((o) => o.paymentMethod === 'CARD' || o.paymentMethod === 'SPLIT')
      .reduce((acc, o) => acc + (o.paymentBreakdown?.card ?? o.paidAmount), 0);
    const digitalSales = shiftOrders
      .filter((o) => o.paymentMethod === 'ESEWA' || o.paymentMethod === 'KHALTI')
      .reduce((acc, o) => acc + o.paidAmount, 0);
    const expectedCash = openingCash + cashSales;
    return { cashSales, cardSales, digitalSales, expectedCash };
  }, [vendorOrders, openingCash, session]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const lensCost = item.lensPackage?.price ?? 0;
      return sum + (item.unitPrice + lensCost) * item.quantity;
    }, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (!includeVat) return 0;
    const taxable = Math.max(0, cartSubtotal - discount);
    return Math.round(taxable * 0.13);
  }, [cartSubtotal, discount, includeVat]);

  const grandTotal = useMemo(
    () => Math.max(0, cartSubtotal - discount + taxAmount),
    [cartSubtotal, discount, taxAmount],
  );

  const amountToPayNow = useMemo(() => {
    if (depositMode === 'FULL') return grandTotal;
    if (depositMode === 'HALF') return Math.round(grandTotal * 0.5);
    return Math.min(grandTotal, Math.max(0, customPaidAmount));
  }, [depositMode, grandTotal, customPaidAmount]);

  const balanceDueAfterPay = useMemo(
    () => Math.max(0, grandTotal - amountToPayNow),
    [grandTotal, amountToPayNow],
  );

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    return Math.max(0, cashTendered - amountToPayNow);
  }, [paymentMethod, cashTendered, amountToPayNow]);

  const addFrameOnlyToCart = (
    product: PosCatalogProduct,
    variant: PosCatalogProduct['variants'][0],
  ) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productVariantId === variant.id && !item.lensPackage && !item.prescriptionData,
      );
      if (existingIdx > -1) {
        const clone = [...prev];
        const current = clone[existingIdx]!;
        clone[existingIdx] = { ...current, quantity: current.quantity + 1 };
        return clone;
      }
      return [
        ...prev,
        {
          cartItemId: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productVariantId: variant.id,
          productName: `${product.name} (${variant.color})`,
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          quantity: 1,
          unitPrice: variant.price ?? product.basePrice,
        },
      ];
    });
  };

  const openOpticalBuilder = (
    product: PosCatalogProduct,
    variant: PosCatalogProduct['variants'][0],
  ) => {
    setCustomizingProduct({ product, variant });
    setSelectedLensPkgId(lensPackages[0]?.id ?? '');
    setRxForm(EMPTY_RX);
  };

  const confirmOpticalItem = (e: FormEvent) => {
    e.preventDefault();
    if (!customizingProduct) return;
    const lensPkg = lensPackages.find((p) => p.id === selectedLensPkgId);
    const { product, variant } = customizingProduct;

    setCart((prev) => [
      ...prev,
      {
        cartItemId: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productVariantId: variant.id,
        productName: `${product.name} (${variant.color})`,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        quantity: 1,
        unitPrice: variant.price ?? product.basePrice,
        lensPackage: lensPkg,
        prescriptionData: {
          ...rxForm,
          lensType: lensPkg?.lensTypeName ?? rxForm.lensType,
        },
      },
    ]);
    setCustomizingProduct(null);
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setDepositMode('FULL');
    setCustomPaidAmount(grandTotal);
    setCashTendered(grandTotal);
    setShowPaymentModal(true);
  };

  const handleCompleteSale = async (e: FormEvent) => {
    setBusy(true); setError('');
    try {
    e.preventDefault();
    if (!currentVendor || !currentStore) return;

    const created = await submitPosOrder({
      vendorId: currentVendor.id,
      storeId: currentStore.id,
      posRegisterId: currentRegister?.id,
      posSessionId: session?.id,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      items: cart.map((item) => ({
        productVariantId: item.productVariantId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lensPackageId: item.lensPackage?.id,
        lensPackageName: item.lensPackage?.name,
        lensPrice: item.lensPackage?.price ?? 0,
        prescriptionData: item.prescriptionData,
      })),
      discount,
      taxAmount,
      paymentMethod,
      paidAmount: amountToPayNow,
      paymentBreakdown: {
        cash: paymentMethod === 'CASH' ? cashTendered : 0,
        card: paymentMethod === 'CARD' ? amountToPayNow : 0,
        digital:
          paymentMethod === 'ESEWA' || paymentMethod === 'KHALTI' ? amountToPayNow : 0,
        changeGiven: changeDue,
      },
      notes: orderNotes.trim() || undefined,
    });

    const updatedOrders = await fetchPosOrders(vendorId, storeId);
    setPosOrders(updatedOrders);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setOrderNotes('');
    setShowPaymentModal(false);
    setReceiptOrder(created);
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const handleAdvanceLabStatus = async (
    orderId: string,
    labStatus: LabStatusType,
    collectBalance = false,
  ) => {
    setBusy(true); setError('');
    try {
    const updated = await updatePosOrderLabStatus(orderId, { labStatus, collectBalance, collectionSessionId: session?.id }, vendorId, storeId);
    setPosOrders(updated);
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {error ? <div role="alert" className="bg-red-50 p-4 text-red-800">{error}</div> : null}
      {/* Top SaaS POS Command Bar */}
      <header className="bg-slate-900 text-white px-4 lg:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/vendors"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            SaaS Vendors
          </Link>

          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: currentVendor?.brandColor || '#4f46e5' }}
            />
            <select
              value={selectedVendorId}
              onChange={(e) => {
                const vId = e.target.value;
                setSelectedVendorId(vId);
                const v = vendors.find((item) => item.id === vId);
                if (v?.stores[0]) {
                  setSelectedStoreId(v.stores[0].id);
                  if (v.stores[0].posRegisters[0]) {
                    setSelectedRegisterId(v.stores[0].posRegisters[0].id);
                  }
                }
              }}
              aria-label="Select SaaS Vendor"
              className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  Vendor: {v.name} ({v.plan})
                </option>
              ))}
            </select>
          </div>

          {currentVendor && (
            <select
              value={selectedStoreId}
              onChange={(e) => {
                const sId = e.target.value;
                setSelectedStoreId(sId);
                const st = currentVendor.stores.find((item) => item.id === sId);
                if (st?.posRegisters[0]) {
                  setSelectedRegisterId(st.posRegisters[0].id);
                }
              }}
              aria-label="Select Store Branch"
              className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700"
            >
              {currentVendor.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  Branch: {s.name}
                </option>
              ))}
            </select>
          )}

          {currentStore && (
            <select
              value={selectedRegisterId}
              onChange={(e) => setSelectedRegisterId(e.target.value)}
              aria-label="Select POS Register"
              className="bg-slate-800 text-emerald-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-mono"
            >
              {currentStore.posRegisters.map((r) => (
                <option key={r.id} value={r.id}>
                  POS: {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Mode Switcher & Shift Drawer */}
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-800 p-1 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MonitorSmartphone className="w-3.5 h-3.5" />
              Register Checkout
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lab')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'lab'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Lab &amp; Pickup Queue ({vendorOrders.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowShiftModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
              shiftOpen
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/80 border-rose-700 text-rose-300'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            {shiftOpen
              ? `Shift Open · Drawer NPR ${shiftSummary.expectedCash.toLocaleString()}`
              : 'Shift Closed (Open Register)'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'terminal' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 lg:p-6">
          {/* Left 7 Cols: Frame & Optical Catalog */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Search & Category Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:flex-1">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Scan barcode, enter SKU (e.g. EC-AIR02, AT-05), or search shape..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                {(['all', 'eyeglasses', 'sunglasses'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCatalog.map((product) =>
                product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {variant.sku}
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {variant.stock} in stock
                        </span>
                      </div>

                      <div className="h-28 bg-slate-50 rounded-xl flex items-center justify-center p-3 mb-3 border border-slate-100">
                        <Image
                          src={variant.imageUrl}
                          alt={product.name}
                          width={220}
                          height={90}
                          className="max-h-20 w-auto object-contain"
                          unoptimized
                        />
                      </div>

                      <p className="text-xs font-medium text-indigo-600">{product.brand.name}</p>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {variant.color} · {product.frameShape} · {variant.size}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Frame Price</span>
                        <span className="text-base font-bold text-slate-900">
                          NPR {(variant.price ?? product.basePrice).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => addFrameOnlyToCart(product, variant)}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          + Frame Only
                        </button>
                        <button
                          type="button"
                          onClick={() => openOpticalBuilder(product, variant)}
                          className="px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Glasses className="w-3.5 h-3.5" /> + Lens &amp; Rx
                        </button>
                      </div>
                    </div>
                  </div>
                )),
              )}
            </div>
          </div>

          {/* Right 5 Cols: Active POS Ticket / Cart */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sticky top-6">
              {/* Customer Bar */}
              <div className="p-4 border-b border-slate-200 space-y-2.5 bg-slate-50/60 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" /> Customer / Patient Info
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {currentRegister?.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name (or Walk-in)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone (+977-98...)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Glasses className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">POS Ticket is Empty</p>
                    <p className="text-xs text-slate-400">
                      Select a frame or configure custom prescription lenses from the left grid.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const lineTotal =
                      (item.unitPrice + (item.lensPackage?.price ?? 0)) * item.quantity;
                    return (
                      <div key={item.cartItemId} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.productName}</p>
                            <p className="text-[11px] font-mono text-slate-500">
                              SKU: {item.sku} · Frame: NPR {item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-slate-900">
                            NPR {lineTotal.toLocaleString()}
                          </p>
                        </div>

                        {item.lensPackage && (
                          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-xs space-y-1">
                            <div className="flex items-center justify-between font-semibold text-indigo-950">
                              <span>+ {item.lensPackage.name}</span>
                              <span>NPR {item.lensPackage.price.toLocaleString()}</span>
                            </div>
                            {item.prescriptionData && (
                              <div className="text-[11px] font-mono text-indigo-800 space-y-0.5 pt-1 border-t border-indigo-100">
                                <div>
                                  OD: {item.prescriptionData.odSph || '0.00'} /{' '}
                                  {item.prescriptionData.odCyl || '0.00'} x{' '}
                                  {item.prescriptionData.odAxis || '0'}
                                  {item.prescriptionData.odAdd
                                    ? ` Add ${item.prescriptionData.odAdd}`
                                    : ''}
                                </div>
                                <div>
                                  OS: {item.prescriptionData.osSph || '0.00'} /{' '}
                                  {item.prescriptionData.osCyl || '0.00'} x{' '}
                                  {item.prescriptionData.osAxis || '0'} · PD:{' '}
                                  {item.prescriptionData.pd}mm
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.cartItemId, -1)}
                              className="p-1 hover:bg-white rounded text-slate-700"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.cartItemId, 1)}
                              className="p-1 hover:bg-white rounded text-slate-700"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateCartQty(item.cartItemId, -item.quantity)}
                            className="text-rose-500 hover:text-rose-700 text-xs inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pricing Breakdown & Tender Trigger */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 rounded-b-2xl">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                    <span className="font-semibold">NPR {cartSubtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Discount (NPR)</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                      className="w-24 px-2 py-1 text-right text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeVat}
                        onChange={(e) => setIncludeVat(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span>Add 13% VAT</span>
                    </label>
                    <span>NPR {taxAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total</span>
                    <span>NPR {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Order / Lab fitting note (optional)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />

                <button
                  type="button"
                  disabled={busy || cart.length === 0 || !shiftOpen}
                  onClick={handleOpenCheckout}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  {shiftOpen
                    ? `Charge / Tender (NPR ${grandTotal.toLocaleString()})`
                    : 'Open Shift to Checkout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Optical Lab & Pickup Queue View */
        <div className="flex-1 p-4 lg:p-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Optical Lab &amp; Store Pickup Queue
              </h2>
              <p className="text-xs text-slate-500">
                Track lens edging jobs, verify quality check, and collect remaining deposit balances upon customer fitting.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'ALL',
                  'PENDING_LAB',
                  'IN_LAB',
                  'QUALITY_CHECK',
                  'READY_FOR_PICKUP',
                  'DELIVERED',
                ] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setLabFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    labFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {vendorOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {ord.orderNumber}
                    </span>
                    <span className="font-bold text-slate-900">{ord.customerName}</span>
                    {ord.customerPhone && (
                      <span className="text-xs text-slate-500">{ord.customerPhone}</span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Lab: {ord.labStatus.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        ord.balanceDue > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {ord.balanceDue > 0
                        ? `Balance Due: NPR ${ord.balanceDue.toLocaleString()}`
                        : 'Fully Paid'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {ord.items.map((item) => (
                      <div key={item.id} className="text-xs text-slate-700">
                        <span className="font-semibold">{item.productName}</span> ({item.sku})
                        {item.lensPackageName && (
                          <span className="text-indigo-700 font-medium">
                            {' '}
                            + {item.lensPackageName}
                          </span>
                        )}
                        {item.prescriptionData && (
                          <span className="ml-2 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                            OD {item.prescriptionData.odSph}/{item.prescriptionData.odCyl}x
                            {item.prescriptionData.odAxis} | OS {item.prescriptionData.osSph}/
                            {item.prescriptionData.osCyl}x{item.prescriptionData.osAxis} | PD{' '}
                            {item.prescriptionData.pd}mm
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => setReceiptOrder(ord)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" /> Receipt / Lab Slip
                  </button>

                  {ord.labStatus === 'PENDING_LAB' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceLabStatus(ord.id, 'IN_LAB')}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                    >
                      Start Lab Edging
                    </button>
                  )}

                  {ord.labStatus === 'IN_LAB' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceLabStatus(ord.id, 'QUALITY_CHECK')}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                    >
                      Send to QC
                    </button>
                  )}

                  {ord.labStatus === 'QUALITY_CHECK' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceLabStatus(ord.id, 'READY_FOR_PICKUP')}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}

                  {ord.labStatus === 'READY_FOR_PICKUP' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceLabStatus(ord.id, 'DELIVERED', true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      {ord.balanceDue > 0
                        ? `Collect NPR ${ord.balanceDue.toLocaleString()} & Deliver`
                        : 'Complete Handover'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Optical Lens & Clinical Prescription (Rx) Builder */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Optical Dispensary Configuration
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  {customizingProduct.product.name} ({customizingProduct.variant.color})
                </h2>
                <p className="text-xs text-slate-500">
                  SKU: {customizingProduct.variant.sku} · Base Frame: NPR{' '}
                  {(
                    customizingProduct.variant.price ?? customizingProduct.product.basePrice
                  ).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={confirmOpticalItem} className="space-y-6">
              {/* Step 1: Select Lens Package */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Select Optical Lens Package
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lensPackages.map((pkg) => {
                    const selected = pkg.id === selectedLensPkgId;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedLensPkgId(pkg.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase text-indigo-600">
                            {pkg.lensTypeName}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            + NPR {pkg.price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{pkg.name}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {pkg.features.join(' · ')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Clinical Prescription Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" /> 2. Patient Prescription (Rx)
                    Parameters
                  </label>
                  <span className="text-[11px] text-slate-500">Diopters (D) &amp; Axis (1-180°)</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase">
                      <tr>
                        <th className="p-2.5">Eye</th>
                        <th className="p-2.5">Sphere (SPH)</th>
                        <th className="p-2.5">Cylinder (CYL)</th>
                        <th className="p-2.5">Axis (0-180)</th>
                        <th className="p-2.5">Near ADD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">OD (Right)</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.odSph}
                            onChange={(e) => setRxForm({ ...rxForm, odSph: e.target.value })}
                            placeholder="-1.25"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.odCyl}
                            onChange={(e) => setRxForm({ ...rxForm, odCyl: e.target.value })}
                            placeholder="-0.50"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.odAxis}
                            onChange={(e) => setRxForm({ ...rxForm, odAxis: e.target.value })}
                            placeholder="90"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.odAdd}
                            onChange={(e) => setRxForm({ ...rxForm, odAdd: e.target.value })}
                            placeholder="+1.50"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">OS (Left)</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.osSph}
                            onChange={(e) => setRxForm({ ...rxForm, osSph: e.target.value })}
                            placeholder="-1.50"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.osCyl}
                            onChange={(e) => setRxForm({ ...rxForm, osCyl: e.target.value })}
                            placeholder="-0.25"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.osAxis}
                            onChange={(e) => setRxForm({ ...rxForm, osAxis: e.target.value })}
                            placeholder="85"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rxForm.osAdd}
                            onChange={(e) => setRxForm({ ...rxForm, osAdd: e.target.value })}
                            placeholder="+1.50"
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pupillary Distance (PD mm)
                    </label>
                    <input
                      type="text"
                      value={rxForm.pd}
                      onChange={(e) => setRxForm({ ...rxForm, pd: e.target.value })}
                      placeholder="63"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Optometrist / Doctor
                    </label>
                    <input
                      type="text"
                      value={rxForm.doctorName}
                      onChange={(e) => setRxForm({ ...rxForm, doctorName: e.target.value })}
                      placeholder="Dr. Suman Karki"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Lab Coating / Tint Note
                    </label>
                    <input
                      type="text"
                      value={rxForm.notes}
                      onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
                      placeholder="Edge polish, AR coat..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">Configured Pair Total: </span>
                  <span className="text-lg font-bold text-slate-900">
                    NPR{' '}
                    {(
                      (customizingProduct.variant.price ?? customizingProduct.product.basePrice) +
                      (lensPackages.find((p) => p.id === selectedLensPkgId)?.price ?? 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomizingProduct(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={busy}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    Add Frame + Rx Lens to Ticket
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Multi-Tender Payment & Lab Deposit Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">POS Tender &amp; Payment</h2>
                <p className="text-xs text-slate-500">
                  Supports full payment or partial deposit for custom lab orders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSale} className="space-y-5">
              {/* Deposit Option */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  1. Payment Schedule
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'FULL', label: '100% Full Pay' },
                      { id: 'HALF', label: '50% Lab Deposit' },
                      { id: 'CUSTOM', label: 'Custom Deposit' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setDepositMode(mode.id);
                        const nextPay =
                          mode.id === 'FULL'
                            ? grandTotal
                            : mode.id === 'HALF'
                              ? Math.round(grandTotal * 0.5)
                              : customPaidAmount;
                        setCashTendered(nextPay);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border ${
                        depositMode === mode.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {depositMode === 'CUSTOM' && (
                  <div className="pt-2">
                    <label className="block text-xs text-slate-600 mb-1">
                      Deposit Collected Today (NPR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={customPaidAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCustomPaidAmount(val);
                        setCashTendered(val);
                      }}
                      className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Tender Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    ['CASH', 'CARD', 'ESEWA', 'KHALTI'] as PaymentMethodType[]
                  ).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border ${
                        paymentMethod === method
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Cash Received from Customer
                    </label>
                    <div className="flex gap-1">
                      {[amountToPayNow, Math.ceil(amountToPayNow / 1000) * 1000].map(
                        (quickAmt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashTendered(quickAmt)}
                            className="px-2 py-0.5 rounded bg-white border border-slate-300 text-[11px] font-semibold"
                          >
                            NPR {quickAmt.toLocaleString()}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={amountToPayNow}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <div className="flex justify-between text-xs font-bold text-emerald-700 pt-1">
                    <span>Change to Return:</span>
                    <span>NPR {changeDue.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Summary Box */}
              <div className="bg-indigo-950 text-white p-4 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-indigo-200">
                  <span>Order Grand Total</span>
                  <span>NPR {grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white">
                  <span>Collecting Now ({paymentMethod})</span>
                  <span>NPR {amountToPayNow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-300 font-semibold pt-1 border-t border-indigo-800">
                  <span>Balance Due on Pickup</span>
                  <span>NPR {balanceDueAfterPay.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit" disabled={busy}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                Complete POS Order &amp; Generate Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Printable Thermal Receipt & Optical Lab Job Slip */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="text-lg font-bold">POS Order Confirmed · Receipt &amp; Lab Slip</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Both
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Thermal Receipt */}
              <div className="border border-slate-300 rounded-xl p-4 font-mono text-xs space-y-3 bg-slate-50/50">
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <p className="font-bold text-sm">{currentVendor?.name || 'EYE-CLUB OPTICS'}</p>
                  <p className="text-[11px] text-slate-600">{currentStore?.name}</p>
                  <p className="text-[11px] text-slate-500">{currentStore?.address}</p>
                  {currentVendor?.taxId && (
                    <p className="text-[11px] text-slate-500">PAN/VAT: {currentVendor.taxId}</p>
                  )}
                </div>

                <div className="space-y-0.5 text-[11px]">
                  <p>Order #: {receiptOrder.orderNumber}</p>
                  <p>Date: {new Date(receiptOrder.createdAt).toLocaleString()}</p>
                  <p>Customer: {receiptOrder.customerName}</p>
                  {receiptOrder.customerPhone && <p>Phone: {receiptOrder.customerPhone}</p>}
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-2">
                  {receiptOrder.items.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between font-bold">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span>NPR {item.totalPrice.toLocaleString()}</span>
                      </div>
                      {item.lensPackageName && (
                        <p className="text-[10px] text-slate-600">
                          + Lens: {item.lensPackageName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>NPR {receiptOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {receiptOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>- NPR {receiptOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {receiptOrder.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>VAT (13%):</span>
                      <span>NPR {receiptOrder.taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                    <span>Total:</span>
                    <span>NPR {receiptOrder.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Paid ({receiptOrder.paymentMethod}):</span>
                    <span>NPR {receiptOrder.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Balance Due:</span>
                    <span>NPR {receiptOrder.balanceDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Optical Lab Job Ticket */}
              <div className="border border-indigo-200 rounded-xl p-4 font-mono text-xs space-y-3 bg-indigo-50/30">
                <div className="border-b border-indigo-200 pb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white">
                    OPTICAL LAB WORK TICKET
                  </span>
                  <p className="font-bold text-sm mt-1">{receiptOrder.orderNumber}</p>
                  <p className="text-[11px] text-slate-600">
                    Patient: {receiptOrder.customerName} · Status: {receiptOrder.labStatus}
                  </p>
                </div>

                {receiptOrder.items.map((item) => (
                  <div key={item.id} className="space-y-2 border-b border-indigo-100 pb-2">
                    <p className="font-bold">
                      Frame: {item.sku} ({item.productName})
                    </p>
                    <p className="text-[11px] text-indigo-900">
                      Lens: {item.lensPackageName || 'Frame Only'}
                    </p>
                    {item.prescriptionData && (
                      <div className="bg-white p-2 rounded border border-indigo-200 text-[11px] space-y-1">
                        <p>
                          <strong>OD (R):</strong> SPH {item.prescriptionData.odSph} | CYL{' '}
                          {item.prescriptionData.odCyl} | AXIS {item.prescriptionData.odAxis} | ADD{' '}
                          {item.prescriptionData.odAdd || '-'}
                        </p>
                        <p>
                          <strong>OS (L):</strong> SPH {item.prescriptionData.osSph} | CYL{' '}
                          {item.prescriptionData.osCyl} | AXIS {item.prescriptionData.osAxis} | ADD{' '}
                          {item.prescriptionData.osAdd || '-'}
                        </p>
                        <p>
                          <strong>PD:</strong> {item.prescriptionData.pd}mm ·{' '}
                          <strong>Dr:</strong> {item.prescriptionData.doctorName || 'In-Store'}
                        </p>
                        {item.prescriptionData.notes && (
                          <p>
                            <strong>Lab Note:</strong> {item.prescriptionData.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Cashier Shift & Cash Drawer Reconciliation (X/Z Report) */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  POS Register Shift &amp; Cash Drawer
                </h2>
                <p className="text-xs text-slate-500">{currentRegister?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Opening Float:</span>
                <span className="font-bold">NPR {openingCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cash Sales Collected:</span>
                <span className="font-bold text-emerald-700">
                  + NPR {shiftSummary.cashSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Card Terminal Sales:</span>
                <span className="font-bold">NPR {shiftSummary.cardSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Digital Wallet (eSewa/Khalti):</span>
                <span className="font-bold">NPR {shiftSummary.digitalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Expected Cash in Drawer:</span>
                <span>NPR {shiftSummary.expectedCash.toLocaleString()}</span>
              </div>
            </div>

            {shiftOpen ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical Counted Cash in Drawer (NPR)
                  </label>
                  <input
                    type="number"
                    placeholder={String(shiftSummary.expectedCash)}
                    value={countedClosingCash}
                    onChange={(e) => setCountedClosingCash(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <button
                  type="button" disabled={busy}
                  onClick={() => {
                    void changeShift(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Close Cashier Shift &amp; Lock Register
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Shift Opening Cash Float (NPR)
                  </label>
                  <input
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <button
                  type="button" disabled={busy}
                  onClick={() => {
                    void changeShift(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Open Register Shift
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Layers,
  MapPin,
  MonitorSmartphone,
  Plus,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  addVendorBranch,
  addVendorStaffMember,
  createSaasVendor,
  fetchSaasVendors,
  type SaaSTier,
  type StaffRole,
  updateSaasVendorStatusOrPlan,
  type VendorRecord,
  type VendorStatus,
} from '@/lib/saas-pos-api';

export function VendorSaasManager() {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | SaaSTier>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VendorStatus>('ALL');

  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  // Onboard form state
  const [newVendor, setNewVendor] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
    primaryStoreName: '',
    brandColor: '#4f46e5',
    plan: 'PROFESSIONAL' as SaaSTier,
    commissionRate: 10,
  });

  // Branch form state
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    phone: '',
    registerName: 'Counter #1 - Main POS',
  });

  // Staff form state
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'CASHIER' as StaffRole,
    storeId: '',
  });

  useEffect(() => {
    let mounted = true;
    fetchSaasVendors().then((data) => {
      if (!mounted) return;
      setVendors(data);
      setLoading(false);
    }).catch(e => { if(mounted) { setNotice(e.message); setLoading(false); } });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) ?? null,
    [vendors, selectedVendorId],
  );

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !search.trim() ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.slug.toLowerCase().includes(search.toLowerCase()) ||
        v.email.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === 'ALL' || v.plan === planFilter;
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [vendors, search, planFilter, statusFilter]);

  const platformMetrics = useMemo(() => {
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter((v) => v.status === 'ACTIVE').length;
    const totalStores = vendors.reduce((acc, v) => acc + v.stores.length, 0);
    const totalRegisters = vendors.reduce(
      (acc, v) => acc + v.stores.reduce((sAcc, st) => sAcc + st.posRegisters.length, 0),
      0,
    );
    const totalGmv = vendors.reduce((acc, v) => acc + (v.metrics?.totalRevenue ?? 0), 0);
    const totalSaasCommission = vendors.reduce(
      (acc, v) => acc + ((v.metrics?.totalRevenue ?? 0) * Number(v.commissionRate)) / 100,
      0,
    );

    return {
      totalVendors,
      activeVendors,
      totalStores,
      totalRegisters,
      totalGmv,
      totalSaasCommission,
    };
  }, [vendors]);

  const handleOnboardSubmit = async (e: FormEvent) => {
    try {
    e.preventDefault();
    const created = await createSaasVendor(newVendor);
    const refreshed = await fetchSaasVendors();
    setVendors(refreshed);
    setShowOnboardModal(false);
    setSelectedVendorId(created.id);
    setNewVendor({
      name: '',
      slug: '',
      email: '',
      phone: '',
      taxId: '',
      address: '',
      primaryStoreName: '',
      brandColor: '#4f46e5',
      plan: 'PROFESSIONAL',
      commissionRate: 10,
    });
    setNotice(`Onboarded vendor "${created.name}" with primary store and POS register.`);
    } catch(e) { setNotice((e as Error).message); }
  };

  const handlePlanOrStatusChange = async (
    vendorId: string,
    patch: Partial<Pick<VendorRecord, 'plan' | 'status'>>,
  ) => {
    try {
    const updated = await updateSaasVendorStatusOrPlan(vendorId, patch);
    setVendors(updated);
    setNotice('Updated vendor subscription & tenant status.');
    } catch(e) { setNotice((e as Error).message); }
  };

  const handleAddBranch = async (e: FormEvent) => {
    try {
    e.preventDefault();
    if (!selectedVendor) return;
    const updated = await addVendorBranch(selectedVendor.id, newBranch);
    setVendors(updated);
    setNewBranch({
      name: '',
      address: '',
      phone: '',
      registerName: 'Counter #1 - Main POS',
    });
    setNotice(`Added branch "${newBranch.name}" and provisioned its POS register.`);
    } catch(e) { setNotice((e as Error).message); }
  };

  const handleAddStaff = async (e: FormEvent) => {
    try {
    e.preventDefault();
    if (!selectedVendor) return;
    const updated = await addVendorStaffMember(selectedVendor.id, {
      ...newStaff,
      storeId: newStaff.storeId || selectedVendor.stores[0]?.id,
    });
    setVendors(updated.vendors);
    setNewStaff({
      firstName: '',
      lastName: '',
      email: '',
      role: 'CASHIER',
      storeId: '',
    });
    setNotice(`Staff invitation created. Share this link with ${newStaff.email}: ${window.location.origin}/invite/${updated.token}`);
    } catch(e) { setNotice((e as Error).message); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Layers className="w-3.5 h-3.5" /> Multi-Tenant Optical SaaS Control Plane
          </span>
          <h1 className="text-3xl font-bold text-slate-900">Vendor & Tenant Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Onboard optical retailers, manage store branches &amp; POS registers, assign optometrists, and monitor SaaS revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold shadow-sm transition-colors"
          >
            <MonitorSmartphone className="w-4 h-4 text-indigo-600" />
            Open POS Terminal
          </Link>
          <button
            type="button"
            onClick={() => setShowOnboardModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Onboard New Vendor
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-sm">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SaaS Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active SaaS Vendors
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {platformMetrics.activeVendors}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {platformMetrics.totalVendors} total
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Isolated multi-tenant workspaces</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Branches &amp; POS Terminals
            </span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <MonitorSmartphone className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {platformMetrics.totalStores} Stores{' '}
            <span className="text-sm font-normal text-slate-500">
              · {platformMetrics.totalRegisters} POS
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Live retail &amp; clinic dispensaries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Platform GMV (Optical + POS)
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            NPR {platformMetrics.totalGmv.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Combined online &amp; in-store POS sales</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              SaaS Commission Earned
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            NPR {Math.round(platformMetrics.totalSaasCommission).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Platform fee across vendor tiers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, slug, or email..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as 'ALL' | SaaSTier)}
            aria-label="Filter by SaaS Plan"
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All SaaS Plans</option>
            <option value="STARTER">Starter Plan</option>
            <option value="PROFESSIONAL">Professional Plan</option>
            <option value="ENTERPRISE">Enterprise Plan</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | VendorStatus)}
            aria-label="Filter by Status"
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendor List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          Loading SaaS vendor tenants...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredVendors.map((vendor) => {
            const registerCount = vendor.stores.reduce(
              (acc, st) => acc + st.posRegisters.length,
              0,
            );
            return (
              <div
                key={vendor.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all hover:border-indigo-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Vendor Identity */}
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                      style={{ backgroundColor: vendor.brandColor || '#4f46e5' }}
                    >
                      {vendor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-bold text-slate-900">{vendor.name}</h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            vendor.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : vendor.status === 'TRIALING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {vendor.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {vendor.plan}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          /?organization={vendor.slug}
                        </span>
                        <span>{vendor.email}</span>
                        {vendor.phone && <span>{vendor.phone}</span>}
                        {vendor.taxId && <span>Tax ID: {vendor.taxId}</span>}
                      </div>

                      {/* Branch Pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {vendor.stores.map((st) => (
                          <span
                            key={st.id}
                            className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
                          >
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {st.name} ({st.posRegisters.length} POS)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quota, Revenue & Controls */}
                  <div className="flex flex-col sm:flex-row lg:items-center gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                      <div>
                        <p className="text-xs text-slate-500">Stores Quota</p>
                        <p className="text-sm font-bold text-slate-900">
                          {vendor.stores.length} / {vendor.maxStores}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">POS Registers</p>
                        <p className="text-sm font-bold text-slate-900">
                          {registerCount} / {vendor.maxPosRegisters}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Vendor GMV</p>
                        <p className="text-sm font-bold text-slate-900">
                          {vendor.currency} {(vendor.metrics?.totalRevenue ?? 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-medium">
                          {vendor.commissionRate}% platform fee
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVendorId(vendor.id)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors"
                      >
                        Branches &amp; Staff
                      </button>
                      <Link
                        href={`/pos?vendorId=${encodeURIComponent(vendor.id)}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                      >
                        <MonitorSmartphone className="w-3.5 h-3.5" />
                        Launch POS
                      </Link>
                      <Link
                        href={`/?organization=${encodeURIComponent(vendor.slug)}`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600"
                        title="Preview Vendor Storefront"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Vendor Management Modal (Branches, POS Registers, Staff, Subscription) */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Tenant Workspace Configuration
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{selectedVendor.name}</h2>
                <p className="text-xs text-slate-500">
                  Slug: <code className="font-mono">{selectedVendor.slug}</code> · Tax ID:{' '}
                  {selectedVendor.taxId || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendorId(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SaaS Subscription & Status Controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    SaaS Tier &amp; Tenant Governance
                  </p>
                  <p className="text-xs text-slate-500">
                    Adjust subscription tier limits or suspend tenant access immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedVendor.plan}
                  onChange={(e) =>
                    handlePlanOrStatusChange(selectedVendor.id, {
                      plan: e.target.value as SaaSTier,
                    })
                  }
                  aria-label="Vendor SaaS Plan"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                >
                  <option value="STARTER">STARTER (2 Stores / 3 POS)</option>
                  <option value="PROFESSIONAL">PROFESSIONAL (5 Stores / 10 POS)</option>
                  <option value="ENTERPRISE">ENTERPRISE (15 Stores / 30 POS)</option>
                </select>

                <select
                  value={selectedVendor.status}
                  onChange={(e) =>
                    handlePlanOrStatusChange(selectedVendor.id, {
                      status: e.target.value as VendorStatus,
                    })
                  }
                  aria-label="Vendor Status"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIALING">TRIALING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Store Branches & POS Registers */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" />
                  Retail Branches &amp; POS Registers ({selectedVendor.stores.length})
                </h3>

                <div className="space-y-3">
                  {selectedVendor.stores.map((st) => (
                    <div
                      key={st.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-slate-900">{st.name}</p>
                        <Link
                          href={`/pos?vendorId=${encodeURIComponent(selectedVendor.id)}&storeId=${encodeURIComponent(st.id)}`}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Open Branch POS →
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500">{st.address}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {st.posRegisters.map((reg) => (
                          <span
                            key={reg.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium"
                          >
                            <MonitorSmartphone className="w-3 h-3" />
                            {reg.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Branch Form */}
                <form
                  onSubmit={handleAddBranch}
                  className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    + Add New Store Branch &amp; POS Register
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Branch Name (e.g., Patan Optical Studio)"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Street Address & City"
                      value={newBranch.address}
                      onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="POS Register Name"
                      value={newBranch.registerName}
                      onChange={(e) =>
                        setNewBranch({ ...newBranch, registerName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    Provision Branch &amp; POS Terminal
                  </button>
                </form>
              </div>

              {/* Staff & Optometrists */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Vendor Staff, Optometrists &amp; Cashiers ({selectedVendor.members.length})
                </h3>

                <div className="space-y-2.5">
                  {selectedVendor.members.length === 0 ? (
                    <p className="text-xs text-slate-500 p-4 rounded-xl border border-slate-200">
                      No staff assigned yet. Add an optometrist or POS cashier below.
                    </p>
                  ) : (
                    selectedVendor.members.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {m.user.firstName} {m.user.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {m.user.email} {m.store ? `· ${m.store.name}` : ''}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {m.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Staff Form */}
                <form
                  onSubmit={handleAddStaff}
                  className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Assign Staff / Optometrist / Cashier
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="First Name"
                      value={newStaff.firstName}
                      onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Last Name"
                      value={newStaff.lastName}
                      onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Staff Email Address"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newStaff.role}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, role: e.target.value as StaffRole })
                      }
                      aria-label="Staff Role"
                      className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="CASHIER">POS Cashier</option>
                      <option value="OPTOMETRIST">Optometrist (Rx)</option>
                      <option value="STORE_MANAGER">Store Manager</option>
                      <option value="INVENTORY_MANAGER">Inventory Manager</option>
                      <option value="VENDOR_OWNER">Vendor Owner</option>
                    </select>

                    <select
                      value={newStaff.storeId}
                      onChange={(e) => setNewStaff({ ...newStaff, storeId: e.target.value })}
                      aria-label="Assigned Branch"
                      className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      {selectedVendor.stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    Assign Staff Member
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Vendor Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Onboard New Optical Vendor</h2>
                <p className="text-xs text-slate-500">
                  Provisions tenant workspace, primary retail store, and POS register #1.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Optical Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Everest Vision Care"
                    value={newVendor.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                      setNewVendor({ ...newVendor, name, slug });
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tenant Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="everest-vision-care"
                    value={newVendor.slug}
                    onChange={(e) => setNewVendor({ ...newVendor, slug: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner / Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@everestvision.np"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+977-1-4412345"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Store Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="Lazimpat Flagship Clinic"
                    value={newVendor.primaryStoreName}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, primaryStoreName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PAN / Tax Registration ID
                  </label>
                  <input
                    type="text"
                    placeholder="PAN-601239876"
                    value={newVendor.taxId}
                    onChange={(e) => setNewVendor({ ...newVendor, taxId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Street Address
                </label>
                <input
                  type="text"
                  placeholder="Lazimpat Road, Kathmandu"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SaaS Plan
                  </label>
                  <select
                    value={newVendor.plan}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, plan: e.target.value as SaaSTier })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={newVendor.commissionRate}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, commissionRate: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Color
                  </label>
                  <input
                    type="color"
                    value={newVendor.brandColor}
                    onChange={(e) => setNewVendor({ ...newVendor, brandColor: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm"
                >
                  Create Vendor &amp; Provision POS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  Barcode,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Laptop,
  Package,
  Printer,
  Receipt,
  Search,
  Star,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  type ComfortScore,
  type PatientRecord,
  type PhysicalComfortAssessment,
  ReliableEventBus,
  type TenantContext,
  type TrialSessionRecord,
} from '../../../../../packages/contracts/src/index';
import { CatalogDomainService } from '../../../../../services/catalog-service/src/index';
import { InventoryDomainService } from '../../../../../services/inventory-service/src/index';
import { PatientDomainService } from '../../../../../services/patient-service/src/index';
import { PosDomainService } from '../../../../../services/pos-service/src/index';
import { ReportingDomainService } from '../../../../../services/reporting-service/src/index';
import { TrialDomainService } from '../../../../../services/trial-service/src/index';
import { LiveTryOn } from '@/features/try-on/components/live-try-on';
import { useFrameLibrary } from '@/features/try-on/hooks/use-frame-library';

const INITIAL_TENANT_CONTEXT: TenantContext = {
  tenantId: 'tenant-Tilganga-Hospital',
  tenantName: 'Tilganga Institute of Ophthalmology',
  tenantType: 'HOSPITAL_OPTICAL_BUSINESS',
  opticalBusinessId: 'biz-tilganga-optics',
  opticalCentreId: 'centre-gaushala-main',
  opticalCentreName: 'Tilganga Optical Dispensary - Wing A',
  workstationId: 'ws-dispensary-01',
  workstationCode: 'TIO-WS-01',
  staffId: 'staff-optician-01',
  staffRole: 'DISPENSING_OPTICIAN',
  subscriptionStatus: 'ACTIVE',
};

const LENS_OPTIONS = [
  { id: 'lens-1', name: 'Single Vision 1.60 Blue-Cut Anti-Glare', price: 1999 },
  { id: 'lens-2', name: 'Ultra-Thin High Index 1.67 Aspheric', price: 3499 },
  { id: 'lens-3', name: 'Digital Freeform Progressive 1.60', price: 5800 },
  { id: 'lens-4', name: 'Photochromic Transitions Gen-S 1.60', price: 4200 },
  { id: 'lens-0', name: 'Frame Only (No Prescription Lenses)', price: 0 },
];

type WorkflowStage = 'PATIENT' | 'TRIAL' | 'COMFORT' | 'POS' | 'INVOICE';

export function ClinicalWorkstation() {
  const frameLibrary = useFrameLibrary();

  // Instantiate domain services wired to a shared ReliableEventBus (Transactional Outbox)
  const services = useMemo(() => {
    const eventBus = new ReliableEventBus();
    const patientService = new PatientDomainService();
    const catalogService = new CatalogDomainService();
    const inventoryService = new InventoryDomainService(eventBus);
    const trialService = new TrialDomainService(eventBus);
    const posService = new PosDomainService(inventoryService, eventBus);
    const reportingService = new ReportingDomainService(eventBus);
    return {
      eventBus,
      patientService,
      catalogService,
      inventoryService,
      trialService,
      posService,
      reportingService,
    };
  }, []);

  const [ctx] = useState<TenantContext>(INITIAL_TENANT_CONTEXT);
  const [stage, setStage] = useState<WorkflowStage>('PATIENT');
  const [versionTick, setVersionTick] = useState(0);
  const bump = () => setVersionTick((v) => v + 1);

  // Patient state
  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(
    () => services.patientService.searchPatients(INITIAL_TENANT_CONTEXT)[0] ?? null,
  );
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    hospitalPatientId: '',
  });

  // Trial session state
  const [cameraConsent, setCameraConsent] = useState(true);
  const [activeSession, setActiveSession] = useState<TrialSessionRecord | null>(null);
  const [frameSearch, setFrameSearch] = useState('');

  // Physical comfort assessment form state
  const [comfortTargetVariantId, setComfortTargetVariantId] = useState<string>('');
  const [comfortForm, setComfortForm] = useState<{
    noseBridgeFit: PhysicalComfortAssessment['noseBridgeFit'];
    templePressure: PhysicalComfortAssessment['templePressure'];
    frameWidthSuitability: PhysicalComfortAssessment['frameWidthSuitability'];
    weightComfort: ComfortScore;
    stability: ComfortScore;
    overallPreference: ComfortScore;
    staffRecommendation: string;
  }>({
    noseBridgeFit: 'OPTIMAL',
    templePressure: 'COMFORTABLE',
    frameWidthSuitability: 'PROPORTIONAL',
    weightComfort: 5,
    stability: 5,
    overallPreference: 5,
    staffRecommendation: 'Balanced bridge contact; zero temple pressure behind ear.',
  });

  // POS & Invoice state
  const [selectedLensId, setSelectedLensId] = useState<string>(LENS_OPTIONS[0]!.id);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(13);
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'CARD' | 'SPLIT' | 'HOSPITAL_BILLING' | 'ESEWA'
  >('CASH');
  const [depositRatio, setDepositRatio] = useState<1 | 0.5>(1);
  const [completedInvoice, setCompletedInvoice] = useState<ReturnType<
    typeof services.posService.completeAssistedSale
  > | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const patients = useMemo(() => {
    void versionTick;
    return services.patientService.searchPatients(ctx, patientQuery);
  }, [services, ctx, patientQuery, versionTick]);

  const catalogFrames = useMemo(() => {
    void versionTick;
    return services.catalogService.listFrames(ctx, frameSearch);
  }, [services, ctx, frameSearch, versionTick]);

  const centreInventory = useMemo(() => {
    void versionTick;
    return services.inventoryService.listCentreInventory(ctx);
  }, [services, ctx, versionTick]);

  const centreReport = useMemo(() => {
    void versionTick;
    return services.reportingService.getCentreReport(ctx);
  }, [services, ctx, versionTick]);

  const outboxEvents = useMemo(() => {
    void versionTick;
    return services.eventBus.getOutboxSnapshot();
  }, [services, versionTick]);

  const startSessionForPatient = async (patient: PatientRecord | null, anonymous = false) => {
    const corrId = `corr-${Date.now()}`;
    const session = services.trialService.startTrialSession(ctx, {
      patientId: anonymous ? undefined : patient?.id,
      patientName: anonymous
        ? 'Anonymous Walk-In Patient'
        : patient
          ? `${patient.firstName} ${patient.lastName}`
          : 'Walk-In Patient',
      hospitalPatientId: anonymous ? undefined : patient?.hospitalPatientId,
      cameraConsentGranted: cameraConsent,
      correlationId: corrId,
    });
    await services.eventBus.flushOutbox();
    setActiveSession({ ...session });
    setStage('TRIAL');
    setStatusMessage(`Started trial session ${session.sessionCode} on workstation ${ctx.workstationCode}.`);
    bump();
  };

  const handleRegisterPatient = async (e: FormEvent) => {
    e.preventDefault();
    const created = services.patientService.registerPatient(ctx, newPatientForm);
    setSelectedPatient(created);
    setNewPatientForm({ firstName: '', lastName: '', phone: '', hospitalPatientId: '' });
    await startSessionForPatient(created, false);
  };

  const handleShortlistFrame = async (frame: (typeof catalogFrames)[0]) => {
    let current = activeSession;
    const corrId = `corr-${Date.now()}`;
    if (!current) {
      current = services.trialService.startTrialSession(ctx, {
        patientId: selectedPatient?.id,
        patientName: selectedPatient
          ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
          : 'Walk-In Patient',
        hospitalPatientId: selectedPatient?.hospitalPatientId,
        cameraConsentGranted: cameraConsent,
        correlationId: corrId,
      });
    }

    const stockAvail = services.inventoryService.getAvailableQuantity(ctx, frame.variantId);
    const updated = services.trialService.shortlistFrame(
      ctx,
      current.id,
      {
        frameId: frame.id,
        variantId: frame.variantId,
        sku: frame.sku,
        brand: frame.brand,
        name: frame.name,
        color: frame.color,
        size: frame.size,
        frameWidthMm: frame.frameWidthMm,
        bridgeWidthMm: frame.bridgeWidthMm,
        templeLengthMm: frame.templeLengthMm,
        unitPrice: frame.unitPrice,
        stockAvailable: stockAvail,
        isPreferred: true,
        virtualTryOnTested: true,
        physicalTryOnTested: false,
      },
      corrId,
    );
    await services.eventBus.flushOutbox();
    setActiveSession({ ...updated, shortlistedFrames: [...updated.shortlistedFrames] });
    setComfortTargetVariantId(frame.variantId);
    frameLibrary.select(frame.id);
    setStatusMessage(`Shortlisted ${frame.brand} ${frame.name} (${frame.sku}) for physical fitting.`);
    bump();
  };

  const handleRecordComfort = (e: FormEvent) => {
    e.preventDefault();
    if (!activeSession || !comfortTargetVariantId) return;
    const targetFrame = activeSession.shortlistedFrames.find(
      (f) => f.variantId === comfortTargetVariantId,
    );
    if (!targetFrame) return;

    const updated = services.trialService.recordPhysicalComfort(ctx, activeSession.id, {
      frameId: targetFrame.frameId,
      variantId: targetFrame.variantId,
      ...comfortForm,
      recordedByStaffId: ctx.staffId,
      recordedAt: new Date().toISOString(),
    });
    setActiveSession({ ...updated, shortlistedFrames: [...updated.shortlistedFrames] });
    setStatusMessage(
      `Recorded physical comfort check for ${targetFrame.name} (${comfortForm.noseBridgeFit} bridge, ${comfortForm.templePressure} temples).`,
    );
    bump();
  };

  const handleTransferToPos = async (variantId: string) => {
    if (!activeSession) return;
    const corrId = `corr-${globalThis.crypto.randomUUID().slice(0, 8)}`;
    const updated = services.trialService.finalizeSelectionForPos(
      ctx,
      activeSession.id,
      variantId,
      corrId,
    );
    await services.eventBus.flushOutbox();
    setActiveSession({ ...updated, shortlistedFrames: [...updated.shortlistedFrames] });
    setStage('POS');
    setStatusMessage(`Transferred frame selection to Optical POS for checkout.`);
    bump();
  };

  const selectedShortlistFrame = useMemo(() => {
    if (!activeSession) return catalogFrames[0] ?? null;
    const found = activeSession.shortlistedFrames.find(
      (f) => f.variantId === activeSession.selectedFrameVariantId,
    );
    return found ?? activeSession.shortlistedFrames[0] ?? null;
  }, [activeSession, catalogFrames]);

  const selectedLens = useMemo(
    () => LENS_OPTIONS.find((l) => l.id === selectedLensId) ?? LENS_OPTIONS[0]!,
    [selectedLensId],
  );

  const posTotals = useMemo(() => {
    const framePrice = selectedShortlistFrame?.unitPrice ?? 2799;
    const lensPrice = selectedLens.price;
    const subtotal = framePrice + lensPrice;
    const taxable = Math.max(0, subtotal - discountAmount);
    const tax = Math.round((taxable * taxRatePercent) / 100);
    const total = taxable + tax;
    const paid = Math.round(total * depositRatio);
    const balance = Math.max(0, total - paid);
    return { framePrice, lensPrice, subtotal, tax, total, paid, balance };
  }, [selectedShortlistFrame, selectedLens, discountAmount, taxRatePercent, depositRatio]);

  const handleCompletePosSale = async (e: FormEvent) => {
    e.preventDefault();
    const targetVariantId = selectedShortlistFrame?.variantId ?? 'var-ec-air02-blk';
    const targetSku = selectedShortlistFrame?.sku ?? 'EC-AIR02-BLK-M';
    const targetName = selectedShortlistFrame?.name ?? 'Air 02 Beta-Titanium';

    const invoice = services.posService.completeAssistedSale(ctx, {
      trialSessionId: activeSession?.id,
      patientId: selectedPatient?.id,
      patientName:
        activeSession?.patientName ||
        (selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Walk-In Patient'),
      hospitalPatientId: selectedPatient?.hospitalPatientId,
      items: [
        {
          variantId: targetVariantId,
          sku: targetSku,
          productName: targetName,
          quantity: 1,
          frameUnitPrice: posTotals.framePrice,
          lensPackageName: selectedLens.name,
          lensUnitPrice: posTotals.lensPrice,
        },
      ],
      discountAmount,
      taxRatePercent,
      paidAmount: posTotals.paid,
      paymentMethod,
      prescription: selectedPatient?.latestPrescription
        ? {
            odSph: selectedPatient.latestPrescription.odSph,
            odCyl: selectedPatient.latestPrescription.odCyl,
            odAxis: selectedPatient.latestPrescription.odAxis,
            osSph: selectedPatient.latestPrescription.osSph,
            osCyl: selectedPatient.latestPrescription.osCyl,
            osAxis: selectedPatient.latestPrescription.osAxis,
            pdMm: selectedPatient.latestPrescription.pdMm,
          }
        : undefined,
      correlationId: `corr-${Date.now()}`,
    });

    await services.eventBus.flushOutbox();
    setCompletedInvoice(invoice);
    setStage('INVOICE');
    setStatusMessage(
      `Sale completed! Invoice ${invoice.invoiceNumber} generated and stock committed.`,
    );
    bump();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Hospital & Workstation Context Bar */}
      <header className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-600/20 border border-indigo-400/30 px-3 py-1.5 rounded-xl">
            <Laptop className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-indigo-200">
              {ctx.workstationCode}
            </span>
            <span className="size-2 rounded-full bg-emerald-400" title="Workstation Licensed" />
          </div>

          <div className="text-xs">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              {ctx.tenantName}
              <span className="text-slate-400 font-normal">→</span>
              <span className="text-teal-300">{ctx.opticalCentreName}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Staff Role: <span className="text-slate-200 font-semibold">{ctx.staffRole}</span> ·
              Patient:{' '}
              <span className="text-amber-300 font-semibold">
                {activeSession?.patientName ||
                  (selectedPatient
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.hospitalPatientId || 'Walk-in'})`
                    : 'Not selected')}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/admin/microservices"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Microservices Mesh
          </Link>
          <Link
            href="/pos"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Standalone POS
          </Link>
        </div>
      </header>

      {/* Centre Live Metrics & Workflow Stepper */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* 5-Stage Assisted Workflow Stepper */}
        <nav aria-label="Assisted workflow stages" className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'PATIENT', label: '1. Find Patient', icon: UserCheck },
              { id: 'TRIAL', label: '2. Try Frames', icon: Camera },
              { id: 'COMFORT', label: '3. Fit & Comfort', icon: ClipboardCheck },
              { id: 'POS', label: '4. Checkout (POS)', icon: CreditCard },
              { id: 'INVOICE', label: '5. Receipt', icon: Receipt },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = stage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStage(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Live Centre KPIs */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Today&apos;s Sales: </span>
            <strong className="text-slate-900">
              NPR {centreReport.grossRevenue.toLocaleString()}
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Trials: </span>
            <strong className="text-slate-900">{centreReport.trialsStarted}</strong>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            {statusMessage}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-teal-700 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 p-6">
        {/* STAGE 1: PATIENT IDENTIFICATION & CLINICAL RX */}
        {stage === 'PATIENT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Patient Identification &amp; Hospital Lookup
                  </h1>
                  <p className="text-xs text-slate-500">
                    Search by Hospital Patient ID, phone number, or start an anonymous trial session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void startSessionForPatient(null, true)}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold"
                >
                  Start Anonymous Trial →
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Search Hospital ID (e.g. HOSP-99241), patient name, or phone..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-3">
                {patients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {p.firstName} {p.lastName}
                          </span>
                          {p.hospitalPatientId && (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                              {p.hospitalPatientId}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{p.phone}</span>
                        </div>
                        {p.latestPrescription && (
                          <p className="text-xs font-mono text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block">
                            Rx OD: {p.latestPrescription.odSph}/{p.latestPrescription.odCyl}x
                            {p.latestPrescription.odAxis} | OS: {p.latestPrescription.osSph}/
                            {p.latestPrescription.osCyl}x{p.latestPrescription.osAxis} | PD:{' '}
                            {p.latestPrescription.pdMm}mm ({p.latestPrescription.prescribedBy})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(p);
                            void startSessionForPatient(p, false);
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          Assist Patient in Trial <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Walk-In Registration & Camera Consent */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Register Walk-In Hospital Patient
              </h2>

              <form onSubmit={handleRegisterPatient} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientForm.firstName}
                      onChange={(e) =>
                        setNewPatientForm({ ...newPatientForm, firstName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientForm.lastName}
                      onChange={(e) =>
                        setNewPatientForm({ ...newPatientForm, lastName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+977-98..."
                      value={newPatientForm.phone}
                      onChange={(e) =>
                        setNewPatientForm({ ...newPatientForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hospital Patient ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="HOSP-..."
                      value={newPatientForm.hospitalPatientId}
                      onChange={(e) =>
                        setNewPatientForm({
                          ...newPatientForm,
                          hospitalPatientId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cameraConsent}
                    onChange={(e) => setCameraConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-slate-700">
                    <strong>Patient Camera Consent:</strong> Patient consents to local on-device
                    live camera preview. No biometric landmarks or facial images are persisted.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Register Patient &amp; Launch Trial Session
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STAGE 2: LIVE VIRTUAL TRY-ON & FRAME CATALOG SHORTLISTING */}
        {stage === 'TRIAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Cols: Live Stabilized Mirror */}
            <div className="lg:col-span-6 space-y-4">
              <LiveTryOn frame={frameLibrary.selected} />
            </div>

            {/* Right 6 Cols: Centre Frame Catalog & Active Shortlist */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Centre Frame Catalog &amp; Dimensions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Click a frame to preview live on camera and shortlist for physical fitting.
                    </p>
                  </div>
                  {activeSession && activeSession.shortlistedFrames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStage('COMFORT')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      Physical Comfort Check ({activeSession.shortlistedFrames.length}){' '}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={frameSearch}
                    onChange={(e) => setFrameSearch(e.target.value)}
                    placeholder="Scan barcode, SKU, brand, or shape..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catalogFrames.map((frame) => {
                    const stock = services.inventoryService.getAvailableQuantity(
                      ctx,
                      frame.variantId,
                    );
                    const isShortlisted = activeSession?.shortlistedFrames.some(
                      (f) => f.variantId === frame.variantId,
                    );
                    return (
                      <div
                        key={frame.variantId}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isShortlisted
                            ? 'border-indigo-600 bg-indigo-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-2">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-semibold">
                              {frame.sku}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                stock <= 5
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {stock} avail
                            </span>
                          </div>
                          <div className="h-20 bg-slate-50 rounded-lg flex items-center justify-center p-2 mb-2">
                            <Image
                              src={frame.imageUrl}
                              alt={frame.name}
                              width={180}
                              height={70}
                              className="max-h-14 w-auto object-contain"
                              unoptimized
                            />
                          </div>
                          <p className="text-[11px] font-bold text-indigo-600">{frame.brand}</p>
                          <h3 className="text-sm font-bold text-slate-900">{frame.name}</h3>
                          <p className="text-[11px] text-slate-500">
                            {frame.frameWidthMm}mm W · {frame.bridgeWidthMm}mm Bridge ·{' '}
                            {frame.templeLengthMm}mm Temple · {frame.weightGrams}g
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">
                            NPR {frame.unitPrice.toLocaleString()}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => frameLibrary.select(frame.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold"
                            >
                              Try Live
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleShortlistFrame(frame)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                            >
                              {isShortlisted ? 'Shortlisted ✓' : '+ Shortlist'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: PHYSICAL FITTING & COMFORT CHECK */}
        {stage === 'COMFORT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                <strong>Clinical Boundary Notice:</strong> Camera try-on provides a 2D visual
                preview only. Physical nose-bridge contact, temple pressure, and weight distribution
                must be verified on the patient by the dispensing optician below.
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Record Physical Fitting &amp; Comfort
              </h2>

              <form onSubmit={handleRecordComfort} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Shortlisted Frame Being Tested
                  </label>
                  <select
                    value={comfortTargetVariantId}
                    onChange={(e) => setComfortTargetVariantId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {(activeSession?.shortlistedFrames ?? []).map((f) => (
                      <option key={f.variantId} value={f.variantId}>
                        {f.brand} — {f.name} ({f.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nose Bridge Fit
                    </label>
                    <select
                      value={comfortForm.noseBridgeFit}
                      onChange={(e) =>
                        setComfortForm({
                          ...comfortForm,
                          noseBridgeFit: e.target.value as PhysicalComfortAssessment['noseBridgeFit'],
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="OPTIMAL">Optimal</option>
                      <option value="TOO_TIGHT">Too Tight</option>
                      <option value="LOOSE">Loose</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Temple Pressure
                    </label>
                    <select
                      value={comfortForm.templePressure}
                      onChange={(e) =>
                        setComfortForm({
                          ...comfortForm,
                          templePressure:
                            e.target.value as PhysicalComfortAssessment['templePressure'],
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="COMFORTABLE">Comfortable</option>
                      <option value="HIGH_PRESSURE">High Pressure</option>
                      <option value="SLIPPING">Slipping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Frame Width
                    </label>
                    <select
                      value={comfortForm.frameWidthSuitability}
                      onChange={(e) =>
                        setComfortForm({
                          ...comfortForm,
                          frameWidthSuitability:
                            e.target.value as PhysicalComfortAssessment['frameWidthSuitability'],
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="PROPORTIONAL">Proportional</option>
                      <option value="NARROW">Too Narrow</option>
                      <option value="WIDE">Too Wide</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['weightComfort', 'Weight Comfort (1-5)'],
                      ['stability', 'Head Stability (1-5)'],
                      ['overallPreference', 'Patient Rating (1-5)'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label className="block font-semibold text-slate-700 mb-1">{label}</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={comfortForm[field]}
                        onChange={(e) =>
                          setComfortForm({
                            ...comfortForm,
                            [field]: Number(e.target.value) as ComfortScore,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Optician Fitting Recommendation
                  </label>
                  <input
                    type="text"
                    value={comfortForm.staffRecommendation}
                    onChange={(e) =>
                      setComfortForm({ ...comfortForm, staffRecommendation: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Save Physical Comfort Assessment
                </button>
              </form>
            </div>

            {/* Right 7 Cols: Shortlist Comparison & POS Transfer */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Shortlisted Frames Comparison &amp; Final Selection
              </h2>

              {(!activeSession || activeSession.shortlistedFrames.length === 0) ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No frames shortlisted yet. Go to Stage 2 to shortlist frames from the catalog.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSession.shortlistedFrames.map((f) => (
                    <div
                      key={f.variantId}
                      className="p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {f.sku}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            NPR {f.unitPrice.toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {f.brand} — {f.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {f.frameWidthMm}mm Width · {f.bridgeWidthMm}mm Bridge ·{' '}
                          {f.templeLengthMm}mm Temple
                        </p>

                        {f.comfortAssessment ? (
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1 mt-2">
                            <p className="font-bold text-emerald-900 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                              Physical Fit Verified ({f.comfortAssessment.overallPreference}/5)
                            </p>
                            <p className="text-emerald-800">
                              Bridge: {f.comfortAssessment.noseBridgeFit} · Temples:{' '}
                              {f.comfortAssessment.templePressure} · Width:{' '}
                              {f.comfortAssessment.frameWidthSuitability}
                            </p>
                            <p className="text-[11px] text-emerald-700 italic">
                              &ldquo;{f.comfortAssessment.staffRecommendation}&rdquo;
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                            Pending physical comfort assessment
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleTransferToPos(f.variantId)}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        Select Frame &amp; Transfer to POS <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 4: INTEGRATED OPTICAL POS & TRANSACTIONAL STOCK COMMIT */}
        {stage === 'POS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h2 className="text-xl font-bold text-slate-900">
                Optical POS — Frame, Prescription Lenses &amp; Tender
              </h2>

              <form onSubmit={handleCompletePosSale} className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase font-bold text-indigo-600">
                      Selected Frame from Trial Session
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedShortlistFrame?.brand ?? 'Eye-Club Clinical Air'} —{' '}
                      {selectedShortlistFrame?.name ?? 'Air 02 Beta-Titanium'}
                    </p>
                    <p className="font-mono text-slate-500">
                      SKU: {selectedShortlistFrame?.sku ?? 'EC-AIR02-BLK-M'}
                    </p>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    NPR {posTotals.framePrice.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Select Prescription Lens Package
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {LENS_OPTIONS.map((lens) => (
                      <button
                        key={lens.id}
                        type="button"
                        onClick={() => setSelectedLensId(lens.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                          selectedLensId === lens.id
                            ? 'border-indigo-600 bg-indigo-50/60 font-bold'
                            : 'border-slate-200'
                        }`}
                      >
                        <span>{lens.name}</span>
                        <span>+ NPR {lens.price.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Discount (NPR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      VAT / Tax (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={taxRatePercent}
                      onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as
                            | 'CASH'
                            | 'CARD'
                            | 'SPLIT'
                            | 'HOSPITAL_BILLING'
                            | 'ESEWA',
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      <option value="CASH">CASH</option>
                      <option value="CARD">CARD TERMINAL</option>
                      <option value="HOSPITAL_BILLING">HOSPITAL BILLING</option>
                      <option value="SPLIT">SPLIT PAYMENT</option>
                      <option value="ESEWA">ESEWA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDepositRatio(1)}
                    className={`py-2.5 rounded-xl border font-bold ${
                      depositRatio === 1
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    100% Full Payment (NPR {posTotals.total.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositRatio(0.5)}
                    className={`py-2.5 rounded-xl border font-bold ${
                      depositRatio === 0.5
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    50% Lab Deposit (NPR {Math.round(posTotals.total * 0.5).toLocaleString()})
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm"
                >
                  Reserve Stock, Complete POS Sale &amp; Issue Invoice (NPR{' '}
                  {posTotals.paid.toLocaleString()})
                </button>
              </form>
            </div>

            {/* Right 5 Cols: Centre Stock & Live Reservation State */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                Centre-Scoped Inventory ({ctx.opticalCentreName})
              </h3>
              <div className="space-y-2.5">
                {centreInventory.map((item) => (
                  <div
                    key={item.variantId}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900">{item.sku}</p>
                      <p className="text-slate-500">
                        On Hand: {item.onHand} · Reserved: {item.reserved}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold ${
                        item.isLowStock
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {item.available} Available {item.isLowStock ? '(Low Stock)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 5: THERMAL INVOICE & RABBITMQ / OUTBOX EVENT STREAM */}
        {stage === 'INVOICE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Hospital Optical Sales Invoice &amp; Thermal Receipt
                </h2>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Thermal Receipt
                </button>
              </div>

              {completedInvoice ? (
                <div className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 font-mono text-xs space-y-3">
                  <div className="text-center border-b border-dashed border-slate-300 pb-3">
                    <p className="font-bold text-sm">{ctx.tenantName}</p>
                    <p>{ctx.opticalCentreName}</p>
                    <p>Workstation: {ctx.workstationCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p>Invoice #: {completedInvoice.invoiceNumber}</p>
                    <p>Patient: {completedInvoice.patientName}</p>
                    {completedInvoice.hospitalPatientId && (
                      <p>Hospital ID: {completedInvoice.hospitalPatientId}</p>
                    )}
                    <p>Payment Method: {completedInvoice.paymentMethod}</p>
                  </div>
                  <div className="border-y border-dashed border-slate-300 py-2 space-y-1">
                    {completedInvoice.items.map((item) => (
                      <div key={item.variantId}>
                        <div className="flex justify-between font-bold">
                          <span>
                            {item.quantity}x {item.productName} ({item.sku})
                          </span>
                          <span>NPR {item.frameUnitPrice.toLocaleString()}</span>
                        </div>
                        {item.lensPackageName && (
                          <div className="flex justify-between text-slate-600">
                            <span>+ {item.lensPackageName}</span>
                            <span>NPR {item.lensUnitPrice.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>NPR {completedInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>- NPR {completedInvoice.discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT / Tax:</span>
                      <span>NPR {completedInvoice.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                      <span>Total:</span>
                      <span>NPR {completedInvoice.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Paid:</span>
                      <span>NPR {completedInvoice.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Balance Due:</span>
                      <span>NPR {completedInvoice.balanceDue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Complete a sale in Stage 4 to generate an invoice.
                </p>
              )}
            </div>

            {/* Technical Event Log (Collapsible for clean staff UI) */}
            <details className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <summary className="cursor-pointer text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                System Activity Log ({outboxEvents.length} events)
              </summary>
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto mt-4">
                {outboxEvents.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700">{record.event.eventType}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {record.status}
                      </span>
                    </div>
                    <pre className="text-[11px] text-slate-700 overflow-x-auto bg-white p-2 rounded border border-slate-200">
                      {JSON.stringify(record.event.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}

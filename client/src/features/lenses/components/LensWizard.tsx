'use client';

import { useState } from 'react';
import Image from 'next/image';
import { commerceRequest, jsonBody } from '@/lib/commerce-api';
import { useSearchParams } from 'next/navigation';
import { RemoteError } from '@/components/RemoteState';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

type Step = 'TYPE' | 'PACKAGE' | 'PRESCRIPTION' | 'REVIEW';

type LensPackage = { id: string; name: string; price: string | number; features: string[]; isRecommended: boolean };
type LensType = { id: string; name: string; description: string; packages: LensPackage[] };
export function LensWizard({ product, lensTypes }: { product: import('@/features/commerce/ProductDetails').ProductDetail, lensTypes: LensType[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('TYPE');
  
  const [selectedType, setSelectedType] = useState<LensType | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<LensPackage | null>(null);
  const [prescription, setPrescription] = useState({
    odSph: '', odCyl: '', odAxis: '',
    osSph: '', osCyl: '', osAxis: '',
    pd: ''
  });

  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const defaultVariant = product.variants.find((v: { id: string }) => v.id === searchParams.get('variant')) ?? product.variants[0];
  const framePrice = Number(defaultVariant?.price ?? product.discountPrice ?? product.basePrice);

  const calculateTotal = () => {
    let total = framePrice;
    if (selectedPackage) total += Number(selectedPackage.price);
    return total;
  };

  const handleNext = async () => {
    if (step === 'TYPE') setStep('PACKAGE');
    else if (step === 'PACKAGE') setStep('PRESCRIPTION');
    else if (step === 'PRESCRIPTION') setStep('REVIEW');
    else {
      setBusy(true); setError('');
      try {
        let prescriptionId: string | undefined;
        if (selectedPackage && Object.values(prescription).some(Boolean)) {
          const values: Record<string, unknown> = { label: `Lenses for ${product.name}` };
          for (const [key,value] of Object.entries(prescription)) {
            if (!value) continue;
            if (key === 'pd') { values.pdRight = Number(value) / 2; values.pdLeft = Number(value) / 2; }
            else values[key] = Number(value);
          }
          prescriptionId = (await commerceRequest<{ id: string }>('/prescriptions', { method: 'POST', body: jsonBody(values) })).id;
        }
        await commerceRequest('/cart', { method: 'POST', body: jsonBody({ productId: product.id, productVariantId: defaultVariant!.id, quantity: 1, ...(selectedPackage ? { lensPackageId: selectedPackage.id } : {}), ...(prescriptionId ? { prescriptionId } : {}) }) });
        window.dispatchEvent(new Event('cart-updated'));
        router.push('/cart');
      } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
    }
  };

  const handleBack = () => {
    if (step === 'PACKAGE') setStep('TYPE');
    else if (step === 'PRESCRIPTION') setStep('PACKAGE');
    else if (step === 'REVIEW') setStep('PRESCRIPTION');
    else router.back();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {error ? <RemoteError message={error} /> : null}
      {/* Main Wizard Area */}
      <div className="w-full lg:w-2/3 flex flex-col">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          {['TYPE', 'PACKAGE', 'PRESCRIPTION', 'REVIEW'].map((s, idx) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-primary text-white' : 
                (idx < ['TYPE', 'PACKAGE', 'PRESCRIPTION', 'REVIEW'].indexOf(step) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')
              }`}>
                {idx + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-2xl border p-6 min-h-[400px]">
          {step === 'TYPE' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold mb-6">Select Lens Type</h2>
              <div className="grid gap-4">
                {lensTypes.map(lt => (
                  <button 
                    key={lt.id}
                    onClick={() => { setSelectedType(lt); setSelectedPackage(null); }}
                    className={`flex items-start p-5 rounded-xl border-2 text-left transition-colors ${selectedType?.id === lt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{lt.name}</div>
                      <div className="text-muted-foreground text-sm">{lt.description}</div>
                    </div>
                    {selectedType?.id === lt.id && <Check className="w-6 h-6 text-primary" />}
                  </button>
                ))}
                
                <button 
                  onClick={() => { setSelectedType(null); setSelectedPackage(null); setStep('REVIEW'); }}
                  className="flex items-start p-5 rounded-xl border-2 text-left transition-colors border-border hover:border-primary/50 mt-4"
                >
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">Frame Only</div>
                    <div className="text-muted-foreground text-sm">Purchase without any lenses. Includes demo lenses.</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'PACKAGE' && selectedType && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold mb-6">Select Lens Package</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {selectedType.packages.map((pkg: LensPackage) => (
                  <button 
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`flex flex-col p-5 rounded-xl border-2 text-left transition-colors relative ${selectedPackage?.id === pkg.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    {pkg.isRecommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Recommended</span>
                    )}
                    <div className="font-bold text-lg mb-1">{pkg.name}</div>
                    <div className="text-xl font-bold text-primary mb-4">+ NPR {pkg.price}</div>
                    <ul className="space-y-2 mb-4 flex-1">
                      {pkg.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'PRESCRIPTION' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold mb-6">Enter Your Prescription</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-muted-foreground font-medium text-sm">Eye</th>
                      <th className="py-3 px-4 text-muted-foreground font-medium text-sm">SPH</th>
                      <th className="py-3 px-4 text-muted-foreground font-medium text-sm">CYL</th>
                      <th className="py-3 px-4 text-muted-foreground font-medium text-sm">AXIS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-bold text-primary">OD (Right)</td>
                      <td className="py-4 px-4"><input type="text" className="w-full border rounded-md p-2 text-center" placeholder="-2.00" value={prescription.odSph} onChange={e => setPrescription({...prescription, odSph: e.target.value})} /></td>
                      <td className="py-4 px-4"><input type="text" className="w-full border rounded-md p-2 text-center" placeholder="-0.50" value={prescription.odCyl} onChange={e => setPrescription({...prescription, odCyl: e.target.value})} /></td>
                      <td className="py-4 px-4"><input type="text" className="w-full border rounded-md p-2 text-center" placeholder="180" value={prescription.odAxis} onChange={e => setPrescription({...prescription, odAxis: e.target.value})} /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-bold text-primary">OS (Left)</td>
                      <td className="py-4 px-4"><input type="text" className="w-full border rounded-md p-2 text-center" placeholder="-2.25" value={prescription.osSph} onChange={e => setPrescription({...prescription, osSph: e.target.value})} /></td>
                      <td className="py-4 px-4"><input type="text" className="w-full border rounded-md p-2 text-center" placeholder="-0.75" value={prescription.osCyl} onChange={e => setPrescription({...prescription, osCyl: e.target.value})} /></td>
                      <td className="py-4 px-4"><input type="text" className="w-full border rounded-md p-2 text-center" placeholder="175" value={prescription.osAxis} onChange={e => setPrescription({...prescription, osAxis: e.target.value})} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 max-w-xs">
                <label className="block text-sm font-medium mb-2">Pupillary Distance (PD)</label>
                <input type="text" className="w-full border rounded-md p-3" placeholder="e.g., 62" value={prescription.pd} onChange={e => setPrescription({...prescription, pd: e.target.value})} />
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">Our optometrists will review your prescription before processing the order to ensure perfect vision.</p>
              </div>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold mb-6">Review Configuration</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center py-4 border-b">
                  <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-muted-foreground text-sm">Color: {defaultVariant?.color}</p>
                  </div>
                  <span className="font-bold">NPR {framePrice}</span>
                </div>
                
                {selectedType ? (
                  <>
                    <div className="flex justify-between items-center py-4 border-b">
                      <div>
                        <h3 className="font-bold">Lens Type</h3>
                        <p className="text-muted-foreground text-sm">{selectedType.name}</p>
                      </div>
                      <span className="font-bold">Included</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b">
                      <div>
                        <h3 className="font-bold">Lens Package</h3>
                        <p className="text-muted-foreground text-sm">{selectedPackage?.name}</p>
                      </div>
                      <span className="font-bold">NPR {selectedPackage?.price}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center py-4 border-b">
                    <div>
                      <h3 className="font-bold">Lens Type</h3>
                      <p className="text-muted-foreground text-sm">Frame Only</p>
                    </div>
                    <span className="font-bold">NPR 0</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-4 text-xl">
                  <h3 className="font-bold text-primary">Total</h3>
                  <span className="font-bold text-primary">NPR {calculateTotal()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between mt-6">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          
          <button 
            onClick={handleNext}
            disabled={busy || (step === 'TYPE' && !selectedType) || (step === 'PACKAGE' && !selectedPackage)}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'REVIEW' ? 'Add to Cart' : 'Continue'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="w-full lg:w-1/3">
        <div className="bg-muted/30 rounded-2xl p-6 sticky top-24 border border-border/50">
          <h3 className="font-bold text-lg mb-6">Your Selection</h3>
          
          <div className="flex gap-4 mb-6">
            <div className="w-20 h-20 rounded-xl bg-white border flex items-center justify-center overflow-hidden relative">
              {defaultVariant?.images[0] && (
                <Image src={defaultVariant?.images[0].url} alt={product.name} fill className="object-cover" />
              )}
            </div>
            <div>
              <h4 className="font-bold">{product.name}</h4>
              <p className="text-sm text-muted-foreground">{defaultVariant?.color}</p>
              <p className="text-sm font-medium mt-1">NPR {framePrice}</p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            {selectedType && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lenses: {selectedType.name}</span>
                <span>Included</span>
              </div>
            )}
            {selectedPackage && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Package: {selectedPackage.name}</span>
                <span>+ NPR {selectedPackage.price}</span>
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">NPR {calculateTotal()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

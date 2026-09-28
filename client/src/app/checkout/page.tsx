'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Truck, CreditCard, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const [step, setStep] = useState<'ADDRESS' | 'PAYMENT' | 'SUCCESS'>('ADDRESS');

  if (step === 'SUCCESS') {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          Thank you for choosing Eye-Club. Your order #EC-10928 has been confirmed. You will receive an email confirmation shortly.
        </p>
        <Link href="/account/orders" className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors">
          View Order Status
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-2/3">
          
          <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step === 'ADDRESS' ? 'bg-primary' : 'bg-green-500'}`}>1</span>
                Shipping Address
              </h2>
              {step === 'PAYMENT' && <button onClick={() => setStep('ADDRESS')} className="text-sm text-primary underline">Edit</button>}
            </div>

            {step === 'ADDRESS' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input type="text" className="w-full border rounded-lg p-3" placeholder="John" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input type="text" className="w-full border rounded-lg p-3" placeholder="Doe" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <input type="text" className="w-full border rounded-lg p-3" placeholder="123 Main St" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input type="text" className="w-full border rounded-lg p-3" placeholder="Kathmandu" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input type="text" className="w-full border rounded-lg p-3" placeholder="+977-9800000000" />
                </div>
                <div className="col-span-2 mt-4">
                  <button onClick={() => setStep('PAYMENT')} className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors">
                    Continue to Payment
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                John Doe<br/>
                123 Main St<br/>
                Kathmandu, Nepal<br/>
                +977-9800000000
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'PAYMENT' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>2</span>
                Payment Method
              </h2>
            </div>
            
            {step === 'PAYMENT' && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border-2 border-primary bg-primary/5 rounded-xl cursor-pointer">
                  <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <div className="font-bold">Credit / Debit Card</div>
                    <div className="text-sm text-muted-foreground">Secure payment via Stripe</div>
                  </div>
                  <CreditCard className="w-6 h-6 text-primary" />
                </label>
                
                <label className="flex items-center gap-3 p-4 border-2 border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input type="radio" name="payment" className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <div className="font-bold">eSewa / Khalti</div>
                    <div className="text-sm text-muted-foreground">Digital Wallet</div>
                  </div>
                </label>

                <div className="mt-6 pt-6 border-t">
                  <div className="p-4 bg-gray-50 rounded-xl mb-6 space-y-4 border">
                    <input type="text" className="w-full border rounded-lg p-3 bg-white" placeholder="Card Number" />
                    <div className="flex gap-4">
                      <input type="text" className="w-1/2 border rounded-lg p-3 bg-white" placeholder="MM/YY" />
                      <input type="text" className="w-1/2 border rounded-lg p-3 bg-white" placeholder="CVC" />
                    </div>
                  </div>
                  
                  <button onClick={() => setStep('SUCCESS')} className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors flex justify-center items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Pay NPR 6,298
                  </button>
                </div>
              </div>
            )}
            
            {step === 'ADDRESS' && (
              <div className="text-sm text-muted-foreground italic">
                Please complete shipping address first.
              </div>
            )}
          </div>
          
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-muted/30 border rounded-2xl p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4 border-b pb-4">Order Summary</h3>
            
            <div className="flex gap-4 mb-6">
              <div className="w-16 h-16 rounded-lg bg-white border relative overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800" alt="Frame" fill className="object-cover" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-bold">Eye-Club Air 02</p>
                <p className="text-muted-foreground">Matte Black • Single Vision</p>
                <p className="font-medium mt-1">NPR 6,298</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>NPR 6,298</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Free</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xl font-bold text-primary">
              <span>Total</span>
              <span>NPR 6,298</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

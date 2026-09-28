'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';

// Using mock data for UI demonstration purposes
const MOCK_CART = [
  {
    id: 'cart-1',
    product: {
      name: 'Eye-Club Air 02',
      variant: 'Matte Black • Medium',
      image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800'
    },
    lens: {
      type: 'Single Vision',
      package: 'Premium Package'
    },
    price: 6298, // 2799 frame + 3499 lenses
    quantity: 1
  }
];

export default function CartPage() {
  const [items, setItems] = useState(MOCK_CART);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 200;
  const total = subtotal + shipping;

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const handleRemove = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Trash2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/eyeglasses" className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {items.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 border rounded-2xl bg-white shadow-sm">
              <div className="w-full sm:w-32 aspect-square rounded-xl bg-muted relative overflow-hidden shrink-0">
                <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product.variant}</p>
                    {item.lens && (
                      <div className="mt-2 text-sm">
                        <p><span className="font-medium">Lens:</span> {item.lens.type}</p>
                        <p><span className="font-medium">Package:</span> {item.lens.package}</p>
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-lg">
                    NPR {item.price.toLocaleString('en-NP')}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-4 bg-muted rounded-lg p-1">
                    <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 hover:bg-background rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 hover:bg-background rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  
                  <button onClick={() => handleRemove(item.id)} className="text-sm text-red-500 font-medium hover:underline flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="p-4 bg-blue-50 text-blue-800 rounded-xl flex gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <p>Your prescription will be verified by our optometrist before production begins.</p>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="border rounded-2xl p-6 bg-white shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 pb-6 border-b">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>NPR {subtotal.toLocaleString('en-NP')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `NPR ${shipping}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xl font-bold mb-8 text-primary">
              <span>Total</span>
              <span>NPR {total.toLocaleString('en-NP')}</span>
            </div>

            <Link href="/checkout" className="w-full flex justify-center py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors">
              Proceed to Checkout
            </Link>
            
            <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Free shipping on orders over NPR 5,000</div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Secure 256-bit SSL encryption</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

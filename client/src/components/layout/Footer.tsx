import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-foreground">About Eye-Club</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/eyeglasses" className="hover:text-primary">Shop Eyeglasses</Link></li>
              <li><Link href="/sunglasses" className="hover:text-primary">Shop Sunglasses</Link></li>
              <li><Link href="/stores" className="hover:text-primary">Store Locator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Customer Support</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/stores" className="hover:text-primary">Store Contacts</Link></li>
              <li><Link href="/account/orders" className="hover:text-primary">Track Your Orders</Link></li>
              <li><Link href="/account" className="hover:text-primary">Your Account</Link></li>
              <li><Link href="/book-exam" className="hover:text-primary">Book an Appointment</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Eye Care</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/book-exam" className="hover:text-primary">Book Eye Test</Link></li>
              <li><Link href="/account/prescriptions" className="hover:text-primary">Your Prescriptions</Link></li>
              <li><Link href="/try-on" className="hover:text-primary">Virtual Try-On</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Your Experience</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/try-on#privacy" className="hover:text-primary">Try-On Privacy</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary">Saved Frames</Link></li>
              <li><Link href="/pos" className="hover:text-primary font-medium text-indigo-600">Optical POS</Link></li>
              <li><Link href="/admin/vendors" className="hover:text-primary">SaaS Vendors</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Eye-Club. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>See Better. Look Better.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

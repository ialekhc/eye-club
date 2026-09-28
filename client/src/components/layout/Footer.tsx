import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-foreground">About Eye-Club</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary">Our Story</Link></li>
              <li><Link href="/careers" className="hover:text-primary">Careers</Link></li>
              <li><Link href="/stores" className="hover:text-primary">Store Locator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Customer Support</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-primary">Shipping Information</Link></li>
              <li><Link href="/returns" className="hover:text-primary">Returns & Exchanges</Link></li>
              <li><Link href="/faq" className="hover:text-primary">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Eye Care</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/book-eye-test" className="hover:text-primary">Book Eye Test</Link></li>
              <li><Link href="/prescription-guide" className="hover:text-primary">Prescription Guide</Link></li>
              <li><Link href="/lens-guide" className="hover:text-primary">Lens Guide</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
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

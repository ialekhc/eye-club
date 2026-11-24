import Link from "next/link";
import { Eye } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#EAECF0] bg-white">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] mb-4">
              Shop Frames
            </h3>
            <ul className="space-y-2.5 text-sm text-[#475467]">
              <li><Link href="/eyeglasses" className="hover:text-[#101828] transition-colors">Eyeglasses</Link></li>
              <li><Link href="/sunglasses" className="hover:text-[#101828] transition-colors">Sunglasses</Link></li>
              <li><Link href="/stores" className="hover:text-[#101828] transition-colors">Store Locator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] mb-4">
              Customer Care
            </h3>
            <ul className="space-y-2.5 text-sm text-[#475467]">
              <li><Link href="/account/orders" className="hover:text-[#101828] transition-colors">Track Your Orders</Link></li>
              <li><Link href="/account" className="hover:text-[#101828] transition-colors">Your Account</Link></li>
              <li><Link href="/book-exam" className="hover:text-[#101828] transition-colors">Book an Appointment</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] mb-4">
              Virtual Try-On
            </h3>
            <ul className="space-y-2.5 text-sm text-[#475467]">
              <li><Link href="/try-on" className="hover:text-[#101828] transition-colors">Open Try-On Mirror</Link></li>
              <li><Link href="/account/prescriptions" className="hover:text-[#101828] transition-colors">Your Prescriptions</Link></li>
              <li><Link href="/try-on#privacy" className="hover:text-[#101828] transition-colors">Try-On Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] mb-4">
              Staff &amp; Retail
            </h3>
            <ul className="space-y-2.5 text-sm text-[#475467]">
              <li><Link href="/workstation" className="font-medium text-teal-700 hover:underline">Clinical Workstation</Link></li>
              <li><Link href="/pos" className="font-medium text-teal-700 hover:underline">Optical POS</Link></li>
              <li><Link href="/admin/vendors" className="hover:text-[#101828] transition-colors">SaaS Vendors</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#EAECF0] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#667085]">
          <div className="flex items-center gap-2 font-semibold text-[#101828]">
            <Eye className="w-4 h-4 text-teal-700" />
            <span>Eye-Club Optical SaaS</span>
          </div>
          <p>© {new Date().getFullYear()} Eye-Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

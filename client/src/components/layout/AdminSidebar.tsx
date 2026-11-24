'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  Box,
  Users,
  Settings,
  LogOut,
  Building2,
  MonitorSmartphone,
  Network,
} from 'lucide-react';
import { Badge } from '@eyewear/ui';

export function AdminSidebar({ currentPath }: { currentPath: string }) {
  const links = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Frames & Photos', href: '/admin/catalog', icon: Box },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'POS Counter', href: '/pos', icon: MonitorSmartphone },
    { name: 'Workstation', href: '/workstation', icon: MonitorSmartphone },
    { name: 'Vendors & Stores', href: '/admin/vendors', icon: Building2 },
    { name: 'Analytics', href: '/admin/analytics', icon: Users },
    { name: 'Widget Setup', href: '/admin/widget', icon: Settings },
    { name: 'System Services', href: '/admin/microservices', icon: Network },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:min-h-[calc(100vh-64px)] border-r border-[#EAECF0] bg-white flex flex-col p-4">
      <div className="mb-6 rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#101828]">Admin Workspace</h2>
          <Badge variant="default">SaaS</Badge>
        </div>
        <p className="mt-0.5 text-xs text-[#667085]">Eye-Club Operations</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1" aria-label="Admin sidebar">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-[#344054] hover:bg-[#F9FAFB] hover:text-[#101828]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-[#667085]'}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-[#EAECF0]">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

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
    <aside className="w-full lg:w-64 shrink-0 h-[calc(100vh-80px)] sticky top-20 bg-slate-900 text-slate-300 flex flex-col p-4">
      <div className="mb-8 p-4 bg-slate-800 rounded-xl">
        <h2 className="text-white font-bold text-lg mb-1">Admin Portal</h2>
        <p className="text-xs text-slate-400">Eye-Club Operations</p>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-500 text-white font-medium shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      
      <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-4 py-3 mt-4 text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-left w-full">
        <LogOut className="w-5 h-5" />
        Exit Admin
      </button>
    </aside>
  );
}

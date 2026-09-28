import Link from 'next/link';
import { User, ShoppingBag, FileText, Settings, LogOut } from 'lucide-react';

export function AccountSidebar({ currentPath }: { currentPath: string }) {
  const links = [
    { name: 'Profile', href: '/account', icon: User },
    { name: 'My Orders', href: '/account/orders', icon: ShoppingBag },
    { name: 'Prescriptions', href: '/account/prescriptions', icon: FileText },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white rounded-2xl border p-4 shadow-sm sticky top-24">
        <div className="flex items-center gap-4 mb-8 p-2">
          <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
            JD
          </div>
          <div>
            <h3 className="font-bold">John Doe</h3>
            <p className="text-xs text-muted-foreground">john@example.com</p>
          </div>
        </div>
        
        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          
          <button className="flex items-center gap-3 px-4 py-3 mt-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left w-full">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </nav>
      </div>
    </aside>
  );
}

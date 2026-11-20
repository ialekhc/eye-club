'use client';

import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { usePathname } from "next/navigation";

export function AccountShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="bg-muted/10 min-h-[calc(100vh-80px)] py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar currentPath={pathname} />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { usePathname } from "next/navigation";

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50">
      <AdminSidebar currentPath={pathname} />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

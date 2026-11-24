'use client';

import Link from 'next/link';
import { Box, Building2, MonitorSmartphone, ShoppingCart } from 'lucide-react';
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@eyewear/ui';
import { useResource } from '@/lib/use-resource';
import { money } from '@/lib/commerce-api';
import { RemoteError } from '@/components/RemoteState';

type Stats = {
  metrics: { totalOrders: number; totalProducts: number; totalUsers: number; revenue: number };
  recentOrders: Array<{ id: string; orderNumber: string; status: string; totalAmount: string }>;
};

export default function AdminPage() {
  const { data, error, loading, reload } = useResource<Stats>('/admin/dashboard');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828]">Store Overview</h1>
        <p className="text-sm text-[#475467] mt-1">
          Simple shortcuts to manage frames, photos, orders, and in-store sales.
        </p>
      </div>

      {/* Untitled UI Quick-Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: '/admin/catalog',
            icon: Box,
            title: 'Frames & Photos',
            desc: 'Add new frames, upload photos, and set stock.',
          },
          {
            href: '/pos',
            icon: MonitorSmartphone,
            title: 'Open POS Counter',
            desc: 'Create in-store sales and print receipts.',
          },
          {
            href: '/workstation',
            icon: ShoppingCart,
            title: 'Patient Workstation',
            desc: 'Guide a patient from try-on to checkout.',
          },
          {
            href: '/admin/vendors',
            icon: Building2,
            title: 'Vendors & Stores',
            desc: 'Manage optical branches and staff accounts.',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="h-full transition-all group-hover:border-teal-300 group-hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#EAECF0] bg-[#F9FAFB] text-teal-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-semibold text-[#101828] text-sm">{item.title}</h2>
                  <p className="text-xs text-[#667085] mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {error ? <RemoteError message={error} retry={reload} /> : null}
      {loading ? <p className="text-sm text-[#667085]">Loading store summary…</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Total Orders', data.metrics.totalOrders],
              ['Total Frames', data.metrics.totalProducts],
              ['Users & Staff', data.metrics.totalUsers],
              ['Collected Revenue', money(data.metrics.revenue)],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-[#475467]">{label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-[#101828] tabular-nums">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#101828]">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-semibold text-teal-700 hover:underline">
                View all orders
              </Link>
            </div>
            {data.recentOrders.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold">{order.orderNumber}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {money(order.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-[#667085]">No orders yet.</CardContent>
              </Card>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

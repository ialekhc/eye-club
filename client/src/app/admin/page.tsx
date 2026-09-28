import { ArrowUpRight, ShoppingCart, Box, Users, DollarSign } from 'lucide-react';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Revenue', value: 'NPR 1,245,000', change: '+12%', icon: DollarSign },
    { label: 'Total Orders', value: '342', change: '+5%', icon: ShoppingCart },
    { label: 'Total Products', value: '1,204', change: '+1%', icon: Box },
    { label: 'Total Users', value: '4,092', change: '+8%', icon: Users },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change} <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-900">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b last:border-0">
                  <td className="py-4 font-medium">ORD-10928</td>
                  <td className="py-4 text-slate-600">John Doe</td>
                  <td className="py-4 text-slate-600">Oct 12, 2026</td>
                  <td className="py-4 font-medium">NPR 6,298</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold">PENDING</span>
                  </td>
                </tr>
                <tr className="border-b last:border-0">
                  <td className="py-4 font-medium">ORD-10927</td>
                  <td className="py-4 text-slate-600">Jane Smith</td>
                  <td className="py-4 text-slate-600">Oct 11, 2026</td>
                  <td className="py-4 font-medium">NPR 12,500</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">SHIPPED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-900">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <button className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-sm font-medium text-left transition-colors">
              Add New Product
            </button>
            <button className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-sm font-medium text-left transition-colors">
              Process Pending Orders
            </button>
            <button className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-sm font-medium text-left transition-colors">
              Manage Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Search, Filter } from 'lucide-react';

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search orders..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button className="p-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-slate-500 text-sm border-b">
                <th className="py-4 px-6 font-medium">Order ID</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium">Customer</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Total</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium">ORD-1092{i}</td>
                  <td className="py-4 px-6 text-slate-600">Oct 12, 2026</td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">John Doe</div>
                    <div className="text-xs text-slate-500">john@example.com</div>
                  </td>
                  <td className="py-4 px-6">
                    <select className="border rounded-md px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 border-yellow-200 outline-none">
                      <option>PENDING PAYMENT</option>
                      <option>ORDER PLACED</option>
                      <option>LENS PROCESSING</option>
                      <option>SHIPPED</option>
                      <option>DELIVERED</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 font-medium">NPR 6,298</td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-indigo-600 hover:underline font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center text-sm text-slate-500">
          <span>Showing 1 to 5 of 342 orders</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border rounded bg-white hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

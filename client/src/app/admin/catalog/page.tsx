import { Search, Plus, Filter } from 'lucide-react';
import Image from 'next/image';

export default function AdminCatalogPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Catalog</h1>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search products..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button className="p-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-slate-500 text-sm border-b">
                <th className="py-4 px-6 font-medium">Product</th>
                <th className="py-4 px-6 font-medium">Category</th>
                <th className="py-4 px-6 font-medium">Price</th>
                <th className="py-4 px-6 font-medium">Inventory</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg relative overflow-hidden shrink-0">
                        <Image src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=200" alt="Frame" fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Eye-Club Air 02</div>
                        <div className="text-xs text-slate-500">EC-AIR-02</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">Eyeglasses</td>
                  <td className="py-4 px-6 font-medium">NPR 2,799</td>
                  <td className="py-4 px-6">
                    <span className="text-green-600 font-medium">124 in stock</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">PUBLISHED</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-indigo-600 hover:underline font-medium mr-3">Edit</button>
                    <button className="text-red-500 hover:underline font-medium">Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center text-sm text-slate-500">
          <span>Showing 1 to 5 of 1,204 products</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border rounded bg-white hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';

const MOCK_ORDERS = [
  {
    id: 'ORD-10928',
    date: 'Oct 12, 2026',
    status: 'SHIPPED',
    total: 6298,
    items: [
      { name: 'Eye-Club Air 02', variant: 'Matte Black', qty: 1 }
    ]
  },
  {
    id: 'ORD-10744',
    date: 'Aug 04, 2026',
    status: 'DELIVERED',
    total: 15500,
    items: [
      { name: 'Ray-Ban Aviator Classic', variant: 'Gold / Green', qty: 1 }
    ]
  }
];

export default function AccountOrdersPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>
      
      {MOCK_ORDERS.length > 0 ? (
        <div className="flex flex-col gap-4">
          {MOCK_ORDERS.map(order => (
            <div key={order.id} className="border rounded-xl p-5 hover:border-primary/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b">
                <div>
                  <h3 className="font-bold text-lg mb-1">{order.id}</h3>
                  <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <p className="font-bold">NPR {order.total.toLocaleString('en-NP')}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">({item.variant}) x{item.qty}</span>
                    </div>
                  ))}
                </div>
                
                <button className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
          <Link href="/eyeglasses" className="text-primary font-medium hover:underline">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}

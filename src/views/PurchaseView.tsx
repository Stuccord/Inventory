import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PurchaseView({ onUpdate }: any) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPurchases(data as any);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          New Purchase Order
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-600">Loading purchase orders...</p>
      ) : purchases.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No purchase orders yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((po: any) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{po.po_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{po.suppliers?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(po.order_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      po.status === 'received' ? 'bg-green-100 text-green-800' :
                      po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">${Number(po.total_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

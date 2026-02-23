import { useState, useEffect } from 'react';
import { Plus, Search, Check, X, AlertCircle } from 'lucide-react';
import { supabase, Return, Order, ReturnItem } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function ReturnsView({ onUpdate }: { onUpdate: () => void }) {
  const { profile, isAdmin, isManager } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    order_id: '',
    return_type: 'full',
    return_reason: '',
    restock: true,
    notes: '',
  });
  const [returnItems, setReturnItems] = useState<Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    condition: 'good' | 'damaged' | 'expired';
    restock: boolean;
  }>>([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);

  useEffect(() => {
    loadReturns();
    loadOrders();
  }, []);

  const loadReturns = async () => {
    const { data } = await supabase
      .from('returns')
      .select('*, orders(customer_name, order_number)')
      .order('created_at', { ascending: false });

    if (data) setReturns(data as any);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('order_status', 'completed')
      .order('order_date', { ascending: false });

    if (data) setOrders(data);
  };

  const loadOrderItems = async (orderId: string) => {
    const { data } = await supabase
      .from('order_items')
      .select('*, products(*)')
      .eq('order_id', orderId);

    if (data) {
      setSelectedOrderItems(data);
      setReturnItems(data.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        condition: 'good',
        restock: true,
      })));
    }
  };

  const generateReturnNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RET-${year}${month}${random}`;
  };

  const updateReturnItem = (index: number, field: string, value: any) => {
    const updated = [...returnItems];
    updated[index] = { ...updated[index], [field]: value };
    setReturnItems(updated);
  };

  const calculateRefund = () => {
    return returnItems.reduce((sum, item) =>
      sum + (item.unit_price * item.quantity), 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.order_id || returnItems.length === 0) {
      alert('Please select an order and items to return');
      return;
    }

    const refundAmount = calculateRefund();

    const { data: returnRecord, error: returnError } = await supabase
      .from('returns')
      .insert({
        return_number: generateReturnNumber(),
        order_id: formData.order_id,
        return_date: new Date().toISOString().split('T')[0],
        return_type: formData.return_type,
        return_reason: formData.return_reason,
        refund_amount: refundAmount,
        restock: formData.restock,
        status: 'pending',
        notes: formData.notes,
        processed_by: profile?.id,
      })
      .select()
      .single();

    if (returnError || !returnRecord) {
      alert('Error creating return');
      return;
    }

    for (const item of returnItems) {
      const orderItem = selectedOrderItems.find((oi: any) => oi.product_id === item.product_id);

      await supabase.from('return_items').insert({
        return_id: returnRecord.id,
        product_id: item.product_id,
        order_item_id: orderItem?.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        condition: item.condition,
        restock: item.restock,
      });
    }

    await supabase.from('audit_logs').insert({
      user_id: profile?.id,
      action: 'create',
      entity_type: 'return',
      entity_id: returnRecord.id,
      new_values: returnRecord,
    });

    setShowForm(false);
    resetForm();
    loadReturns();
    onUpdate();
  };

  const approveReturn = async (returnId: string) => {
    await supabase
      .from('returns')
      .update({
        status: 'approved',
        approved_by: profile?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', returnId);

    await supabase.rpc('process_return', {
      return_id_param: returnId,
      processor_id_param: profile?.id
    });

    await supabase.from('audit_logs').insert({
      user_id: profile?.id,
      action: 'approve',
      entity_type: 'return',
      entity_id: returnId,
    });

    loadReturns();
    onUpdate();
  };

  const rejectReturn = async (returnId: string) => {
    await supabase
      .from('returns')
      .update({ status: 'rejected', approved_by: profile?.id })
      .eq('id', returnId);

    await supabase.from('audit_logs').insert({
      user_id: profile?.id,
      action: 'reject',
      entity_type: 'return',
      entity_id: returnId,
    });

    loadReturns();
  };

  const resetForm = () => {
    setFormData({
      order_id: '',
      return_type: 'full',
      return_reason: '',
      restock: true,
      notes: '',
    });
    setReturnItems([]);
    setSelectedOrderItems([]);
  };

  const filteredReturns = returns.filter(ret => {
    const searchLower = searchTerm.toLowerCase();
    const customerName = (ret as any).orders?.customer_name || '';
    return (
      ret.return_number.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Order Returns</h1>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span>Process Return</span>
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by return number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Type</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Reason</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ret.return_number}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                    {new Date(ret.return_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize hidden md:table-cell">
                    {ret.return_type}
                  </td>
                  <td className="px-3 md:px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                    {ret.return_reason}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ¢{Number(ret.refund_amount).toFixed(2)}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ret.status === 'completed' ? 'bg-green-100 text-green-800' :
                      ret.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      ret.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm">
                    {ret.status === 'pending' && (isAdmin || isManager) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveReturn(ret.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => rejectReturn(ret.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Process Return</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Order *
                  </label>
                  <select
                    value={formData.order_id}
                    onChange={(e) => {
                      setFormData({ ...formData, order_id: e.target.value });
                      loadOrderItems(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Choose an order...</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.order_number} - {order.customer_name} (¢{Number(order.total_amount).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Type *
                  </label>
                  <select
                    value={formData.return_type}
                    onChange={(e) => setFormData({ ...formData, return_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="full">Full Return</option>
                    <option value="partial">Partial Return</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Reason *
                </label>
                <textarea
                  value={formData.return_reason}
                  onChange={(e) => setFormData({ ...formData, return_reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>

              {selectedOrderItems.length > 0 && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Return Items</h3>
                  <div className="space-y-3">
                    {returnItems.map((item, index) => {
                      const orderItem = selectedOrderItems[index];
                      return (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center border border-gray-200 rounded-lg p-3">
                          <div className="col-span-4">
                            <p className="text-sm font-medium text-gray-900">
                              {orderItem?.products?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Original Qty: {orderItem?.quantity}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Return Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={orderItem?.quantity}
                              value={item.quantity}
                              onChange={(e) => updateReturnItem(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Condition
                            </label>
                            <select
                              value={item.condition}
                              onChange={(e) => updateReturnItem(index, 'condition', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="good">Good</option>
                              <option value="damaged">Damaged</option>
                              <option value="expired">Expired</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={item.restock}
                                onChange={(e) => updateReturnItem(index, 'restock', e.target.checked)}
                                className="mr-2"
                              />
                              Restock
                            </label>
                          </div>
                          <div className="col-span-2 text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ¢{(item.unit_price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <div className="bg-gray-50 rounded-lg p-4 w-64">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Refund:</span>
                        <span>¢{calculateRefund().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Return Policy Reminder</p>
                  <p>Items marked as "Good" condition and "Restock" enabled will be added back to inventory. Damaged or expired items will be logged but not restocked.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                >
                  Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

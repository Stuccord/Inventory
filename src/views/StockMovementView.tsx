import { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';
import { supabase, ProductWithDetails, InventoryTransactionWithDetails } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function StockMovementView({ onUpdate }: { onUpdate: () => void }) {
  const { profile } = useAuth();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransactionWithDetails[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [productsRes, transactionsRes] = await Promise.all([
      supabase.from('products').select('*, categories(*)').eq('is_active', true).order('name'),
      supabase
        .from('inventory_transactions')
        .select('*, products(*), user_profiles(*)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (productsRes.data) setProducts(productsRes.data as any[]);
    if (transactionsRes.data) setTransactions(transactionsRes.data as any[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity);
    const newStock = type === 'in'
      ? product.current_stock + qty
      : product.current_stock - qty;

    if (newStock < 0) {
      alert('Insufficient stock!');
      return;
    }

    await supabase.from('products').update({ current_stock: newStock }).eq('id', selectedProduct);

    await supabase.from('inventory_transactions').insert({
      product_id: selectedProduct,
      transaction_type: 'adjustment',
      quantity: type === 'in' ? qty : -qty,
      previous_stock: product.current_stock,
      new_stock: newStock,
      reference_type: type === 'in' ? 'stock_in' : 'stock_out',
      notes,
      created_by: profile?.id,
    });

    setSelectedProduct('');
    setQuantity('');
    setNotes('');
    loadData();
    onUpdate();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Movement</h1>
        <p className="text-gray-600">Quick stock in/out recording</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Record Movement</h2>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setType('in')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition ${
                type === 'in'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowDownCircle size={20} />
              Stock In
            </button>
            <button
              onClick={() => setType('out')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition ${
                type === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowUpCircle size={20} />
              Stock Out
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
              <select
                required
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Current: {product.current_stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional notes..."
              />
            </div>

            <button
              type="submit"
              className={`w-full px-4 py-3 text-white rounded-lg font-medium transition ${
                type === 'in'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Record {type === 'in' ? 'Stock In' : 'Stock Out'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center gap-2">
            <History size={20} className="text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Recent Movements</h2>
          </div>

          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {transactions.map((trans) => (
              <div key={trans.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {(trans as any).products?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {trans.previous_stock} → {trans.new_stock}
                    </p>
                    {trans.notes && (
                      <p className="text-sm text-gray-500 mt-1">{trans.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(trans.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trans.quantity > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {trans.quantity > 0 ? '+' : ''}{trans.quantity}
                  </div>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No recent movements</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

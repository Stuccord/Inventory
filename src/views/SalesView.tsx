import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, X, Trash2 } from 'lucide-react';
import { supabase, ProductWithDetails, SaleWithDetails } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface SalesViewProps {
  onUpdate: () => void;
}

export default function SalesView({ onUpdate }: SalesViewProps) {
  const { profile } = useAuth();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [salesRes, productsRes] = await Promise.all([
      supabase.from('sales').select('*, user_profiles(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('*, categories(*), suppliers(*)').eq('is_active', true).gt('current_stock', 0).order('name'),
    ]);

    if (salesRes.data) setSales(salesRes.data as any[]);
    if (productsRes.data) setProducts(productsRes.data as any[]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sales</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            New Sale
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-8 text-gray-600">Loading sales...</p>
          ) : sales.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No sales yet</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sale.sale_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sale.customer_name || 'Walk-in'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">¢{Number(sale.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">¢{Number(sale.discount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">¢{Number(sale.tax).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">¢{Number(sale.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{sale.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <SaleFormModal
          products={products}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            loadData();
            onUpdate();
          }}
          userId={profile?.id || ''}
        />
      )}
    </div>
  );
}

function SaleFormModal({ products, onClose, onSave, userId }: any) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    discount: 0,
    tax: 0,
    payment_method: 'cash',
    notes: '',
  });
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => {
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;

    if (quantity > product.current_stock) {
      setError(`Only ${product.current_stock} units available`);
      return;
    }

    const existingItem = saleItems.find(item => item.product_id === selectedProduct);
    if (existingItem) {
      setSaleItems(saleItems.map(item =>
        item.product_id === selectedProduct
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setSaleItems([...saleItems, {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.selling_price,
        quantity,
        total_price: product.selling_price * quantity,
      }]);
    }

    setSelectedProduct('');
    setQuantity(1);
    setError('');
  };

  const removeItem = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.product_id !== productId));
  };

  const subtotal = saleItems.reduce((sum, item) => sum + item.total_price, 0);
  const total = subtotal - formData.discount + formData.tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const saleNumber = `SALE-${Date.now()}`;

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          sale_number: saleNumber,
          sale_date: new Date().toISOString().split('T')[0],
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          subtotal,
          discount: formData.discount,
          tax: formData.tax,
          total_amount: total,
          payment_method: formData.payment_method,
          notes: formData.notes,
          created_by: userId,
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItemsData = saleItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsData);
      if (itemsError) throw itemsError;

      for (const item of saleItems) {
        const product = products.find((p: any) => p.id === item.product_id);
        const newStock = product.current_stock - item.quantity;

        await supabase.from('products').update({ current_stock: newStock }).eq('id', item.product_id);

        await supabase.from('inventory_transactions').insert([{
          product_id: item.product_id,
          transaction_type: 'sale',
          quantity: -item.quantity,
          previous_stock: product.current_stock,
          new_stock: newStock,
          reference_type: 'sale',
          reference_id: saleData.id,
          notes: `Sale ${saleNumber}`,
          created_by: userId,
        }]);
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={24} />
            New Sale
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="border-t border-b py-4">
            <h3 className="font-medium text-gray-900 mb-3">Add Items</h3>
            <div className="flex gap-3">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ¢{product.selling_price} (Stock: {product.current_stock})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={addItem}
                disabled={!selectedProduct}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {saleItems.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Items</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {saleItems.map((item) => (
                    <tr key={item.product_id}>
                      <td className="px-3 py-2 text-sm">{item.product_name}</td>
                      <td className="px-3 py-2 text-sm">{item.quantity}</td>
                      <td className="px-3 py-2 text-sm">¢{item.unit_price.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm font-medium">¢{item.total_price.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm">
                        <button
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Payment</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal:</span>
              <span className="font-medium">¢{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Discount:</span>
              <span className="font-medium text-red-600">-¢{formData.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span>Tax:</span>
              <span className="font-medium">+¢{formData.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-3 border-t">
              <span>Total:</span>
              <span className="text-green-600">¢{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || saleItems.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

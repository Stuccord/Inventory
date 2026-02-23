import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Printer, X, Trash2, ShoppingCart } from 'lucide-react';
import { supabase, Order, OrderItem, ProductWithDetails } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function OrdersView({ onUpdate }: { onUpdate: () => void }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [taxRate, setTaxRate] = useState(0.10);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    payment_method: 'cash',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>>([]);

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadTaxRate();
  }, []);

  const loadTaxRate = async () => {
    const { data } = await supabase.rpc('get_setting', { key: 'tax_rate' });
    if (data) {
      setTaxRate(parseFloat(data) || 0.10);
    }
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(*), suppliers(*)')
      .eq('is_active', true);

    if (data) setProducts(data as any[]);
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${year}${month}${random}`;
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      updated[index] = {
        ...updated[index],
        product_id: value,
        unit_price: product?.selling_price || 0
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOrderItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) =>
      sum + (item.unit_price * item.quantity), 0
    );
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      alert('Please enter customer name');
      return;
    }

    if (orderItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const { subtotal, tax, total } = calculateTotals();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: generateOrderNumber(),
        order_date: new Date().toISOString().split('T')[0],
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        subtotal,
        discount: 0,
        tax,
        total_amount: total,
        payment_method: formData.payment_method,
        payment_status: 'paid',
        order_status: 'completed',
        notes: formData.notes,
        created_by: profile?.id,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      alert(`Error creating order: ${orderError?.message || 'Unknown error'}`);
      return;
    }

    const orderItemsData = orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      alert(`Error adding items: ${itemsError.message}`);
      return;
    }

    await supabase.from('audit_logs').insert({
      user_id: profile?.id,
      action: 'create',
      entity_type: 'order',
      entity_id: order.id,
      new_values: order,
    });

    setShowForm(false);
    resetForm();
    loadOrders();
    onUpdate();
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      payment_method: 'cash',
      notes: '',
    });
    setOrderItems([]);
  };

  const viewInvoice = async (order: Order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const printInvoice = () => {
    window.print();
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Order Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>New Order</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by order number or customer..."
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
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Payment</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Status</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                    {new Date(order.order_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 md:px-6 py-4 text-sm text-gray-900">
                    <div>{order.customer_name || 'Walk-in Customer'}</div>
                    <div className="text-gray-500 text-xs hidden sm:block">{order.customer_phone}</div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ¢{Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                    <span className="capitalize">{order.payment_method}</span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.order_status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewInvoice(order)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={18} />
                    </button>
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
              <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Order Items</h3>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm w-full sm:w-auto justify-center"
                  >
                    <Plus size={16} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Product
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (Stock: {product.current_stock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <input
                          type="text"
                          value={`¢${(item.unit_price * item.quantity).toFixed(2)}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                          disabled
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end space-y-2">
                  <div className="w-64">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">¢{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%):</span>
                      <span className="font-medium">¢{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>¢{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Payment</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvoice && selectedOrder && (
        <InvoiceModal order={selectedOrder} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
}

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    loadOrderItems();
  }, [order.id]);

  const loadOrderItems = async () => {
    const { data } = await supabase
      .from('order_items')
      .select('*, products(*)')
      .eq('order_id', order.id);

    if (data) setOrderItems(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Invoice</h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer size={18} />
              Print
            </button>
            <button onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8" id="invoice-content">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-sm md:text-base text-gray-600">Inventory Management System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Bill To:</h3>
              <p className="text-gray-700">{order.customer_name || 'Walk-in Customer'}</p>
              <p className="text-gray-600">{order.customer_phone}</p>
              <p className="text-gray-600">{order.customer_email}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Order #: <span className="font-bold text-gray-900">{order.order_number}</span></p>
              <p className="text-gray-600">Date: {new Date(order.order_date).toLocaleDateString()}</p>
              <p className="text-gray-600">Payment: <span className="capitalize">{order.payment_method}</span></p>
            </div>
          </div>

          <div className="overflow-x-auto mb-6 md:mb-8">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Item</th>
                  <th className="px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-gray-700">Qty</th>
                  <th className="px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orderItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-900">{item.products?.name}</td>
                    <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-600 text-right">¢{Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-2 md:px-4 py-3 text-xs md:text-sm font-medium text-gray-900 text-right">¢{Number(item.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">¢{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">¢{Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>¢{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm border-t pt-4">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

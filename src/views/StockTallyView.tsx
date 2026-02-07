import { useState, useEffect } from 'react';
import { Plus, Search, Check, X, Download, Upload, AlertTriangle } from 'lucide-react';
import { supabase, StockTally, StockTallyItem, ProductWithDetails } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function StockTallyView({ onUpdate }: { onUpdate: () => void }) {
  const { profile, isAdmin, isManager } = useAuth();
  const [tallies, setTallies] = useState<StockTally[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTally, setSelectedTally] = useState<StockTally | null>(null);
  const [tallyItems, setTallyItems] = useState<StockTallyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    location: 'main',
    notes: '',
  });
  const [countedProducts, setCountedProducts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadTallies();
    loadProducts();
  }, []);

  const loadTallies = async () => {
    const { data } = await supabase
      .from('stock_tally')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTallies(data);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(*), suppliers(*)')
      .eq('is_active', true);

    if (data) setProducts(data as any[]);
  };

  const loadTallyItems = async (tallyId: string) => {
    const { data } = await supabase
      .from('stock_tally_items')
      .select('*, products(*)')
      .eq('tally_id', tallyId);

    if (data) setTallyItems(data as any[]);
  };

  const generateTallyNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TALLY-${year}${month}${day}-${random}`;
  };

  const updateCount = (productId: string, count: number) => {
    const updated = new Map(countedProducts);
    updated.set(productId, count);
    setCountedProducts(updated);
  };

  const calculateTotalVariance = () => {
    let totalVariance = 0;
    products.forEach(product => {
      const counted = countedProducts.get(product.id) ?? product.current_stock;
      totalVariance += Math.abs(counted - product.current_stock);
    });
    return totalVariance;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalVariance = calculateTotalVariance();

    const { data: tally, error: tallyError } = await supabase
      .from('stock_tally')
      .insert({
        tally_number: generateTallyNumber(),
        tally_date: new Date().toISOString().split('T')[0],
        location: formData.location,
        status: 'completed',
        total_variance: totalVariance,
        notes: formData.notes,
        counted_by: profile?.id,
      })
      .select()
      .single();

    if (tallyError || !tally) {
      alert('Error creating tally');
      return;
    }

    for (const product of products) {
      const countedQty = countedProducts.get(product.id) ?? product.current_stock;

      await supabase.from('stock_tally_items').insert({
        tally_id: tally.id,
        product_id: product.id,
        system_quantity: product.current_stock,
        counted_quantity: countedQty,
        variance_reason: countedQty !== product.current_stock ? 'Physical count variance' : '',
      });
    }

    await supabase.from('audit_logs').insert({
      user_id: profile?.id,
      action: 'create',
      entity_type: 'stock_tally',
      entity_id: tally.id,
      new_values: tally,
    });

    setShowForm(false);
    resetForm();
    loadTallies();
    onUpdate();
  };

  const approveTally = async (tallyId: string) => {
    await supabase
      .from('stock_tally')
      .update({
        approved_by: profile?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', tallyId);

    await supabase.rpc('process_tally', { tally_id_param: tallyId });

    await supabase.from('audit_logs').insert({
      user_id: profile?.id,
      action: 'approve',
      entity_type: 'stock_tally',
      entity_id: tallyId,
    });

    loadTallies();
    onUpdate();
  };

  const viewDetails = async (tally: StockTally) => {
    setSelectedTally(tally);
    await loadTallyItems(tally.id);
    setShowDetail(true);
  };

  const resetForm = () => {
    setFormData({
      location: 'main',
      notes: '',
    });
    setCountedProducts(new Map());
  };

  const exportToCSV = () => {
    const headers = ['Product SKU', 'Product Name', 'Category', 'System Quantity', 'Counted Quantity', 'Variance', 'Variance Reason'];
    const rows = tallyItems.map(item => [
      (item as any).products?.sku || '',
      (item as any).products?.name || '',
      (item as any).products?.categories?.name || '',
      item.system_quantity,
      item.counted_quantity,
      item.variance,
      item.variance_reason || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally-${selectedTally?.tally_number}.csv`;
    a.click();
  };

  const filteredTallies = tallies.filter(tally =>
    tally.tally_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Tally / Physical Count</h1>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            New Tally
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by tally number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tally #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Variance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTallies.map((tally) => (
              <tr key={tally.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tally.tally_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(tally.tally_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                  {tally.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-medium ${tally.total_variance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {tally.total_variance > 0 ? `±${tally.total_variance}` : '0'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tally.status === 'approved' ? 'bg-green-100 text-green-800' :
                    tally.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    tally.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tally.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewDetails(tally)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      View
                    </button>
                    {tally.status === 'completed' && (isAdmin || isManager) && (
                      <button
                        onClick={() => approveTally(tally.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Approve & Apply"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Stock Tally - Physical Count</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Count each product physically and enter the counted quantity.
                  The system will calculate variances automatically. After submission, an admin must approve
                  the tally to update inventory levels.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Main Warehouse, Branch A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tally Date
                  </label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Count</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">System Qty</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Counted Qty</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => {
                        const counted = countedProducts.get(product.id) ?? product.current_stock;
                        const variance = counted - product.current_stock;
                        return (
                          <tr key={product.id} className={variance !== 0 ? 'bg-yellow-50' : ''}>
                            <td className="px-4 py-2 text-sm text-gray-900">{product.sku}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{product.categories?.name}</td>
                            <td className="px-4 py-2 text-sm text-center font-medium">{product.current_stock}</td>
                            <td className="px-4 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={counted}
                                onChange={(e) => updateCount(product.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`text-sm font-medium ${
                                variance > 0 ? 'text-green-600' :
                                variance < 0 ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {variance > 0 ? `+${variance}` : variance}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Add any relevant notes about this stock count..."
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="text-orange-600 flex-shrink-0" size={20} />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">Total Variance: {calculateTotalVariance()} units</p>
                  <p>This tally will require admin approval before inventory levels are updated.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedTally && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Tally Details - {selectedTally.tally_number}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <button onClick={() => setShowDetail(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedTally.tally_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium capitalize">{selectedTally.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{selectedTally.status}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">System</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Counted</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Variance</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tallyItems.map((item) => (
                      <tr key={item.id} className={item.variance !== 0 ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-2 text-sm">{(item as any).products?.sku}</td>
                        <td className="px-4 py-2 text-sm">{(item as any).products?.name}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.system_quantity}</td>
                        <td className="px-4 py-2 text-sm text-center font-medium">{item.counted_quantity}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-sm font-medium ${
                            item.variance > 0 ? 'text-green-600' :
                            item.variance < 0 ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {item.variance > 0 ? `+${item.variance}` : item.variance}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{item.variance_reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

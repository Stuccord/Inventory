import { useState, useEffect } from 'react';
import { Download, FileText, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ReportsView() {
  const [reportType, setReportType] = useState<'stock' | 'sales' | 'lowstock' | 'purchases'>('stock');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const loadReport = async () => {
    setLoading(true);

    switch (reportType) {
      case 'stock':
        const { data: stockData } = await supabase
          .from('products')
          .select('*, categories(*), suppliers(*)')
          .eq('is_active', true)
          .order('current_stock', { ascending: true });
        if (stockData) setReportData(stockData);
        break;

      case 'sales':
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .gte('sale_date', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
          .order('sale_date', { ascending: false });
        if (salesData) setReportData(salesData);
        break;

      case 'lowstock':
        const { data: lowStockData } = await supabase
          .from('products')
          .select('*, categories(*), suppliers(*)')
          .eq('is_active', true)
          .lte('current_stock', supabase.raw('reorder_level'))
          .order('current_stock', { ascending: true });
        if (lowStockData) setReportData(lowStockData);
        break;

      case 'purchases':
        const { data: purchaseData } = await supabase
          .from('purchase_orders')
          .select('*, suppliers(*)')
          .gte('order_date', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
          .order('order_date', { ascending: false });
        if (purchaseData) setReportData(purchaseData);
        break;
    }

    setLoading(false);
  };

  const exportToCSV = () => {
    if (reportData.length === 0) return;

    let csv = '';
    const headers = Object.keys(reportData[0]);
    csv += headers.join(',') + '\n';

    reportData.forEach(row => {
      csv += headers.map(header => {
        const value = row[header];
        return typeof value === 'object' ? JSON.stringify(value) : value;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={24} />
            Reports
          </h2>
          <button
            onClick={exportToCSV}
            disabled={reportData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setReportType('stock')}
            className={`p-4 border-2 rounded-lg transition ${
              reportType === 'stock'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Package size={24} className="mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Stock Summary</div>
          </button>
          <button
            onClick={() => setReportType('sales')}
            className={`p-4 border-2 rounded-lg transition ${
              reportType === 'sales'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <TrendingUp size={24} className="mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">Sales Report</div>
          </button>
          <button
            onClick={() => setReportType('lowstock')}
            className={`p-4 border-2 rounded-lg transition ${
              reportType === 'lowstock'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <AlertTriangle size={24} className="mx-auto mb-2 text-orange-600" />
            <div className="text-sm font-medium">Low Stock</div>
          </button>
          <button
            onClick={() => setReportType('purchases')}
            className={`p-4 border-2 rounded-lg transition ${
              reportType === 'purchases'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText size={24} className="mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">Purchase History</div>
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-8 text-gray-600">Loading report...</p>
          ) : reportData.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No data available</p>
          ) : (
            <>
              {reportType === 'stock' && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">{item.sku}</td>
                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{item.categories?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm">{item.current_stock} {item.unit_of_measure}</td>
                        <td className="px-4 py-3 text-sm">{item.reorder_level}</td>
                        <td className="px-4 py-3 text-sm">${(item.current_stock * item.selling_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'sales' && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium">{item.sale_number}</td>
                        <td className="px-4 py-3 text-sm">{new Date(item.sale_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{item.customer_name || 'Walk-in'}</td>
                        <td className="px-4 py-3 text-sm font-medium">${Number(item.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm capitalize">{item.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'lowstock' && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{item.current_stock} {item.unit_of_measure}</td>
                        <td className="px-4 py-3 text-sm">{item.reorder_level}</td>
                        <td className="px-4 py-3 text-sm">{item.suppliers?.name || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.current_stock === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

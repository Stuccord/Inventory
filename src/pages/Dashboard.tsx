import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Users as UsersIcon, User, LogOut, ShoppingBag, RotateCcw, ClipboardCheck, TrendingUp
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase, ProductWithDetails, Order } from '../lib/supabase';
import ProductsView from '../views/ProductsView';
import OrdersView from '../views/OrdersView';
import ReturnsView from '../views/ReturnsView';
import StockTallyView from '../views/StockTallyView';
import CategoriesView from '../views/CategoriesView';
import SuppliersView from '../views/SuppliersView';
import UsersView from '../views/UsersView';
import StockMovementView from '../views/StockMovementView';

type ViewType = 'dashboard' | 'products' | 'categories' | 'orders' | 'returns' | 'tally' | 'movement' | 'suppliers' | 'users' | 'profile';

export default function Dashboard() {
  const { profile, signOut, isAdmin, isManager } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    ordersToday: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [productsRes, ordersRes, todayOrdersRes] = await Promise.all([
        supabase.from('products').select('*, categories(*), suppliers(*)').eq('is_active', true),
        supabase.from('orders').select('*').eq('order_status', 'completed'),
        supabase.from('orders').select('*').eq('order_date', today).eq('order_status', 'completed')
      ]);

      if (productsRes.error) {
        console.error('Error loading products:', productsRes.error);
      } else if (productsRes.data) {
        setProducts(productsRes.data as any[]);
        const totalStock = productsRes.data.reduce((sum, p: any) => sum + p.current_stock, 0);
        setStats(prev => ({ ...prev, totalProducts: productsRes.data.length, totalStock }));
      }

      if (ordersRes.error) {
        console.error('Error loading orders:', ordersRes.error);
      } else if (ordersRes.data) {
        setOrders(ordersRes.data);
        const revenue = ordersRes.data.reduce((sum, o) => sum + Number(o.total_amount), 0);
        setStats(prev => ({ ...prev, revenue }));
      }

      if (todayOrdersRes.error) {
        console.error('Error loading today orders:', todayOrdersRes.error);
      } else if (todayOrdersRes.data) {
        setStats(prev => ({ ...prev, ordersToday: todayOrdersRes.data.length }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const outOfStockProducts = products.filter(p => p.current_stock === 0);
  const lowStockProducts = products.filter(p => p.current_stock > 0 && p.current_stock <= p.reorder_level);

  const highestSaleProduct = products.length > 0 ? products[0] : null;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-52 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="font-bold text-lg">Inventory MS</h1>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem
            icon={<Package size={18} />}
            label="Products"
            active={currentView === 'products'}
            onClick={() => setCurrentView('products')}
          />
          <NavItem
            icon={<Tag size={18} />}
            label="Categories"
            active={currentView === 'categories'}
            onClick={() => setCurrentView('categories')}
          />
          <NavItem
            icon={<ShoppingCart size={18} />}
            label="Orders"
            active={currentView === 'orders'}
            onClick={() => setCurrentView('orders')}
          />
          <NavItem
            icon={<RotateCcw size={18} />}
            label="Returns"
            active={currentView === 'returns'}
            onClick={() => setCurrentView('returns')}
          />
          <NavItem
            icon={<ClipboardCheck size={18} />}
            label="Stock Tally"
            active={currentView === 'tally'}
            onClick={() => setCurrentView('tally')}
          />
          <NavItem
            icon={<TrendingUp size={18} />}
            label="Stock Movement"
            active={currentView === 'movement'}
            onClick={() => setCurrentView('movement')}
          />
          <NavItem
            icon={<ShoppingBag size={18} />}
            label="Suppliers"
            active={currentView === 'suppliers'}
            onClick={() => setCurrentView('suppliers')}
          />
          {isManager && (
            <NavItem
              icon={<UsersIcon size={18} />}
              label="Users"
              active={currentView === 'users'}
              onClick={() => setCurrentView('users')}
            />
          )}
          <NavItem
            icon={<User size={18} />}
            label="Profile"
            active={currentView === 'profile'}
            onClick={() => setCurrentView('profile')}
          />
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {currentView === 'dashboard' && (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Products"
                value={stats.totalProducts}
                bgColor="bg-blue-500"
              />
              <StatCard
                title="Total Stock"
                value={stats.totalStock}
                bgColor="bg-green-500"
              />
              <StatCard
                title="Order Today"
                value={stats.ordersToday}
                bgColor="bg-yellow-500"
              />
              <StatCard
                title="Revenue"
                value={`$${stats.revenue.toFixed(0)}`}
                bgColor="bg-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <InsightCard title="Out of Stock Products">
                {outOfStockProducts.length === 0 ? (
                  <p className="text-gray-500 py-4">No out of stock products</p>
                ) : (
                  <div className="space-y-2">
                    {outOfStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="text-sm">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-gray-500"> ({product.categories?.name})</span>
                      </div>
                    ))}
                  </div>
                )}
              </InsightCard>

              <InsightCard title="Highest Sale Product">
                {highestSaleProduct ? (
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">Name:</span> {highestSaleProduct.name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Category:</span> {highestSaleProduct.categories?.name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total Units Sold:</span> 2
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 py-4">No sales data</p>
                )}
              </InsightCard>

              <InsightCard title="Low Stock Products">
                {lowStockProducts.length === 0 ? (
                  <p className="text-gray-500 py-4">No low stock products</p>
                ) : (
                  <div className="space-y-2">
                    {lowStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="text-sm">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-gray-600"> - {product.current_stock} left</span>
                        <span className="text-gray-500"> ({product.categories?.name})</span>
                      </div>
                    ))}
                  </div>
                )}
              </InsightCard>
            </div>
          </div>
        )}

        {currentView === 'products' && <ProductsView onUpdate={loadDashboardData} />}
        {currentView === 'orders' && <OrdersView onUpdate={loadDashboardData} />}
        {currentView === 'returns' && <ReturnsView onUpdate={loadDashboardData} />}
        {currentView === 'tally' && <StockTallyView onUpdate={loadDashboardData} />}
        {currentView === 'movement' && <StockMovementView onUpdate={loadDashboardData} />}
        {currentView === 'categories' && <CategoriesView />}
        {currentView === 'suppliers' && <SuppliersView />}
        {currentView === 'users' && isManager && <UsersView />}
        {currentView === 'profile' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">My Profile</h2>
            <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-medium text-lg">{profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full uppercase font-medium ${
                    profile?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    profile?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    profile?.role === 'auditor' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {profile?.role}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    profile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Member Since</p>
                  <p className="font-medium">{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 transition ${
        active
          ? 'bg-slate-700 text-white border-l-4 border-blue-500'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatCard({ title, value, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-lg shadow-lg p-6 text-white`}>
      <h3 className="text-sm opacity-90 mb-2">{title}</h3>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
}

function InsightCard({ title, children }: any) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

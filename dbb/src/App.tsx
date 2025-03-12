import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Package, Users, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import OrdersTable from './components/OrdersTable';
import BulkMessaging from './components/BulkMessaging';
import CustomerList from './components/CustomerList';
import Settings from './components/Settings';
import ProductList from './components/ProductList';
import AddProduct from './components/AddProduct';
import EditProduct from './components/EditProduct';
import { API_ENDPOINTS } from './api/config';

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.orders);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <nav className="mt-6">
            <Link to="/orders" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
              <Package className="w-5 h-5 mr-3" />
              <span>Orders</span>
            </Link>
            <Link to="/messaging" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
              <MessageSquare className="w-5 h-5 mr-3" />
              <span>Bulk Messaging</span>
            </Link>
            <Link to="/customers" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
              <Users className="w-5 h-5 mr-3" />
              <span>Customers</span>
            </Link>
            <Link to="/products" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
              <Package className="w-5 h-5 mr-3" />
              <span>Products</span>
            </Link>
            <Link to="/settings" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
              <SettingsIcon className="w-5 h-5 mr-3" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <Routes>
              <Route path="/orders" element={<OrdersTable orders={orders} onOrderUpdate={fetchOrders} />} />
              <Route path="/messaging" element={<BulkMessaging />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/products" element={<ProductList onProductUpdate={fetchOrders} />} />
              <Route path="/products/add" element={<AddProduct onProductUpdate={fetchOrders} />} />
              <Route path="/products/edit/:id" element={<EditProduct onProductUpdate={fetchOrders} />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<OrdersTable orders={orders} onOrderUpdate={fetchOrders} />} />
            </Routes>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
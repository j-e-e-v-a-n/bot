import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import {
  Package,
  Users,
  MessageSquare,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

import OrdersTable from './components/OrdersTable';
import BulkMessaging from './components/BulkMessaging';
import CustomerList from './components/CustomerList';
import Settings from './components/Settings';
import ProductList from './components/ProductList';
import AddProduct from './components/AddProduct';
import EditProduct from './components/EditProduct';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import MaintenancePage from './components/MaintenancePage';
import Home from './components/Home'; // ✅ Add this import (assuming you have Home.tsx)
import { API_ENDPOINTS } from './api/config';

// ✅ Maintenance Mode from env variable
const isMaintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === 'true';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center px-6 py-3 transition-colors duration-200 ${
        isActive
          ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
      <span className="font-medium">{children}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(auth === 'true');
    if (auth === 'true') {
      fetchOrders();
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.orders);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  if (isMaintenanceMode) {
    return (
      <Router>
        <MaintenancePage />
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar and Navigation for authenticated users */}
        {isAuthenticated && (
          <>
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg bg-white shadow-lg text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Sidebar */}
            <div
              className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-blue-100 text-sm mt-1">Welcome back, Admin</p>
              </div>
              <nav className="mt-6 space-y-1">
                <NavLink to="/orders" icon={Package}>
                  Orders
                </NavLink>
                <NavLink to="/messaging" icon={MessageSquare}>
                  Bulk Messaging
                </NavLink>
                <NavLink to="/customers" icon={Users}>
                  Customers
                </NavLink>
                <NavLink to="/products" icon={Package}>
                  Products
                </NavLink>
                <NavLink to="/settings" icon={SettingsIcon}>
                  Settings
                </NavLink>
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-6 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
          </>
        )}

        {/* Main Content */}
        <div className={isAuthenticated ? 'lg:ml-64 min-h-screen' : ''}>
          <div className="p-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={<Login onLogin={() => setIsAuthenticated(true)} />}
              />

              {/* Protected Routes */}
              <Route
                path="/orders"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <OrdersTable orders={orders} onOrderUpdate={fetchOrders} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messaging"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <BulkMessaging />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <CustomerList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <ProductList onProductUpdate={fetchOrders} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/add"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AddProduct onProductUpdate={fetchOrders} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/edit/:id"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <EditProduct onProductUpdate={fetchOrders} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;

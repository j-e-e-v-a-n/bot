import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, MessageSquare, Settings } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to the Admin Dashboard</h1>
      <p className="text-lg text-gray-600 mb-12">
        Manage your orders, products, customers, and more from one place.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/orders" className="bg-white shadow rounded-lg p-6 flex flex-col items-center hover:shadow-lg transition">
          <Package className="h-10 w-10 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">View and manage all orders in one place.</p>
        </Link>

        <Link to="/products" className="bg-white shadow rounded-lg p-6 flex flex-col items-center hover:shadow-lg transition">
          <Package className="h-10 w-10 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Products</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Add, edit, or delete products easily.</p>
        </Link>

        <Link to="/customers" className="bg-white shadow rounded-lg p-6 flex flex-col items-center hover:shadow-lg transition">
          <Users className="h-10 w-10 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Access and manage customer data.</p>
        </Link>

        <Link to="/messaging" className="bg-white shadow rounded-lg p-6 flex flex-col items-center hover:shadow-lg transition">
          <MessageSquare className="h-10 w-10 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Bulk Messaging</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Send messages to customers in bulk.</p>
        </Link>

        <Link to="/settings" className="bg-white shadow rounded-lg p-6 flex flex-col items-center hover:shadow-lg transition">
          <Settings className="h-10 w-10 text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Customize your dashboard preferences.</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;

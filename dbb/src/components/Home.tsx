import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome to Our Store</h1>
      <p className="text-gray-600 mb-8 max-w-xl">
        Explore our latest products and place your orders easily. Admins can manage orders, customers, products, and messaging from the dashboard.
      </p>
      <div className="flex space-x-4">
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Admin Login
        </Link>
        <a
          href="#"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg shadow hover:bg-gray-200 transition"
        >
          Visit Store
        </a>
      </div>
    </div>
  );
};

export default Home;

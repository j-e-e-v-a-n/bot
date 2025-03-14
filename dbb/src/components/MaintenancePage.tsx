// src/components/MaintenancePage.tsx
import React from 'react';
import { Wrench, AlertTriangle } from 'lucide-react';

const MaintenancePage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="bg-white p-10 rounded-lg shadow-xl text-center max-w-md">
        <Wrench className="mx-auto text-yellow-500 w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-gray-800">We'll be back soon!</h1>
        <p className="text-gray-600 mb-4">
          Our site is currently undergoing scheduled maintenance.
        </p>
        <AlertTriangle className="mx-auto text-red-400 w-12 h-12 mb-4" />
        <p className="text-gray-500">Thank you for your patience.</p>
      </div>
    </div>
  );
};

export default MaintenancePage;

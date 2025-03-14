import React from 'react';
import { AlertTriangle } from 'lucide-react';

const MaintenancePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">We'll be back soon!</h1>
        <p className="text-gray-600 mb-4">
          Our site is currently undergoing scheduled maintenance.  
          We should be back shortly. Thank you for your patience.
        </p>
        <p className="text-sm text-gray-400">— The Admin Team</p>
      </div>
    </div>
  );
};

export default MaintenancePage;

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../api/config';

const Settings: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [freeShippingAmount, setFreeShippingAmount] = useState('');
  const [supportNumber, setSupportNumber] = useState('');
  const [adminNumbers, setAdminNumbers] = useState<string[]>(['']); // Initialize with one empty string

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.settings);
      const data = await response.json();
      setBusinessName(data.businessName || '');
      setUpiId(data.upiId || '');
      setShippingCost(data.shippingCost || '');
      setFreeShippingAmount(data.freeShippingAmount || '');
      setSupportNumber(data.supportNumber || '');
      setAdminNumbers(data.adminNumbers || ['']); // Set admin numbers from fetched data
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleAdminNumberChange = (index: number, value: string) => {
    const updatedAdminNumbers = [...adminNumbers];
    updatedAdminNumbers[index] = value;
    setAdminNumbers(updatedAdminNumbers);
  };

  const addAdminNumberField = () => {
    setAdminNumbers([...adminNumbers, '']); // Add a new empty field
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(API_ENDPOINTS.settings, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName,
          upiId,
          shippingCost,
          freeShippingAmount,
          supportNumber,
          adminNumbers,
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter business name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UPI ID
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="Enter UPI ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Cost (₹)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            placeholder="Enter shipping cost"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Free Shipping Amount (₹)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={freeShippingAmount}
            onChange={(e) => setFreeShippingAmount(e.target.value)}
            placeholder="Enter free shipping amount"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Number
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={supportNumber}
            onChange={(e) => setSupportNumber(e.target.value)}
            placeholder="Enter support number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Numbers
          </label>
          {adminNumbers.map((number, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="tel"
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={number}
                onChange={(e) => handleAdminNumberChange(index, e.target.value)}
                placeholder="Enter admin number"
              />
              {index === adminNumbers.length - 1 && (
                <button
                  type="button"
                  onClick={addAdminNumberField}
                  className="ml-2 px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default Settings;
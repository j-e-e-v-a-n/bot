import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../api/config';
import { Save } from 'lucide-react';

const Settings = () => {
  const [businessName, setBusinessName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [freeShippingAmount, setFreeShippingAmount] = useState('');
  const [supportNumber, setSupportNumber] = useState('');
  const [adminNumbers, setAdminNumbers] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);

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
      setAdminNumbers(data.adminNumbers || ['']);
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
    setAdminNumbers([...adminNumbers, '']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.settings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Business Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your store configuration</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter business name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">UPI ID</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="Enter UPI ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Shipping Cost (₹)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              placeholder="Enter shipping cost"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Free Shipping Amount (₹)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={freeShippingAmount}
              onChange={(e) => setFreeShippingAmount(e.target.value)}
              placeholder="Enter free shipping amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Support Number</label>
            <input
              type="tel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={supportNumber}
              onChange={(e) => setSupportNumber(e.target.value)}
              placeholder="Enter support number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Numbers</label>
          <div className="space-y-2">
            {adminNumbers.map((number, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="tel"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={number}
                  onChange={(e) => handleAdminNumberChange(index, e.target.value)}
                  placeholder="Enter admin number"
                />
                {index === adminNumbers.length - 1 && (
                  <button
                    type="button"
                    onClick={addAdminNumberField}
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Add More
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
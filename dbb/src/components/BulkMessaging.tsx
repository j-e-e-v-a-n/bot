import React, { useState } from 'react';
import { API_ENDPOINTS } from '../api/config';

const BulkMessaging: React.FC = () => {
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.messages}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, filter }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Message sent to ${data.sent} customers!`);
        setMessage('');
      } else {
        alert('Error sending messages: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Bulk Messaging</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Template
          </label>
          <textarea
            className="w-full h-32 px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Send to
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Customers</option>
            <option value="recent">Recent Customers (Last 30 days)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={sending}
          className={`w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            sending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default BulkMessaging;
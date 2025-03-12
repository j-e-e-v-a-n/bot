import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../api/config';
import OrderStatus from './OrderStatus';

interface Order {
  id: string;
  customer: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  total: number;
  timestamp: string;
}

interface Props {
  orders: Order[];
  onOrderUpdate: () => void;
}

const OrdersTable: React.FC<Props> = ({ orders, onOrderUpdate }) => {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Order | null>(null);

  const handleStatusUpdate = async (orderId: string, data: any) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.orders}/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setPendingChanges(updatedOrder); // Store the updated order for notification
        setEditingOrder(null); // Clear editing state
      } else {
        const errorData = await response.json();
        console.error('Error updating order:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const notifyCustomer = async (order: Order) => {
    const messages = [];
    
    // Check for status update
    if (order.status) {
      messages.push(`Your order status has been updated to: ${order.status}.`);
    }

    // Check for tracking number update
    if (order.trackingNumber) {
      messages.push(`Your tracking number is: ${order.trackingNumber}.`);
    }

    // Check for estimated delivery date update
    if (order.estimatedDelivery) {
      messages.push(`Your estimated delivery date is: ${order.estimatedDelivery}.`);
    }

    // Send all messages to the customer
    if (messages.length > 0) {
      const message = messages.join('\n');
      await sendMessageToCustomer(order.customer, message);
    }
  };

  const sendMessageToCustomer = async (customerPhone: string, message: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: customerPhone,
          message: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error sending message:', errorData.error);
      } else {
        console.log(`Message sent to ${customerPhone}: ${message}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (pendingChanges) {
      await notifyCustomer(pendingChanges);
      onOrderUpdate(); // Call the parent update function
      setPendingChanges(null); // Clear pending changes
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrder?.id === order.id ? (
                      <select
                        className="border rounded px-2 py-1"
                        value={editingOrder.status}
                        onChange={(e) =>
                          setEditingOrder({ ...editingOrder, status: e.target.value })
                        }
                      >
                        <option value="pending_payment">Pending Payment</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <OrderStatus status={order.status} />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingOrder?.id === order.id ? (
                      <input
                        type="text"
                        className="border rounded px-2 py-1"
                        value={editingOrder.trackingNumber || ''}
                        onChange={(e) =>
                          setEditingOrder({ ...editingOrder, trackingNumber: e.target.value })
                        }
                        placeholder="Enter tracking number"
                      />
                    ) : (
                      order.trackingNumber || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingOrder?.id === order.id ? (
                      <input
                        type="date"
                        className="border rounded px-2 py-1"
                        value={editingOrder.estimatedDelivery || ''}
                        onChange={(e) =>
                          setEditingOrder({ ...editingOrder, estimatedDelivery: e.target.value })
                        }
                      />
                    ) : (
                      order.estimatedDelivery || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{order.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingOrder?.id === order.id ? (
                      <div className="space-x-2">
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleStatusUpdate(order.id, editingOrder)}
                        >
                          Save
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => setEditingOrder(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => setEditingOrder(order)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            // Handle delete order logic here if needed
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pendingChanges && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
          <p>Changes have been made. Do you want to notify the customer?</p>
          <button
            className="text-blue-600 hover:text-blue-900"
            onClick={handleSaveChanges}
          >
            Yes, Notify Customer
          </button>
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setPendingChanges(null)}
          >
            No, Cancel
          </button>
        </div>
      )}
      
    </div>
  );
};

export default OrdersTable;
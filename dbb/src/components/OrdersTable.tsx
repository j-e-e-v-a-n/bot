import React, { useState } from 'react';
import { Edit2, Trash2, AlertCircle, Check } from 'lucide-react';
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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
        setPendingChanges(updatedOrder);
        setEditingOrder(null);
        setNotification({ type: 'success', message: 'Order updated successfully' });
      } else {
        const errorData = await response.json();
        console.error('Error updating order:', errorData.error);
        setNotification({ type: 'error', message: 'Failed to update order' });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setNotification({ type: 'error', message: 'Failed to update order' });
    }
  };

  const notifyCustomer = async (order: Order) => {
    const messages = [];
    
    if (order.status) {
      messages.push(`Your order status has been updated to: ${order.status}.`);
    }

    if (order.trackingNumber) {
      messages.push(`Your tracking number is: ${order.trackingNumber}.`);
    }

    if (order.estimatedDelivery) {
      messages.push(`Your estimated delivery date is: ${order.estimatedDelivery}.`);
    }

    if (messages.length > 0) {
      const message = messages.join('\n');
      await sendMessageToCustomer(order.customer, message);
    }
  };

  const sendMessageToCustomer = async (customerPhone: string, message: string) => {
    try {
      const response = await fetch('https://bot-1-nyuj.onrender.com/api/send-message', {
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
        setNotification({ type: 'error', message: 'Failed to send notification to customer' });
      } else {
        console.log(`Message sent to ${customerPhone}: ${message}`);
        setNotification({ type: 'success', message: 'Customer notification sent successfully' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNotification({ type: 'error', message: 'Failed to send notification to customer' });
    }
  };

  const handleSaveChanges = async () => {
    if (pendingChanges) {
      await notifyCustomer(pendingChanges);
      onOrderUpdate();
      setPendingChanges(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
          {/* <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              New Order
            </button>
          </div> */}
        </div>

        {notification && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrder?.id === order.id ? (
                      <select
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingOrder.estimatedDelivery || ''}
                        onChange={(e) =>
                          setEditingOrder({ ...editingOrder, estimatedDelivery: e.target.value })
                        }
                      />
                    ) : (
                      order.estimatedDelivery || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{order.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingOrder?.id === order.id ? (
                      <div className="flex space-x-2">
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          onClick={() => handleStatusUpdate(order.id, editingOrder)}
                        >
                          Save
                        </button>
                        <button
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          onClick={() => setEditingOrder(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          onClick={() => setEditingOrder(order)}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          onClick={() => {
                            // Handle delete order logic here
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
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
        <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">Notify Customer?</p>
              <p className="mt-1 text-sm text-gray-500">
                Would you like to notify the customer about these changes?
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleSaveChanges}
                >
                  Yes, Notify
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setPendingChanges(null)}
                >
                  No, Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
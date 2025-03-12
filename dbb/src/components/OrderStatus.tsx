import React from 'react';

interface OrderStatusProps {
  status: string | undefined; // Allow status to be undefined
}

const OrderStatus: React.FC<OrderStatusProps> = ({ status }) => {
  // Default to 'unknown' if status is not a string
  const safeStatus = typeof status === 'string' ? status : 'unknown';

  const getStatusColor = () => {
    switch (safeStatus.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor()}`}
    >
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </span>
  );
};

export default OrderStatus;
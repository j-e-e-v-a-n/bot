import React, { useEffect, useState } from 'react';

const CustomersList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('https://bot-ir83.onrender.com/api/customers');
                if (!response.ok) {
                    throw new Error('Failed to fetch customers');
                }
                const data = await response.json();
                setCustomers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Customers List</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.map(customer => (
                    <div key={`${customer.phone}-${customer.id}`} className="bg-white shadow-md rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                        <p className="text-gray-700">Phone: {customer.phone}</p>
                        <p className="text-gray-700">Email: {customer.email}</p>
                        <p className="text-gray-700">Address: {customer.address}</p>
                        <p className="text-gray-700">Last Contact: {new Date(customer.lastContact).toLocaleString()}</p>
                        <p className="text-gray-700">Order Count: {customer.orderCount}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CustomersList;
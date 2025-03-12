// AddProduct.js
import React, { useState } from 'react';
import { API_ENDPOINTS } from '../api/config';

const AddProduct = ({ onProductUpdate }) => {
    const [itemCode, setItemCode] = useState(''); // For the product ID (e.g., "TG-002")
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [inStock, setInStock] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ENDPOINTS.products, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: itemCode, // Use the item code as the product ID
                    name,
                    price,
                    category,
                    inStock,
                }),
            });
            if (!response.ok) throw new Error('Failed to add product');
            onProductUpdate(); // Refresh the product list
            // Reset form fields
            setItemCode('');
            setName('');
            setPrice('');
            setCategory('');
            setInStock(false);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Product</h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700">Item Code:</label>
                    <input
                        type="text"
                        placeholder="Enter item code (e.g., TG-002)"
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Product Name:</label>
                    <input
                        type="text"
                        placeholder="Enter product name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Price:</label>
                    <input
                        type="number"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Category:</label>
                    <input
                        type="text"
                        placeholder="Enter category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={inStock}
                            onChange={(e) => setInStock(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">In Stock</span>
                    </label>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition"
                >
                    Add Product
                </button>
            </form>
        </div>
    );
};

export default AddProduct;
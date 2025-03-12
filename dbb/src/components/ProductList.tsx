// ProductList.js
import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../api/config';
import { useNavigate } from 'react-router-dom';

const ProductList = ({ onProductUpdate }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook for navigation

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.products);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await fetch(`${API_ENDPOINTS.products}/${id}`, { method: 'DELETE' });
                fetchProducts(); // Refresh the product list
                onProductUpdate(); // Call the parent function to refresh orders if needed
            } catch (error) {
                console.error('Error deleting product:', error);
                setError('Failed to delete product');
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/products/edit/${id}`); // Navigate to the edit page
    };

    const handleAdd = () => {
        navigate('/products/add'); // Navigate to the add product page
    };

    if (loading) return <div className="text-center">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Product List</h2>
            <button 
                onClick={handleAdd} 
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Add Product
            </button>
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b">Name</th>
                        <th className="py-2 px-4 border-b">Price</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{product.name}</td>
                                <td className="py-2 px-4 border-b">₹{product.price}</td>
                                <td className="py-2 px-4 border-b">
                                    <button 
                                        onClick={() => handleEdit(product.id)} 
                                        className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(product.id)} 
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="py-2 text-center">No products available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ProductList;
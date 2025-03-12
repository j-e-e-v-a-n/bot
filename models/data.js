const { getDB } = require('./db');

const ordersCollectionName = 'orders';
const customersCollectionName = 'customers';
const productsCollectionName = 'products';
const settingsCollectionName = 'settings';

async function loadProducts() {
    const db = getDB();
    const productsCollection = db.collection(productsCollectionName);
    return await productsCollection.find({}).toArray();
}

async function saveOrder(order) {
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);
    await ordersCollection.insertOne(order);
}

async function getOrderById(orderId) {
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);
    return await ordersCollection.findOne({ id: orderId });
}

async function updateOrderStatus(orderId, status) {
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);
    await ordersCollection.updateOne(
        { id: orderId },
        { $set: { status, updatedAt: new Date().toISOString() } }
    );
}

async function getCustomers() {
    const db = getDB();
    const customersCollection = db.collection(customersCollectionName);
    return await customersCollection.find({}).toArray();
}

async function getOrders() {
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);
    
    // Fetch orders and sort them in descending order by the timestamp field
    return await ordersCollection.find({})
        .sort({ timestamp: -1 }) // Sort by timestamp in descending order
        .toArray();
}

async function updateTrackingDeliveryDate(orderId, trackingInfo) {
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);
    await ordersCollection.updateOne(
        { id: orderId },
        { $set: { trackingInfo, updatedAt: new Date().toISOString() } }
    );
}

async function getSettings() {
    const db = getDB();
    const settingsCollection = db.collection(settingsCollectionName);
    return await settingsCollection.findOne({});
}

async function updateSettings(settings) {
    const db = getDB();
    const settingsCollection = db.collection(settingsCollectionName);
    await settingsCollection.updateOne({}, { $set: settings }, { upsert: true });
}

async function getProducts() {
    const db = getDB();
    const productsCollection = db.collection('products'); // Ensure this matches your MongoDB collection name
    console.log(productsCollection);
    return await productsCollection.find({}).toArray();
}

const addProduct = async (product) => {
    const db = getDB();
    const productsCollection = db.collection(productsCollectionName);
    
    // Validate product data
    if (!product.name || !product.price || !product.category) {
        throw new Error('Product name, price, and category are required.');
    }

    try {
        await productsCollection.insertOne(product);
    } catch (error) {
        console.error('Error adding product:', error);
        throw new Error('Failed to add product');
    }
};

const updateProduct = async (id, product) => {
    const db = getDB();
    const productsCollection = db.collection(productsCollectionName);
    await productsCollection.updateOne({ id }, { $set: product });
};

async function getProductById(id) {
    const db = getDB();
    const productsCollection = db.collection('products'); // Ensure this matches your MongoDB collection name
    return await productsCollection.findOne({ id }); // Adjust the query based on your schema
}

const removeProduct = async (id) => {
    const db = getDB();
    const productsCollection = db.collection(productsCollectionName);
    await productsCollection.deleteOne({ id });
};

module.exports = {
    loadProducts,
    saveOrder,
    getOrderById,
    updateOrderStatus,
    getCustomers,
    getOrders,
    updateTrackingDeliveryDate,
    updateSettings,
    getSettings,
    addProduct,
    updateProduct,
    getProducts,
    getProductById,
    removeProduct
};
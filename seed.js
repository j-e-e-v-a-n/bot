const { MongoClient } = require('mongodb');

// Replace with your MongoDB URI
const uri = 'mongodb+srv://user:ADhL0KH37CX52xV2@cluster0.cvupke0.mongodb.net'; // Change this to your MongoDB connection string
const client = new MongoClient(uri);

async function seedDatabase() {
    try {
        await client.connect();
        const db = client.db('whatsappBot'); // Use your database name

        // Sample Products
        const products = [
            {
                id: 'GC-001',
                name: 'Green Cardamom (100g)',
                price: 999,
                inStock: true,
                category: 'Spices'
            },
            {
                id: 'TG-002',
                name: 'Turmeric Powder (200g)',
                price: 150,
                inStock: true,
                category: 'Spices'
            },
            {
                id: 'CM-003',
                name: 'Cinnamon Sticks (50g)',
                price: 75,
                inStock: true,
                category: 'Spices'
            }
        ];

        // Sample Customers
        const customers = [
            {
                phone: '918113064544',
                name: 'John Doe',
                orderCount: 2,
                lastOrderDate: new Date().toISOString(),
                orders: ['ORD-230101-0001', 'ORD-230101-0002']
            },
            {
                phone: '918089554476',
                name: 'Jane Smith',
                orderCount: 1,
                lastOrderDate: new Date().toISOString(),
                orders: ['ORD-230101-0003']
            }
        ];

        // Sample Orders
        const orders = [
            {
                id: 'ORD-230101-0001',
                timestamp: new Date().toISOString(),
                customer: 'John Doe',
                phone: '918113064544',
                status: 'delivered',
                orderDetails: [
                    { name: 'Green Cardamom (100g)', quantity: 1, price: 999, id: 'GC-001' }
                ],
                subtotal: 999,
                shipping: 0,
                total: 999
            },
            {
                id: 'ORD-230101-0002',
                timestamp: new Date().toISOString(),
                customer: 'John Doe',
                phone: '918113064544',
                status: 'pending_payment',
                orderDetails: [
                    { name: 'Turmeric Powder (200g)', quantity: 2, price: 150, id: 'TG-002' }
                ],
                subtotal: 300,
                shipping: 0,
                total: 300
            },
            {
                id: 'ORD-230101-0003',
                timestamp: new Date().toISOString(),
                customer: 'Jane Smith',
                phone: '918089554476',
                status: 'shipped',
                orderDetails: [
                    { name: 'Cinnamon Sticks (50g)', quantity: 1, price: 75, id: 'CM-003' }
                ],
                subtotal: 75,
                shipping: 0,
                total: 75
            }
        ];

        // Insert sample data into collections
        await db.collection('products').insertMany(products);
        await db.collection('customers').insertMany(customers);
        await db.collection('orders').insertMany(orders);

        console.log('✅ Sample data inserted successfully!');
    } catch (err) {
        console.error('❌ Error inserting sample data:', err.message);
    } finally {
        await client.close();
    }
}

seedDatabase();
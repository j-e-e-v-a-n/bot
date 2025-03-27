// server.js
import express from 'express';
import cors from 'cors';
import axios  from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import whatsappWeb from 'whatsapp-web.js'; // Import the entire module
import { connectDB, getDB } from './models/db.js'; // Import your connectDB and getDB functions
import data from './models/data.js'; // Import your data model functions
import MongoAuth from './MongoAuth.js'; // path where you put the custom strategy
import { sendMessageToUser  } from './utils/sendMessage.js'; // Utility function to send messages

const { Client, MessageMedia, LocalAuth } = whatsappWeb;


// const client = new Client({
//     authStrategy: new MongoAuth(), // 👈 Replacing LocalAuth with MongoAuth!
//     puppeteer: {
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     },
// });

const client = new Client({
authStrategy: new LocalAuth(),
puppeteer: {
headless: true,
args: ['--no-sandbox', '--disable-setuid-sandbox'],
},
});
 

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp Client authenticated!');
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Client disconnected:', reason);
    // Optionally handle reconnect logic or clear the session from DB:
    // await client.destroy();
});
    

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Default route (respond with JSON)
app.get('/', (req, res) => {
    res.json({ message: 'Server is working!' }); // Respond with a JSON message
});


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  }); 


// Connect to the database
async function startServer() {
    try {
        await connectDB(); // Ensure the database is connected
        console.log('✅ Database connected successfully.');

        // API Routes
        app.get('/api/orders', async (req, res) => {
            try {
                const orders = await data.getOrders();
                res.json(orders);
            } catch (error) {
                console.error('Error fetching orders:', error);
                res.status(500).json({ error: 'Failed to fetch orders' });
            }
        });

        app.put('/api/orders/:id/tracking', async (req, res) => {
            const { trackingNumber, deliveryDate, userPhone } = req.body;
        
            try {
                // Update the tracking number and delivery date
                await data.updateTrackingDeliveryDate(req.params.id, { trackingNumber, deliveryDate });
        
                // Prepare the message
                const message = `📦 Your order #${req.params.id} has been updated with tracking number: ${trackingNumber} and delivery date: ${deliveryDate}.`;
        
                console.log("Prepared message for tracking update:", message);
        
                // Send the message by making an HTTP POST request to your /send-message route
                try {
                    const response = await axios.post('https://bot-1-nyuj.onrender.com/api/send-message', {
                        phone: userPhone,
                        message: message
                    });
        
                    if (response.data.success) {
                        console.log('✅ Tracking update message sent successfully');
                        res.json({ message: 'Tracking information updated and message sent successfully.' });
                    } else {
                        console.error('❌ Failed to send tracking update message');
                        res.status(500).json({ error: 'Tracking updated but failed to send message.' });
                    }
        
                } catch (sendError) {
                    console.error('❌ Error sending tracking update message:', sendError.message);
                    res.status(500).json({ error: 'Tracking updated but failed to send message.' });
                }
        
            } catch (error) {
                console.error('❌ Error updating tracking information:', error);
                res.status(500).json({ error: 'Failed to update tracking information' });
            }
        });
        
        let isClientReady = false;

client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
    isClientReady = true; // Set the flag when the client is ready
});

app.put('/api/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    const updateData = req.body;

    // Remove the _id field if it exists in the updateData
    delete updateData._id;

    try {
        const db = getDB(); // Get the database instance
        const ordersCollection = db.collection('orders'); // Use getDB to access the collection

        const result = await ordersCollection.updateOne(
            { id: orderId }, // Find the order by ID
            { $set: updateData } // Update the order with new data
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ detail: 'Not Found' });
        }

        // Fetch the updated order to get customer details
        const updatedOrder = await ordersCollection.findOne({ id: orderId });

        // Prepare the message to send to the customer
        const userPhone = updatedOrder.phone; // Assuming phone is stored in the order
        const message = `📦 Your order #${updatedOrder.id} has been updated. ` +
                        `Status: ${updatedOrder.status}. ` +
                        `Tracking Number: ${updatedOrder.trackingNumber || 'N/A'}. ` +
                        `Estimated Delivery: ${updatedOrder.estimatedDelivery || 'N/A'}.`;

        // Log the message for debugging
        console.log("Prepared message:", message);

        // Instead of calling sendMessageToUser, make a POST request to the /send-message endpoint
        try {
            const response = await axios.post('https://bot-1-nyuj.onrender.com/api/send-message', {
                phone: userPhone,
                message: message
            });

            if (response.data.success) {
                console.log('✅ Message sent successfully via /send-message');
                return res.status(200).json({ message: 'Order updated and message sent successfully' });
            } else {
                console.error('❌ Failed to send message via /send-message');
                return res.status(500).json({ error: 'Failed to send message' });
            }

        } catch (sendError) {
            console.error('❌ Error calling /send-message endpoint:', sendError.message);
            return res.status(500).json({ error: 'Error sending message to user' });
        }

    } catch (error) {
        console.error('❌ Error updating order:', error);
        res.status(500).json({ detail: 'Internal Server Error' });
    }
});

// Add Product
app.post('/api/products', async (req, res) => {
    const { id, name, price, category, inStock, description, imageUrl } = req.body;

    // Validate input
    if (!id || !name || !price || !category) {
        return res.status(400).json({ error: 'ID, name, price, and category are required.' });
    }

    // Convert price to an integer
    const priceInt = parseInt(price, 10);
    if (isNaN(priceInt)) {
        return res.status(400).json({ error: 'Price must be a valid number.' });
    }

    try {
        const newProduct = {
            id,
            name,
            price: priceInt,
            inStock: inStock || false,
            category,
            imageUrl,
            description
        };

        await data.addProduct(newProduct);
        res.status(201).json({ message: 'Product added successfully.' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Get Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await data.getProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Edit Product
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await data.getProductById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, category, inStock, description, imageUrl } = req.body;

    // Validate input
    if (!name && !price && !category) {
        return res.status(400).json({ error: 'At least one field (name, price, category) must be provided.' });
    }

    try {
        const updatedProduct = {};
        if (name) updatedProduct.name = name;

        // Convert price to an integer if provided
        if (price !== undefined) {
            const priceInt = parseInt(price, 10);
            if (isNaN(priceInt)) {
                return res.status(400).json({ error: 'Price must be a valid number.' });
            }
            updatedProduct.price = priceInt;
        }

        if (category) updatedProduct.category = category;
        if (inStock !== undefined) updatedProduct.inStock = inStock;
        if (description) updatedProduct.description = description;
        if (imageUrl) updatedProduct.imageUrl = imageUrl;

        await data.updateProduct(id, updatedProduct);
        res.json({ message: 'Product updated successfully.' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

        // Remove Product
        app.delete('/api/products/:id', async (req, res) => {
            const { id } = req.params;

            try {
                await data.removeProduct(id); // Ensure this function is defined correctly
                res.json({ message: 'Product removed successfully.' });
            } catch (error) {
                console.error('Error removing product:', error);
                res.status(500).json({ error: 'Failed to remove product' });
            }
        });

        // Update settings
        app.put('/api/settings', async (req, res) => {
            const { businessName, upiId, shippingCost, freeShippingAmount, supportNumber, adminNumbers } = req.body;
        
            try {
                // Update settings in the database
                await data.updateSettings({ businessName, upiId, shippingCost, freeShippingAmount, supportNumber, adminNumbers });
                console.log('Settings updated successfully.');
                
                res.json({ message: 'Settings updated successfully.' });
            } catch (error) {
                console.error('Error updating settings:', error);
                res.status(500).json({ error: 'Failed to update settings' });
            }
        });
        app.get('/api/settings', async (req, res) => {
            try {
                const settings = await data.getSettings(); // Call the getSettings function
                if (!settings) {
                    return res.status(404).json({ error: 'Settings not found' });
                }
                res.json(settings); // Return the settings as a JSON response
            } catch (error) {
                console.error('Error fetching settings:', error);
                res.status(500).json({ error: 'Failed to fetch settings' });
            }
        });

      // Get Customers
      app.get('/api/customers', async (req, res) => {
          try {
              const customers = await data.getCustomers(); // Ensure this function is defined correctly
              console.log(customers);
              res.json(customers);
          } catch (error) {
              console.error('Error fetching customers:', error);
              res.status(500).json({ error: 'Failed to fetch customers' });
          }
      });

      // Original EJS routes
      app.get('/', (req, res) => {
          res.render('index');
      });

      app.get('/admin', (req, res) => {
          res.render('admin');
      });

      // Start the server
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        setInterval(() => {
            axios.get(`https://bot-ir83.onrender.com/health`)
                .then(() => console.log("Self-ping successful"))
                .catch((err) => console.error("Self-ping failed:", err.message));
        }, 5 * 60 * 1000);
    
      });
  } catch (error) {
      console.error('❌ Failed to connect to the database:', error);
  }
}

// Start the server
startServer();
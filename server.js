// server.js
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import whatsappWeb from 'whatsapp-web.js'; // Import the entire module
import { connectDB, getDB } from './models/db.js'; // Import your connectDB and getDB functions
import data from './models/data.js'; // Import your data model functions
import { sendMessageToUser  } from './utils/sendMessage.js'; // Utility function to send messages

const { Client, MessageMedia, LocalAuth } = whatsappWeb;


const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');



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
            const { trackingNumber, deliveryDate } = req.body;
            try {
                await data.updateTrackingDeliveryDate(req.params.id, { trackingNumber, deliveryDate });
                const userPhone = req.body.userPhone; // Assuming you pass the user's phone number
                const message = `📦 Your order #${req.params.id} has been updated with tracking number: ${trackingNumber} and delivery date: ${deliveryDate}.`;
                await sendMessageToUser (userPhone, message);
                res.json({ message: 'Tracking information updated successfully.' });
            } catch (error) {
                console.error('Error updating tracking information:', error);
                res.status(500).json({ error: 'Failed to update tracking information' });
            }
        });
        let isClientReady = false;

client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
    isClientReady = true; // Set the flag when the client is ready
});

app.post('/api/messages/bulk', async (req, res) => {
    const { message, filter } = req.body;

    try {
        const db = getDB();
        const userPhonesCollection = db.collection('userPhones');

        // Fetch all phone numbers
        const userPhones = await userPhonesCollection.find({}).toArray();
        const phoneNumbers = userPhones.flatMap(user => user.phones); // Flatten the array of phone numbers

        // Send messages to each phone number
        let sentCount = 0;
        for (const phone of phoneNumbers) {
            const sendMessageResult = await sendMessageToUser (client, phone, message);
            if (sendMessageResult.success) {
                sentCount++;
            } else {
                console.error(`Failed to send message to ${phone}: ${sendMessageResult.error}`);
            }
        }

        res.status(200).json({ success: true, sent: sentCount });
    } catch (error) {
        console.error('Error sending bulk messages:', error);
        res.status(500).json({ success: false, error: 'Failed to send bulk messages' });
    }
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
        console.log("Sending message:", message);

        // Check if the client is ready before sending the message
        if (!isClientReady) {
            console.error('❌ Client is not ready to send messages.');
            return res.status(500).json({ error: 'Client is not ready to send messages.' });
        }

        // Send the message to the customer
        const sendMessageResult = await sendMessageToUser (client, userPhone, message); // Pass client as an argument
        if (!sendMessageResult.success) {
            console.error(`Failed to send message to ${userPhone}: ${sendMessageResult.error}`);
            return res.status(500).json({ error: sendMessageResult.error });
        }

        res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ detail: 'Internal Server Error' });
    }
});
        // Add Product
        app.post('/api/products', async (req, res) => {
            const { id, name, price, category, inStock, description } = req.body;

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
                    id, // Include the item code (ID)
                    name,
                    price: priceInt, // Store price as an integer
                    inStock: inStock || false, // Default to false if not provided
                    category,
                };

                await data.addProduct(newProduct); // Ensure this function is defined correctly
                res.status(201).json({ message: 'Product added successfully.' });
            } catch (error) {
                console.error('Error adding product:', error);
                res.status(500).json({ error: 'Failed to add product' });
            }
        });

        


        // Get Products
        app.get('/api/products', async (req, res) => {
            try {
                const products = await data.getProducts(); // Ensure this function is defined correctly
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
                const product = await data.getProductById(id); // Ensure this function is defined correctly
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
            const { name, price, category, inStock, description } = req.body;

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
                    updatedProduct.price = priceInt; // Store price as an integer
                }

                if (category) updatedProduct.category = category;
                if (inStock !== undefined) updatedProduct.inStock = inStock; // Allow boolean
                if (description) updatedProduct.description = description;

                await data.updateProduct(id, updatedProduct); // Ensure this function is defined correctly
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
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
      });
  } catch (error) {
      console.error('❌ Failed to connect to the database:', error);
  }
}

// Start the server
startServer();
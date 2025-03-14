import express from 'express';
import http from 'http';
import { Server } from 'socket.io'; // Import Socket.IO
import whatsappWeb from 'whatsapp-web.js'; // Import the entire module
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import path, { dirname } from 'path'; // Import dirname from path
import { fileURLToPath } from 'url'; // Import fileURLToPath from url
import fs from 'fs';
import cron from 'node-cron';
import moment from 'moment';
import { connectDB, getDB } from './models/db.js'; // Import MongoDB connection
import apiRoutes from './apiRoutes.js'; // Correct import
import config from './config.js'; // Import your config
import MongoAuth from './MongoAuth.js';
import cors from 'cors';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Destructure the required classes from the imported module
const { Client, MessageMedia, LocalAuth, List } = whatsappWeb;

// ✅ Express Server Setup
const app = express();
const server = http.createServer(app); // Create an HTTP server

app.use(cors()); // Enable CORS for all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // This will now work correctly


const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for testing; restrict in production
      methods: ['GET', 'POST']
    }
  });


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Adjust the path as necessary
    res.send('✅ Bot is alive!');
});

// ✅ Load Settings
let settings = {};
async function loadSettings() {
    try {
        const response = await fetch(`https://bot-ir83.onrender.com/api/settings`); // Adjust the URL as necessary
        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }
        settings = await response.json();
        console.log('✅ Loaded settings:', settings);
    } catch (error) {
        console.error('❌ Error loading settings:', error.message);
    }
}

(async () => {
    try {
        await connectDB(); // Ensure the database is connected
        console.log('✅ Connected to MongoDB');

        await loadSettings(); // Load settings after connecting to the database
        console.log('✅ Initial settings loaded');

        setInterval(async () => {
            try {
                console.log('🔄 Refreshing settings...');
                await loadSettings();
                console.log('✅ Settings refreshed');
            } catch (error) {
                console.error('❌ Failed to refresh settings:', error.message);
            }
        }, 600000); // Every 10 minutes

        await loadProducts(); // Load products after connecting to the database
        console.log('✅ Products loaded');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB or loading data:', error.message);
    }
})();

// Define collection names
const ordersCollectionName = 'orders'; // Replace with your actual orders collection name
const customersCollectionName = 'customers'; // Replace with your actual customers collection name
const productsCollectionName = 'products'; // If you have a products collection

// ✅ Load Products from MongoDB
let products = [];
async function loadProducts() {
    const db = getDB();
    const productsCollection = db.collection(productsCollectionName);
    products = await productsCollection.find({}).toArray();
    console.log(`✅ Products Loaded `); // Log the loaded products
}

// ✅ Load custom messages
let customMessages = {};
const messagesPath = './messages.json';
try {
    if (fs.existsSync(messagesPath)) {
        customMessages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
        console.log('✅ Custom messages loaded');
    } else {
        // Default messages
        customMessages = {
            welcome: "👋 Welcome to {businessName}! How can we assist you today?",
            orderConfirmed: "✅ Hi {customerName}, your order is verified!\n\n🛒 *Total*: ₹{amount}\n\n👉 *Pay Now:* {upiLink}\n\n📸 Share payment screenshot after payment.\n\nThank you for choosing {businessName}!",
            paymentReceived: "✅ Hi {customerName}, payment received!\n\n🎉 Order processing started. We will notify you upon shipping.\n\nFor help, contact: {supportNumber}",
            shippingInfo: "🚚 *Shipping Information*\n\n- Free shipping on orders above ₹{freeShippingAmount}\n- Standard shipping: ₹{shippingCost}\n- Delivery within 3-5 business days\n- Currently shipping to all major cities in India",
            orderTracking: "📦 *Order Tracking*\n\nTo track your order, please send your order ID in this format:\n\n*track:* [order ID]"
};
fs.writeFileSync(messagesPath, JSON.stringify(customMessages, null, 2));
}
} catch (err) {
console.error('❌ Error loading custom messages:', err.message);
}

// ✅ WhatsApp Client Setup
// const client = new Client({
//     authStrategy: new MongoAuth(), // 👈 Custom Mongo session handler
//     puppeteer: {
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     },
//   });
const client = new Client({
authStrategy: new LocalAuth(),
puppeteer: {
headless: true,
args: ['--no-sandbox', '--disable-setuid-sandbox'],
},
});
  
  // ✅ API Routes
  app.use('/api', apiRoutes);
  
  let qrCodeData = null;
  
  // ✅ WhatsApp Client Events
  client.on('qr', async (qr) => {
    console.log('📱 QR RECEIVED!');
    qrcodeTerminal.generate(qr, { small: true });
  
    try {
      // ✅ Update global qrCodeData
      qrCodeData = await QRCode.toDataURL(qr);
  
      // ✅ Emit latest QR code to frontend
      io.emit('qr', qrCodeData);
      io.emit('status', '📷 Scan the QR Code');
  
      // Optional: Clear old QR after 60 seconds (expiry window)
      setTimeout(() => {
        qrCodeData = null;
        io.emit('status', '⚠️ QR Code expired, waiting for refresh...');
      }, 60000);
    } catch (error) {
      console.error('❌ Error generating QR Code:', error.message);
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Frontend client connected');
  
    if (qrCodeData) {
      console.log('🟢 Sending QR to newly connected frontend');
      socket.emit('qr', qrCodeData);
      socket.emit('status', '📷 Scan the QR Code');
    } else {
      socket.emit('status', '⏳ Waiting for QR Code...');
    }
  });
  
  // ✅ Client Status Events
  client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
    io.emit('status', '✅ WhatsApp Connected');
  });
  
  client.on('authenticated', () => {
    console.log('🔐 Authenticated');
    io.emit('status', '🔐 Authenticated');
  });
  
  client.on('auth_failure', (msg) => {
    console.error('❌ Authentication Failure:', msg);
    io.emit('status', '❌ Authentication Failed');
  });
  
  client.on('disconnected', (reason) => {
    console.warn('❌ Client Disconnected:', reason);
    io.emit('status', '❌ WhatsApp Disconnected');
  
    // ✅ Reconnect after disconnect
    setTimeout(() => {
      console.log('♻️ Re-initializing client...');
      client.initialize();
    }, 5000);
  });
  


// ✅ Order Management Functions
async function generateOrderId() {
    const date = moment().format('YYMMDD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${date}-${random}`;
}

async function parseOrder(messageText) {
    const lines = messageText.split('\n').map(line => line.trim());
    const orderDetails = [];
    let subtotal = '', shipping = '', total = '';
    let customerInfo = {};

    // Extract customer details
    let inCustomerSection = false;
    for (const line of lines) {
        if (line.toLowerCase().includes('customer details:')) {
            inCustomerSection = true;
            continue;
        }
        
        if (inCustomerSection) {
            if (line.toLowerCase().includes('name:')) {
                customerInfo.name = line.split(':')[1].trim();
            } else if (line.toLowerCase().includes('address:')) {
                customerInfo.address = line.split(':')[1].trim();
            } else if (line.toLowerCase().includes('phone:')) {
                customerInfo.phone = line.split(':')[1].trim();
            } else if (line.toLowerCase().includes('email:')) {
                customerInfo.email = line.split(':')[1].trim();
            }
            
            // Exit customer section when we reach order details
            if (line.toLowerCase().includes('order details:')) {
                inCustomerSection = false;
            }
        }
    }

    lines.forEach(line => {
        const match = line.match(/-(.+?) x (\d+) = ₹(\d+).*?(\b\w{2,}-\d{3,}\b)/);
        if (match) {
            const [, name, quantity, price, id] = match;
            orderDetails.push({
                name: name.trim(),
                quantity: parseInt(quantity),
                price: parseInt(price),
                id: id.trim(),
            });
        }

        if (line.toLowerCase().startsWith('subtotal:')) {
            subtotal = line.split(':')[1].replace(/₹|,/g, '').trim();
        }

        if (line.toLowerCase().startsWith('shipping:')) {
            shipping = line.split(':')[1].replace(/₹|,/g, '').trim();
        }

        if (line.toLowerCase().startsWith('total:')) {
            total = line.split(':')[1].replace(/₹|,/g, '').trim();
        }
    });

    return {
        orderDetails,
        subtotal: parseInt(subtotal) || 0,
        shipping: parseInt(shipping) || 0,
        total: parseInt(total) || 0,
        customerInfo
    };
}

async function validateOrder(order) {
    let calculatedSubtotal = 0;
    for (const item of order.orderDetails) {
        console.log(`Validating item: ${item.name} (ID: ${item.id})`);
        const product = products.find(p => 
            p.id.trim().toLowerCase() === item.id.trim().toLowerCase() && 
            p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        console.log('Product found:', product); // Log the found product

        if (!product) {
            return { valid: false, reason: `❌ Invalid product: ${item.name} (${item.id})` };
        }

        if (!product.inStock) {
            return { valid: false, reason: `❌ Product out of stock: ${item.name} (${item.id})` };
        }

        const expectedPrice = product.price * item.quantity;

        if (expectedPrice !== item.price) {
            return {
                valid: false,
                reason: `❌ Price mismatch for ${item.name}. Expected ₹${expectedPrice}, got ₹${item.price}`
            };
        }

        calculatedSubtotal += expectedPrice;
    }

    if (calculatedSubtotal !== order.subtotal) {
        return {
            valid: false,
            reason: `❌ Subtotal mismatch. Expected ₹${calculatedSubtotal}, got ₹${order.subtotal}`
        };
    }

    // Calculate shipping cost
    let shippingCost = Number(settings.shippingCost); // Ensure this is a number
    if (calculatedSubtotal >= settings.freeShippingAmount) {
        shippingCost = 0; // Free shipping if eligible
    }

    // Log the calculated and order shipping costs
    console.log(`Calculated shipping cost: ₹${shippingCost}`);
    console.log(`Order shipping cost: ₹${order.shipping}`);

    // Convert order.shipping to a number, removing any currency symbols
    const orderShipping = Number(order.shipping); // Assuming order.shipping is already a number

    // Log the types of the values
    console.log(`Type of expected shipping cost: ${typeof shippingCost}`);
    console.log(`Type of actual shipping cost: ${typeof orderShipping}`);

    // Compare the shipping costs
    if (orderShipping !== shippingCost) {
        return {
            valid: false,
            reason: `❌ Shipping mismatch. Expected ₹${shippingCost}, got ₹${order.shipping}`
        };
    }

    const expectedTotal = calculatedSubtotal + shippingCost;

    if (order.total !== expectedTotal) {
        return {
            valid: false,
            reason: `❌ Total mismatch. Expected ₹${expectedTotal}, got ₹${order.total}`
        };
    }

    return { valid: true, amount: expectedTotal };
}

// ✅ UPI Payment Link & QR Generation
function generateUpiLink(amount, reference) {
    return `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.businessName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(reference)}`;
}

async function generateUpiQr(amount, reference) {
    const link = generateUpiLink(amount, reference);
    return await QRCode.toDataURL(link);
}

// ✅ Customer Management
async function updateCustomer(phone, data) {
    const customerNumber = phone.replace('@c.us', '');
    const db = getDB();
    const customersCollection = db.collection(customersCollectionName);
    const userPhonesCollection = db.collection('userPhones'); // New collection for user phone numbers

    // Check if the customer already exists
    const existingCustomer = await customersCollection.findOne({ phone: customerNumber });

    if (!existingCustomer) {
        // If the customer does not exist, create a new entry
        data.orderCount = 0;
        data.firstContactDate = new Date().toISOString();
        data.orders = [];
        
        // Insert the new customer
        await customersCollection.insertOne({ phone: customerNumber, ...data });

        // Add the phone number to the userPhones collection if it doesn't already exist
        const existingPhoneEntry = await userPhonesCollection.findOne({ phones: customerNumber });
        if (!existingPhoneEntry) {
            await userPhonesCollection.insertOne({ phones: [customerNumber] }); // Create a new entry with the phone number
        } else {
            // If the phone number already exists, ensure it is not duplicated
            const phoneExists = existingPhoneEntry.phones.includes(customerNumber);
            if (!phoneExists) {
                await userPhonesCollection.updateOne(
                    { phones: existingPhoneEntry.phones },
                    { $push: { phones: customerNumber } } // Add the new phone number to the array
                );
            }
        }
    } else {
        // If the customer exists, update their information
        await customersCollection.updateOne(
            { phone: customerNumber },
            { $set: { ...data, lastUpdateDate: new Date().toISOString() } }
        );
    }
}

// ✅ Save Order Function
async function saveOrder(order, userName, phone) {
    const orderRef = await generateOrderId();
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);

    const newOrder = {
        id: orderRef,
        timestamp: new Date().toISOString(),
        customer: userName,
        phone: phone.replace('@c.us', ''),
        status: 'pending_payment',
        ...order
    };

    await ordersCollection.insertOne(newOrder);
    console.log(`✅ Order saved for ${userName} - Order ID: ${orderRef}`);

    // Update customer record
    const customerData = await getCustomerData(phone);
    if (!customerData) {
        // If the customer does not exist, initialize their data
        await updateCustomer(phone, {
            name: userName,
            orderCount: 1, // Start with 1 order
            firstContactDate: new Date().toISOString(),
            lastOrderDate: new Date().toISOString(),
            orders: [orderRef],
            ...order.customerInfo
        });
    } else {
        // If the customer exists, update their information
        await updateCustomer(phone, {
            name: userName,
            orderCount: customerData.orderCount + 1,
            lastOrderDate: new Date().toISOString(),
            orders: [...customerData.orders, orderRef],
            ...order.customerInfo
        });
    }

    return orderRef;
}

// ✅ Get Customer Data
async function getCustomerData(phone) {
    const customerNumber = phone.replace('@c.us', '');
    const db = getDB();
    const customersCollection = db.collection(customersCollectionName);
    return await customersCollection.findOne({ phone: customerNumber });
}

// ✅ Update Order Status
async function updateOrderStatus(orderId, status) {
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);
    await ordersCollection.updateOne(
        { id: orderId },
        { $set: { status, updatedAt: new Date().toISOString() } }
    );
}

// ✅ Get Order By ID
async function getOrderById(orderId) {
    const db = getDB();
    const ordersCollection = db.collection(ordersCollectionName);
    
    // Normalize the orderId to uppercase
    const normalizedOrderId = orderId.toUpperCase();
    
    // Log the normalized orderId for debugging
    console.log("Fetching order with ID:", normalizedOrderId);
    
    // Query the database with the normalized order ID
    const order = await ordersCollection.findOne({ id: normalizedOrderId });
    
    // Log the fetched order
    console.log("Fetched order:", order);
    
    return order;
}

// ✅ Format message with variables
function formatMessage(template, variables) {
    let message = customMessages[template] || template;
    
    for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    
    return message;
}

// ✅ Send Product Catalog
async function sendProductCatalog(message, category = null) {
    try {
        let filteredProducts = products;
        console.log('Available products:', filteredProducts);

        // Filter products based on category
        if (category) {
            filteredProducts = products.filter(p => 
                p.category && p.category.toLowerCase() === category.toLowerCase() && p.inStock
            );
        } else {
            filteredProducts = products.filter(p => p.inStock);
        }

        if (filteredProducts.length === 0) {
            await message.reply('😔 No products available at the moment.');
            return;
        }

        // Group products by category
        const categories = {};
        filteredProducts.forEach(product => {
            const cat = product.category || 'Other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(product);
        });

        // Send category-wise messages
        for (const [categoryName, categoryProducts] of Object.entries(categories)) {
            let catalogMessage = `🛍️ *${categoryName}*\n\n`;

            categoryProducts.forEach(product => {
                catalogMessage += `*${product.name}*\n`;
                catalogMessage += `💰 Price: ₹${product.price}\n`;
                catalogMessage += `🏷️ ID: ${product.id}\n\n`;
            });

            catalogMessage += '\n📝 *How to place an order:*\n';
            catalogMessage += 'Just type:\n';
            catalogMessage += '*place order*\n\n';
            catalogMessage += '✅ Our team will guide you through the process!';
            

            await message.reply(catalogMessage);
            
            // Add small delay between messages to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (err) {
        console.error('❌ Error sending product catalog:', err);
        await message.reply('⚠️ Sorry, there was an error showing the product catalog. Please try again later.');
    }
}

// ✅ Order Placement Flow
const orderFlowState = {};

async function startOrderFlow(message, userName, phoneNumber) {
    try {
        // Reset any existing flow for this user
        orderFlowState[phoneNumber] = {
            step: 'start',
            items: [],
            customerInfo: {}
        };
        
        const welcomeText = 
            '🛒 *Order Placement*\n\n' +
            'I\'ll guide you through placing your order.\n\n' +
            'Do you want to see our product catalog first?';
        
        const buttons = new Buttons(
            welcomeText,
            [
                { body: 'Show catalog' },
                { body: 'I know what I want' }
            ],
            'Order Process',
            'Select an option'
        );
        
        await message.reply(buttons);
    } catch (err) {
        console.error('❌ Error starting order flow:', err.message);
        await message.reply('⚠️ Sorry, there was an error starting the order process. Please try again later.');
    }
}

async function processOrderFlow(message, msg, userName, phoneNumber) {
    try {
        if (!orderFlowState[phoneNumber]) {
            return false; // Not in order flow
        }
        
        const flow = orderFlowState[phoneNumber];
        
        switch (flow.step) {
            case 'start':
                if (msg.includes('show catalog')) {
                    await sendProductCatalog(message);
                    flow.step = 'collecting_items';
                    await message.reply(
                        '👆 Please browse the catalog above.\n\n' +
                        'When you\'re ready to add items to your order, send them in this format:\n' +
                        'add: [product ID] [quantity]\n\n' +
                        'Example: *add: SH-101 2*\n\n' +
                        'Type *done* when you have added all items.'
                    );
                    return true;
                } else if (msg.includes('i know what i want')) {
                    flow.step = 'collecting_items';
                    await message.reply(
                        '👍 Great! Please send your items in this format:\n' +
                        'add: [product ID] [quantity]\n\n' +
                        'Example: *add: SH-101 2*\n\n' +
                        'Type *done* when you have added all items.'
                    );
                    return true;
                }
                break;
                
            case 'collecting_items':
                if (msg.startsWith('add:')) {
                    const parts = msg.replace('add:', '').trim().split(' ');
                    if (parts.length < 2) {
                        await message.reply('⚠️ Please use the format: add: [product ID] [quantity]');
                        return true;
                    }
                    
                    const productId = parts[0];
                    const quantity = parseInt(parts[1]);
                    
                    if (isNaN(quantity) || quantity < 1) {
                        await message.reply('⚠️ Please enter a valid quantity (minimum 1)');
                        return true;
                    }
                    
                    const product = products.find(p => 
                        p.id.trim().toLowerCase() === item.id.trim().toLowerCase() && 
                        p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
                    );
                    if (!product) {
                        await message.reply(`❌ Product with ID "${productId}" not found. Please check and try again.`);
                        return true;
                    }
                    
                    if (!product.inStock) {
                        await message.reply(`❌ Sorry, "${product.name}" is currently out of stock.`);
                        return true;
                    }
                    
                    // Add to cart or update quantity
                    const existingItem = flow.items.find(item => item.id === product.id);
                    if (existingItem) {
                        existingItem.quantity += quantity;
                    } else {
                        flow.items.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            quantity
                        });
                    }
                    
                    await message.reply(`✅ Added ${quantity}x ${product.name} to your order.`);
                    
                    // Show current order summary
                    let orderSummary = '🛒 *Current Order*\n\n';
                    let subtotal = 0;
                    
                    flow.items.forEach(item => {
                        const itemTotal = item.price * item.quantity;
                        orderSummary += `- ${item.name} x ${item.quantity} = ₹${itemTotal}\n`;
                        subtotal += itemTotal;
                    });
                    
                    orderSummary += `\nSubtotal: ₹${subtotal}`;
                    
                    // Calculate shipping
                    const shipping = subtotal >= settings.freeShippingAmount ? 0 : settings.shippingCost;
                    orderSummary += `\nShipping: ₹${shipping}`;
                    orderSummary += `\nTotal: ₹${subtotal + shipping}`;
                    
                    orderSummary += '\n\nType *add: [product ID] [quantity]* to add more items, or *done* to proceed.';
                    
                    await message.reply(orderSummary);
                    return true;
                } else if (msg === 'done') {
                    if (flow.items.length === 0) {
                        await message.reply('⚠️ Your order is empty. Please add at least one item.');
                        return true;
                    }
                    
                    flow.step = 'collecting_info';
                    await message.reply(
                        '📝 *Customer Information*\n\n' +
                        'Please provide your details in this format:\n\n' +
                        'Name: [your name]\n' +
                        'Address: [your complete address with pincode]\n' +
                        'Phone: [your phone number]\n' +
                        'Email: [your email]'
                    );
                    return true;
                }
                break;
                
            case 'collecting_info':
                // Check if message has the expected format
                if (msg.includes('name:') && msg.includes('address:')) {
                    const info = {};
                    
                    const lines = msg.split('\n');
                    lines.forEach(line => {
                        if (line.toLowerCase().includes('name:')) {
                            info.name = line.split(':')[1].trim();
                        } else if (line.toLowerCase().includes('address:')) {
                            info.address = line.split(':')[1].trim();
                        } else if (line.toLowerCase().includes('phone:')) {
                            info.phone = line.split(':')[1].trim();
                        } else if (line.toLowerCase().includes('email:')) {
                            info.email = line.split(':')[1].trim();
                        }
                    });
                    
                    if (!info.name || !info.address) {
                        await message.reply('⚠️ Please provide at least your name and address.');
                        return true;
                    }
                    
                    flow.customerInfo = info;
                    flow.step = 'confirm_order';
                    
                    // Calculate totals
                    let subtotal = 0;
                    flow.items.forEach(item => {
                        subtotal += item.price * item.quantity;
                    });
                    
                    const shipping = subtotal >= settings.freeShippingAmount ? 0 : settings.shippingCost;
                    const total = subtotal + shipping;
                    
                    // Format order summary
                    let orderSummary = '📋 *Order Summary*\n\n';
                    orderSummary += '*Order Details:*\n';
                    
                    flow.items.forEach(item => {
                        orderSummary += `- ${item.name} x ${item.quantity} = ₹${item.price * item.quantity} (${item.id})\n`;
                    });
                    
                    orderSummary += `\nSubtotal: ₹${subtotal}\n`;
                    orderSummary += `Shipping: ₹${shipping}\n`;
                    orderSummary += `Total: ₹${total}\n\n`;
                    
                    orderSummary += '*Customer Details:*\n';
                    orderSummary += `Name: ${info.name}\n`;
                    orderSummary += `Address: ${info.address}\n`;
                    if (info.phone) orderSummary += `Phone: ${info.phone}\n`;
                    if (info.email) orderSummary += `Email: ${info.email}\n\n`;
                    
                    orderSummary += 'Is this correct? Type *confirm* to place your order or *edit* to make changes.';
                    
                    await message.reply(orderSummary);
                    return true;
                } else {
                    await message.reply(
                        '⚠️ Please provide your information in the correct format:\n\n' +
                        'Name: [your name]\n' +
                        'Address: [your complete address with pincode]\n' +
                        'Phone: [your phone number]\n' +
                        'Email: [your email]'
                    );
                    return true;
                }
                
            case 'confirm_order':
                if (msg === 'confirm') {
                    // Calculate totals
                    let subtotal = 0;
                    const orderDetails = [];
                    
                    flow.items.forEach(item => {
                        const itemTotal = item.price * item.quantity;
                        subtotal += itemTotal;
                        
                        orderDetails.push({
                            name: item.name,
                            quantity: item.quantity,
                            price: itemTotal,
                            id: item.id
                        });
                    });
                    
                    const shipping = subtotal >= settings.freeShippingAmount ? 0 : settings.shippingCost;
                    const total = subtotal + shipping;
                    
                    const order = {
                        orderDetails,
                        subtotal,
                        shipping,
                        total,
                        customerInfo: flow.customerInfo
                    };
                    
                    // Save order
                    const orderRef = await saveOrder(order, userName, phoneNumber);
                    
                    if (!orderRef) {
                        await message.reply('❌ There was an error saving your order. Please try again later.');
                        delete orderFlowState[phoneNumber];
                        return true;
                    }
                    
                    // Generate payment link and QR code
                    const upiLink = generateUpiLink(total, `Order-${orderRef}`);
                    const qrCodeBase64 = await generateUpiQr(total, `Order-${orderRef}`);
                    const qrMedia = new MessageMedia('image/png', qrCodeBase64.split(',')[1]);
                    
                    // Send confirmation message
                    const confirmationMsg = formatMessage('orderConfirmed', {
                        customerName: userName,
                        amount: total,
                        upiLink,
                        businessName: settings.businessName
                    });
                    
                    await message.reply(confirmationMsg);
                    await message.reply(qrMedia, '', { caption: `📲 Scan to pay ₹${total} for order #${orderRef}` });
                    
                    // Notify Admin
                    const adminNumbers = settings.adminNumbers.map(num => `${num}@c.us`);
                    for (const adminNumber of adminNumbers) {
                        await client.sendMessage(
                            adminNumber, 
                            `📦 *New Order #${orderRef} from ${userName}*\n\n` +
                            `*Customer*: ${flow.customerInfo.name}\n` +
                            `*Amount*: ₹${total}\n` +
                            `*Items*: ${flow.items.length}\n\n` +
                            'Order details on the admin dashboard.'
                        );
                    }
                    
                    // Clear order flow state
                    delete orderFlowState[phoneNumber];
                    return true;
                } else if (msg === 'edit') {
                    flow.step = 'collecting_items';
                    await message.reply(
                        '👍 Let\'s edit your order.\n\n' +
                        'To remove an item, type: *remove: [product ID]*\n' +
                        'To add an item, type: *add: [product ID] [quantity]*\n' +
                        'To clear your cart and start over, type: *clear*\n\n' +
                        'Type *done* when you have finished editing.'
                    );
                    return true;
                }
                break;
        }
        
        // Handle remove and clear commands during item collection
        if (flow.step === 'collecting_items') {
            if (msg.startsWith('remove:')) {
                const productId = msg.replace('remove:', '').trim();
                const initialLength = flow.items.length;
                flow.items = flow.items.filter(item => item.id.toLowerCase() !== productId.toLowerCase());
                
                if (flow.items.length < initialLength) {
                    await message.reply(`✅ Removed item with ID "${productId}" from your order.`);
                } else {
                    await message.reply(`⚠️ No item with ID "${productId}" found in your order.`);
                }
                return true;
            } else if (msg === 'clear') {
                flow.items = [];
                await message.reply('🧹 Your cart has been cleared. You can start adding items again.');
                return true;
            }
        }
        
        return false; // Not handled by order flow
    } catch (err) {
        console.error('❌ Error in order flow:', err.message);
        await message.reply('⚠️ Sorry, there was an error processing your order. Please try again later.');
        delete orderFlowState[phoneNumber];
        return true;
    }
}

// ✅ WhatsApp Message Handler
client.on('message', async (message) => {
    const userName = message.notifyName || message.pushName || 'Customer';
    const phoneNumber = message.from; // Sender's full identifier (e.g., '918113064544@c.us')
    const msg = message.body.trim().toLowerCase();

    // Clean the phone number to remove '@c.us'
    const cleanedPhoneNumber = phoneNumber.replace('@c.us', '');

    // Skip group messages (they usually have 'g.us' in the ID)
    if (phoneNumber.endsWith('@g.us')) {
        console.log(`⚠️ Ignored group message from: ${phoneNumber}`);
        return;
    }

    try {
        // Initialize database connection
        const db = getDB();
        const userPhonesCollection = db.collection('userPhones');

        // Check if the phone number already exists in userPhones collection
        const existingEntry = await userPhonesCollection.findOne({ phones: cleanedPhoneNumber });

        if (!existingEntry) {
            await userPhonesCollection.updateOne(
                {}, // Update the only document (or create one)
                { $addToSet: { phones: cleanedPhoneNumber } }, // Add number without duplicates
                { upsert: true } // Create if no document exists
            );
            console.log(`✅ Added new phone number to userPhones: ${cleanedPhoneNumber}`);
        }

        const cleanMsg = msg.toLowerCase().trim();

        if (
          cleanMsg === 'hi' || cleanMsg === 'hello' || cleanMsg === 'hey') {
          const welcomeMsg = formatMessage('welcome', {
            businessName: settings.businessName
          });
        
          const menuOptions =
            `${welcomeMsg}\n\n` +
            `Choose from these options:\n\n` +
            `1️⃣ Type *"how to order"* for ordering instructions\n` +
            `2️⃣ Type *"delivery"* for shipping information\n` +
            `3️⃣ Type *"track"* to track your order\n` +
            `4️⃣ Type *"products"* to view our catalog`;
        
          await message.reply(menuOptions);
          return;
        }

        // 🔵 CUSTOM MESSAGE REPLIES
        if (msg.includes('how to order')) {
            await message.reply(
                '🛒 *How to Order*\n\n' +
                '1. Browse our product catalog (type "products")\n' +
                '2. Type "place order" to start the order process\n' +
                '3. Add products to your cart\n' +
                '4. Provide your delivery information\n' +
                '5. Confirm and pay\n' +
                '6. Share payment screenshot\n\n' +
                'We\'ll process your order as soon as payment is confirmed!'
            );
            return;
        }

        if (msg === 'shipping' || msg.includes('delivery')) {
            const shippingMsg = formatMessage('shippingInfo', {
                freeShippingAmount: settings.freeShippingAmount,
                shippingCost: settings.shippingCost
            });

            await message.reply(shippingMsg);
            return;
        }

        if (msg.includes('products') || msg.includes('catalog')) {
            await sendProductCatalog(message);
            return;
        }

        // 🔵 START ORDER FLOW
        if (msg === 'place order') {
            const orderLink = `https://yourwebsite.com/place-order`; // Replace with your actual order link
            await message.reply(`To place your order, please visit: ${orderLink}`);
            return;
        }

        if (msg.toLowerCase() === 'track') {
            await message.reply(
                `📝 *Order Tracking Help*\n\n` +
                `To track your order, please use the following format:\n\n` +
                `*track:YOUR_ORDER_ID*\n\n` +
                `For example:\n` +
                `track:ABC123\n\n` +
                `Make sure to replace *YOUR_ORDER_ID* with your actual order ID.`
            );
            return;
        }

        // 🔵 TRACK ORDER
        if (msg.startsWith('track:')) {
            const orderId = msg.replace('track:', '').trim().toUpperCase();
            const order = await getOrderById(orderId);

            if (!order) {
                await message.reply(`❌ Order #${orderId} not found. Please check the order ID and try again.`);
                return;
            }

            let statusEmoji;
            switch (order.status) {
                case 'pending_payment': statusEmoji = '⏳ Pending Payment'; break;
                case 'processing': statusEmoji = '🔄 Processing'; break;
                case 'shipped': statusEmoji = '🚚 Shipped'; break;
                case 'delivered': statusEmoji = '✅ Delivered'; break;
                case 'cancelled': statusEmoji = '❌ Cancelled'; break;
                default: statusEmoji = '⏳ Pending';
            }

            let trackingInfo =
                `📦 *Order Tracking #${orderId}*\n\n` +
                `Status: ${statusEmoji}\n` +
                `Order Date: ${moment(order.timestamp).format('MMM DD, YYYY')}\n`;

            if (order.trackingNumber) {
                trackingInfo += `Tracking Number: ${order.trackingNumber}\n`;
            }

            if (order.estimatedDelivery) {
                trackingInfo += `Estimated Delivery: ${moment(order.estimatedDelivery).format('MMM DD, YYYY')}\n`;
            }

            const itemCount = Array.isArray(order.orderDetails) ? order.orderDetails.length : 0;

            trackingInfo += `\nItems: ${itemCount} products\n` +
                `Total: ₹${order.total}\n\n` +
                `For more details, contact customer support at ${settings.supportNumber}`;

            await message.reply(trackingInfo);
            return;
        }

        // 🔵 HANDLE FULL ORDER MESSAGE (Order + Customer Details)
        if (msg.includes('order details:') && msg.includes('customer details:')) {
            const order = await parseOrder(message.body);
            const validation = await validateOrder(order);

            if (!validation.valid) {
                console.log(`❌ Validation failed: ${validation.reason}`);
                await message.reply(`Hi ${userName},\n\n${validation.reason}\n\n⚠️ Please send correct order details.`);
                return;
            }

            const amount = validation.amount;
            const orderRef = await saveOrder(order, userName, phoneNumber);
            const upiLink = generateUpiLink(amount, `Order-${orderRef}`);
            const qrCodeBase64 = await generateUpiQr(amount, `Order-${orderRef}`);
            const qrMedia = new MessageMedia('image/png', qrCodeBase64.split(',')[1]);

            const confirmationMsg = formatMessage('orderConfirmed', {
                customerName: userName,
                amount,
                upiLink,
                businessName: settings.businessName
            });

            await message.reply(confirmationMsg);
            await message.reply(qrMedia, '', { caption: `📲 Scan to pay ₹${amount} for order #${orderRef}` });

            const adminNumbers = settings.adminNumbers.map(num => `${num}@c.us`);
            for (const adminNumber of adminNumbers) {
                await client.sendMessage(adminNumber, `📦 *New Order #${orderRef} from ${userName}*\n\n${message.body}`);
            }
            return;
        }

        // 🔵 PAYMENT SCREENSHOT HANDLER
        if (message.hasMedia) {
            const media = await message.downloadMedia();
            const adminNumbers = settings.adminNumbers.map(num => `${num}@c.us`);

            for (const adminNumber of adminNumbers) {
                await client.sendMessage(adminNumber, media, {
                    caption: `💸 Payment screenshot from ${userName}`
                });
            }

            const paymentMsg = formatMessage('paymentReceived', {
                customerName: userName,
                supportNumber: settings.supportNumber
            });

            await message.reply(paymentMsg);
            return;
        }

        // 🔵 EXAMPLE OF QUOTING A MESSAGE
        if (msg.includes('some specific text')) {
            try {
                await client.sendMessage(phoneNumber, 'Your response here', {
                    quotedMessageId: message.id._serialized
                });
            } catch (err) {
                console.error('Error sending quoted message:', err.message);
                await message.reply('⚠️ Sorry, I couldn\'t send your message. Please try again.');
            }
            return;
        }

        // 🔵 DEFAULT FALLBACK
        await message.reply(`⚠️ Sorry ${userName}, I didn't understand your request. Please type *"hi"* to see options.`);

    } catch (err) {
        console.error(`❌ Error processing message from ${userName}:`, err.message);
        await message.reply(`⚠️ Hi ${userName}, an error occurred. Please try again later.`);
    }
});


            
            // ✅ Scheduled tasks
            // Daily orders summary at 9PM
            cron.schedule('0 21 * * *', async () => {
                try {
                    const db = getDB();
                    const ordersCollection = db.collection(ordersCollectionName);
                    
                    const today = moment().startOf('day');
                    
                    // Filter today's orders
                    const todayOrders = await ordersCollection.find({
                        timestamp: { $gte: today.toISOString() }
                    }).toArray();
                    
                    if (todayOrders.length === 0) return;
                    
                    // Generate summary
                    let summary = 
                        `📊 *Daily Orders Summary*\n` +
                        `Date: ${today.format('MMM DD, YYYY')}\n\n` +
                        `Total Orders: ${todayOrders.length}\n`;
                    
                    // Calculate total revenue
                    const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
                    summary += `Total Revenue: ₹${revenue}\n\n`;
                    
                    // Status breakdown
                    const statusCounts = {};
                    todayOrders.forEach(order => {
                        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
                    });
                    
                    summary += '*Order Status:*\n';
                    for (const [status, count] of Object.entries(statusCounts)) {
                        summary += `- ${status}: ${count}\n`;
                    }
            
                    function safeChatId(number) {
                        // Remove any non-numeric characters including '+'
                        const cleaned = number.toString().replace(/\D/g, '');
                        
                        // Ensure valid length (10 digits with country code = 12 digits total)
                        if (cleaned.length === 12) {
                            return `${cleaned}@c.us`;
                        }
                        
                        console.error(`Invalid phone number format: ${number}`);
                        return null;
                    }
                    
                    // Send to admin
                    const adminNumbers = settings.adminNumbers.map(num => safeChatId(num)).filter(Boolean);
                    for (const adminChatId of adminNumbers) {
                        await client.sendMessage(adminChatId, summary);
                        console.log('✅ Daily orders summary sent to admin');
                    }
                } catch (err) {
                    console.error('❌ Error sending daily summary:', err.message);
                }
            });
            
            // Weekly orders backup
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
            
            setInterval(async () => {
                try {
                    const db = getDB();
                    const ordersCollection = db.collection(ordersCollectionName);
                    const customersCollection = db.collection(customersCollectionName);
            
                    const orders = await ordersCollection.find({}).toArray();
                    const customers = await customersCollection.find({}).toArray();
            
                    const ordersBackup = new MessageMedia('application/json', Buffer.from(JSON.stringify(orders)).toString('base64'), 'orders.json');
                    const customersBackup = new MessageMedia('application/json', Buffer.from(JSON.stringify(customers)).toString('base64'), 'customers.json');
            
                    const adminNumbers = settings.adminNumbers.map(num => `${num}@c.us`);
                    for (const adminNumber of adminNumbers) {
                        await client.sendMessage(adminNumber, ordersBackup, { caption: '📁 Weekly Orders Backup' });
                        await client.sendMessage(adminNumber, customersBackup, { caption: '📁 Weekly Customers Backup' });
                    }
            
                    console.log('✅ Weekly backup sent to admin');
                } catch (err) {
                    console.error('❌ Failed to send weekly backup:', err.message);
                }
            }, oneWeekMs);
            
            // ✅ Inactive customers reminder (every 21 days)
            cron.schedule('0 12 */7 * *', async () => {
                try {
                    const db = getDB();
                    const customersCollection = db.collection(customersCollectionName);
                    const threeWeeksAgo = moment().subtract(21, 'days');
                    const inactiveCustomers = [];
            
                    // Find inactive customers who have ordered before
                    const allCustomers = await customersCollection.find({}).toArray();
                    for (const customer of allCustomers) {
                        if (customer.orderCount > 0 && customer.lastOrderDate) {
                            const lastOrder = moment(customer.lastOrderDate);
                            if (lastOrder.isBefore(threeWeeksAgo)) {
                                inactiveCustomers.push({
                                    phone: customer.phone,
                                    name: customer.name || 'Customer',
                                    lastOrder: lastOrder.format('MMM DD, YYYY')
                                });
                            }
                        }
                    }
            
                    // Send reminders (max 10 per day to avoid spam detection)
                    const batchToSend = inactiveCustomers.slice(0, 10);
                    
                    for (const customer of batchToSend) {
                        try {
                            const chatId = `${customer.phone}@c.us`;
                            await client.sendMessage(
                                chatId,
                                `👋 Hello ${customer.name}!\n\n` +
                                `We miss you at ${settings.businessName}. It's been a while since your last order on ${customer.lastOrder}.\n\n` +
                                `*Check out our new products!* Type "products" to see what's new.\n\n` +
                                `Use code *WELCOME10* for 10% off your next order.`
                            );
            
                            // Update customer record with reminder date
                            await updateCustomer(chatId, {
                                lastReminderDate: new Date().toISOString()
                            });
            
                            // Add small delay between messages
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        } catch (err) {
                            console.error(`Failed to send reminder to ${customer.phone}:`, err.message);
                        }
                    }
            
                    console.log(`✅ Sent reminders to ${batchToSend.length} inactive customers`);
                } catch (err) {
                    console.error('❌ Error sending inactive customer reminders:', err.message);
                }
            });
            
            
            // ✅ Start WhatsApp Client & Server
            client.initialize();
            server.listen(config.PORT, () => {
                console.log(`🚀 Server is running at http://localhost:${config.PORT}`);
            });
            

export { client };




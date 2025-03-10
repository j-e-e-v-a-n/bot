// Required Modules
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

// Configurations & Data
const config = require('./config');
const products = JSON.parse(fs.readFileSync('./products.json', 'utf-8'));

// Orders file path
const ordersFilePath = './orders.json';

// Express Setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (index.html)
app.use(express.static(path.join(__dirname, 'public')));

// WhatsApp Client Setup
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Socket.io QR Tracking
let qrCodeData = null;

// Express Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WhatsApp Events
client.on('qr', async qr => {
  console.log('📱 QR RECEIVED!');
  qrcodeTerminal.generate(qr, { small: true });

  try {
    qrCodeData = await QRCode.toDataURL(qr);
    io.emit('qr', qrCodeData);
    io.emit('status', '📷 Scan the QR Code');
  } catch (error) {
    console.error('❌ Error generating QR Code:', error);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
  io.emit('status', '✅ WhatsApp Connected');
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated');
  io.emit('status', '🔐 Authenticated');
});

client.on('auth_failure', msg => {
  console.error('❌ Authentication Failure:', msg);
  io.emit('status', '❌ Authentication Failed');
});

client.on('disconnected', reason => {
  console.warn('❌ Client Disconnected:', reason);
  io.emit('status', '❌ WhatsApp Disconnected');
});

// Function: Parse Order Details
function parseOrder(messageText) {
  const lines = messageText.split('\n').map(line => line.trim());
  const orderDetails = [];

  let subtotal = '';
  let shipping = '';
  let total = '';

  lines.forEach(line => {
    const match = line.match(/-(.+?) x (\d+) = ₹(\d+).*?(\b\w{2,}-\d{3,}\b)/);
    if (match) {
      const [, name, quantity, price, id] = match;
      orderDetails.push({
        name: name.trim(),
        quantity: parseInt(quantity),
        price: parseInt(price),
        id: id.trim()
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
    total: parseInt(total) || 0
  };
}

// Function: Validate Order
function validateOrder(order) {
  let calculatedSubtotal = 0;

  for (const item of order.orderDetails) {
    const product = products.find(p => p.id === item.id && p.name === item.name);

    if (!product) {
      return { valid: false, reason: `❌ Invalid product: ${item.name} (${item.id})` };
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

  if (order.shipping !== config.SHIPPING_COST) {
    return {
      valid: false,
      reason: `❌ Shipping cost mismatch. Expected ₹${config.SHIPPING_COST}, got ₹${order.shipping}`
    };
  }

  const expectedTotal = calculatedSubtotal + config.SHIPPING_COST;

  if (order.total !== expectedTotal) {
    return {
      valid: false,
      reason: `❌ Total amount mismatch. Expected ₹${expectedTotal}, got ₹${order.total}`
    };
  }

  return { valid: true, amount: expectedTotal };
}

// Function: Generate UPI Link
function generateUpiLink(amount) {
  return `upi://pay?pa=${config.UPI_ID}&pn=${encodeURIComponent(config.BUSINESS_NAME)}&am=${amount}&cu=INR`;
}

// Function: Generate UPI QR (Base64 Image)
async function generateUpiQr(amount) {
  const link = generateUpiLink(amount);
  return await QRCode.toDataURL(link);
}

// Function: Save Order to File
function saveOrder(order, userName) {
  let orders = [];

  try {
    if (fs.existsSync(ordersFilePath)) {
      orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
    }
  } catch (err) {
    console.error('❌ Failed to read orders file:', err);
  }

  orders.push({
    timestamp: new Date().toISOString(),
    customer: userName,
    ...order
  });

  try {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('❌ Failed to save order:', err);
  }
}

// WhatsApp Message Handler
client.on('message', async message => {
  const userName = message.notifyName || message.pushName || 'there';
  const msg = message.body.toLowerCase();

  try {
    // Order Processing
    if (msg.includes('order details:') && msg.includes('customer details:')) {
      const order = parseOrder(message.body);
      const validation = validateOrder(order);

      if (!validation.valid) {
        console.log(`❌ Validation Failed: ${validation.reason}`);
        await message.reply(`Hi ${userName},\n\n${validation.reason}\n\n⚠️ Please ensure the order is correct.`);
        return;
      }

      const amount = validation.amount;
      const upiLink = generateUpiLink(amount);
      const qrCodeBase64 = await generateUpiQr(amount);
      const qrMedia = new MessageMedia('image/png', qrCodeBase64.split(',')[1]);

      saveOrder(order, userName);

      // Notify Customer
      await message.reply(
        `✅ Hi ${userName}, your order is verified!\n\n` +
        `🛒 Total Amount: ₹${amount}\n\n` +
        `Please pay via the link below or scan the attached QR Code.\n\n` +
        `👉 *Click here to pay:* ${upiLink}\n\n` +
        `After payment, kindly send the screenshot for confirmation.\n\n` +
        `Thank you for shopping with ${config.BUSINESS_NAME}!`
      );

      // Send QR Code
      await message.reply(qrMedia, '', { caption: `📲 Hi ${userName}, scan this QR Code to pay!` });

      // Forward Order Message to Admin
      const adminNumber = `${config.ADMIN_NUMBER}@c.us`;
      await client.sendMessage(adminNumber, `📦 *New Order from ${userName}*\n\n${message.body}`);

      return;
    }

    // Payment Screenshot Detection
    if (message.hasMedia) {
      console.log(`✅ Payment screenshot received from ${userName}.`);

      const media = await message.downloadMedia();
      const adminNumber = `${config.ADMIN_NUMBER}@c.us`;

      await client.sendMessage(adminNumber, media, {
        caption: `💸 Payment screenshot from ${userName}`
      });

      await message.reply(
        `✅ Hi ${userName}, payment screenshot received!\n\n` +
        `🎉 Your order is now being processed!\n\n` +
        `We will notify you once it's shipped.\n\n` +
        `Need help? Contact: ${config.SUPPORT_NUMBER}`
      );

      return;
    }

    // Greetings Handler
    if (/hi|hello|hey/gi.test(msg)) {
      await message.reply(
        `👋 Hi ${userName}, welcome to ${config.BUSINESS_NAME}!\n\n` +
        `How can we help you today?\n\n` +
        `For order queries, share your order details.\n\n` +
        `For support, contact: ${config.SUPPORT_NUMBER}`
      );
    }

  } catch (err) {
    console.error(`❌ Error handling message from ${userName}:`, err);
    await message.reply(`⚠️ Hi ${userName}, something went wrong. Please try again later!`);
  }
});

// Weekly task to send orders.json to admin
const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

setInterval(async () => {
  if (fs.existsSync(ordersFilePath)) {
    try {
      const fileData = fs.readFileSync(ordersFilePath);
      const base64Data = fileData.toString('base64');

      const media = new MessageMedia('application/json', base64Data, 'orders.json');

      const adminNumber = `${config.ADMIN_NUMBER}@c.us`;
      await client.sendMessage(adminNumber, media, { caption: '📁 Weekly Orders Backup' });

      console.log('✅ Weekly orders.json sent to admin');
    } catch (err) {
      console.error('❌ Failed to send weekly orders.json:', err);
    }
  }
}, oneWeek);

// Initialize WhatsApp Client
client.initialize();

// Start Express Server
server.listen(config.PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${config.PORT}`);
});

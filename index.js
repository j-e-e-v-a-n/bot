const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');
const fs = require('fs');

// Load product data
const products = JSON.parse(fs.readFileSync('./products.json'));

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox'] }
});

let qrCodeData = null;

// Events
client.on('qr', async qr => {
  qrcode.generate(qr, { small: true });
  qrCodeData = await QRCode.toDataURL(qr);
  io.emit('qr', qrCodeData);
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot ready!');
  io.emit('status', 'WhatsApp Connected');
});

client.on('disconnected', reason => {
  console.warn('❌ Disconnected:', reason);
  io.emit('status', 'WhatsApp Disconnected');
});

// Parse and verify order
function parseOrder(message) {
  const lines = message.split('\n').map(line => line.trim());

  const orderDetails = [];
  let subtotalText = '';
  let shippingText = '';
  let totalText = '';

  lines.forEach(line => {
    if (line.startsWith('-')) {
      // Example: "-Green Cardamom (100g) x 1 = ₹999 - GC-001"
      const match = line.match(/-(.+?) x (\d+) = ₹(\d+).*?(\b\w{2,}-\d{3,}\b)/);
      if (match) {
        const [_, name, quantity, price, id] = match;
        orderDetails.push({
          name: name.trim(),
          quantity: parseInt(quantity),
          price: parseInt(price),
          id: id.trim()
        });
      }
    }
    if (line.toLowerCase().startsWith('subtotal:')) {
      subtotalText = line.split(':')[1].replace(/₹|,/g, '').trim();
    }
    if (line.toLowerCase().startsWith('shipping:')) {
      shippingText = line.split(':')[1].replace(/₹|,/g, '').trim();
    }
    if (line.toLowerCase().startsWith('total:')) {
      totalText = line.split(':')[1].replace(/₹|,/g, '').trim();
    }
  });

  return {
    orderDetails,
    subtotal: parseInt(subtotalText),
    shipping: parseInt(shippingText),
    total: parseInt(totalText)
  };
}

function validateOrder(order) {
  let calculatedSubtotal = 0;

  for (const item of order.orderDetails) {
    const product = products.find(p => p.id === item.id && p.name === item.name);

    if (!product) {
      return { valid: false, reason: `❌ Invalid product ID or name: ${item.name} (${item.id})` };
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
      reason: `❌ Shipping mismatch. Expected ₹${config.SHIPPING_COST}, got ₹${order.shipping}`
    };
  }

  const expectedTotal = calculatedSubtotal + config.SHIPPING_COST;

  if (order.total !== expectedTotal) {
    return {
      valid: false,
      reason: `❌ Total mismatch. Expected ₹${expectedTotal}, got ₹${order.total}`
    };
  }

  return { valid: true, amount: expectedTotal };
}

// Create UPI Payment Link
function generateUpiLink(amount) {
  const upiLink = `upi://pay?pa=${config.UPI_ID}&pn=${config.BUSINESS_NAME}&am=${amount}&cu=INR`;
  return upiLink;
}

// Create UPI QR Code Image (base64)
async function generateUpiQr(amount) {
  const link = generateUpiLink(amount);
  return await QRCode.toDataURL(link);
}

// Handle Messages
client.on('message', async message => {
  const msg = message.body.toLowerCase();

  // New order detected
  if (msg.includes('order details:') && msg.includes('customer details:')) {
    const order = parseOrder(message.body);
    const validation = validateOrder(order);

    if (!validation.valid) {
      console.log(`❌ Validation failed for order: ${validation.reason}`);
      await message.reply(validation.reason + '\n\n⚠️ Please ensure the order is not tampered.');
      return;
    }

    const amount = validation.amount;
    const upiLink = generateUpiLink(amount);
    const qrCodeBase64 = await generateUpiQr(amount);

    const qrMedia = new MessageMedia('image/png', qrCodeBase64.split(',')[1]);

    await message.reply(
      `✅ Order verified!\n\n` +
      `🛒 Total: ₹${amount}\n\n` +
      `Please pay using the link below or scan the QR code:\n\n` +
      `${upiLink}\n\n` +
      `After payment, send the screenshot to confirm.`
    );

    await message.reply(qrMedia, '', { caption: 'Scan to pay' });

    return;
  }

  // Payment screenshot detected
  if (message.hasMedia) {
    await message.reply(
      `✅ Payment confirmation received!\n\n` +
      `Your order is now being processed. We will notify you with updates soon! 🙏\n\n` +
      `For help, contact ${config.SUPPORT_NUMBER}`
    );

    return;
  }

  // Greetings
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    await message.reply(
      `👋 Welcome to ${config.BUSINESS_NAME}!\n\n` +
      `How can we assist you today?\n\n` +
      `For help: ${config.SUPPORT_NUMBER}`
    );
  }
});

// Initialize
client.initialize();

// Start Express Server
server.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
});

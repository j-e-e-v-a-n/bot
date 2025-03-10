const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const basicAuth = require('express-basic-auth');
const QRCode = require('qrcode');
const config = require('./config');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://bot-blond-rho.vercel.app', // Replace with your frontend domain
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Basic authentication for the frontend UI (optional)
app.use(basicAuth({
  users: { [config.WEB_USERNAME]: config.WEB_PASSWORD },
  challenge: true
}));

// Serve HTML (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/ping', (req, res) => {
  console.log('📡 Ping from:', req.ip, 'at', new Date().toISOString());
  res.send('✅ Bot is alive!');
});

// Initialize WhatsApp client with session persistence
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// Store latest QR code
let qrCodeData = null;

// WhatsApp Events
client.on('qr', async (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('✅ QR Code generated.');

  try {
    qrCodeData = await QRCode.toDataURL(qr);
    io.emit('qr', qrCodeData);
  } catch (error) {
    console.error('❌ Error generating QR image:', error);
  }
});

client.on('ready', () => {
  console.log('🚀 WhatsApp bot ready!');
  io.emit('status', 'WhatsApp Connected');
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated!');
});

client.on('auth_failure', (error) => {
  console.error('❌ Authentication failed:', error);
});

client.on('disconnected', (reason) => {
  console.warn('❌ Client disconnected:', reason);
  io.emit('status', 'WhatsApp Disconnected');
});

// Message handling
client.on('message', async (message) => {
  const msg = message.body.toLowerCase();

  // Order handling
  if (msg.includes('order details:') && msg.includes('customer details:')) {
    try {
      await message.reply(
        `Thank you for your order at ${config.BUSINESS_NAME}! 🙏\n\n` +
        `Please complete your payment via UPI:\n\n` +
        `UPI ID: ${config.UPI_ID}\n\n` +
        `After payment, send a screenshot for confirmation.\n\n` +
        `Support: ${config.SUPPORT_NUMBER}`
      );

      const paymentQR = MessageMedia.fromFilePath(config.PAYMENT_QR_PATH);
      await message.reply(paymentQR, '', {
        caption: 'Scan this QR to pay'
      });
    } catch (error) {
      console.error('❌ Error sending order response:', error);
      await message.reply('Sorry! We faced an issue processing your order. Please contact support.');
    }
  }

  // Payment confirmation
  else if (message.hasMedia) {
    await message.reply(
      `Thank you for the payment confirmation! 🙂\n\n` +
      `We are processing your order and will update you soon.\n\n` +
      `For queries: ${config.SUPPORT_NUMBER}`
    );
  }

  // Greetings
  else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    await message.reply(
      `Welcome to ${config.BUSINESS_NAME}! 👋\n\n` +
      `How can we help you today?\n\n` +
      `Support: ${config.SUPPORT_NUMBER}`
    );
  }

  // Support query
  else if (msg.includes('query') || msg.includes('help') || msg.includes('support')) {
    await message.reply(
      `Our support team is ready to help! 😊\n\n` +
      `Contact: ${config.SUPPORT_NUMBER}`
    );
  }
});

// Initialize client
client.initialize();

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);
  
  // Send existing QR (if available)
  if (qrCodeData) {
    socket.emit('qr', qrCodeData);
  }

  socket.on('disconnect', (reason) => {
    console.log(`❌ Client ${socket.id} disconnected: ${reason}`);
  });
});

// Start the server
server.listen(config.PORT, () => {
  console.log(`✅ Server running on port ${config.PORT}`);
});

console.log('🚀 WhatsApp bot starting...');

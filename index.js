const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const basicAuth = require('express-basic-auth');
const QRCode = require('qrcode');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');

// Express app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // allow frontend from anywhere, restrict in production!
    methods: ['GET', 'POST']
  }
});

// Basic auth for HTTP routes (optional)
app.use(basicAuth({
  users: { [config.WEB_USERNAME]: config.WEB_PASSWORD },
  challenge: true
}));

// Serve static files if needed
app.use(express.static(path.join(__dirname, 'public')));

// Default route (optional)
app.get('/', (req, res) => {
  res.send('WhatsApp bot backend is running!');
});

// WhatsApp Client init
const client = new Client({
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

let qrCodeData = null;

// Listen for QR code event
client.on('qr', async (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('QR code generated. Scan it using WhatsApp.');

  try {
    qrCodeData = await QRCode.toDataURL(qr);
    io.emit('qr', qrCodeData);
  } catch (err) {
    console.error('QR Code generation error:', err);
  }
});

// Ready event
client.on('ready', () => {
  console.log('WhatsApp bot is ready!');
  io.emit('status', 'WhatsApp Connected');
});

// Handle incoming messages
client.on('message', async (message) => {
  const content = message.body.toLowerCase();

  if (content.includes('order details:') && content.includes('customer details:')) {
    try {
      await message.reply(
        `Thank you for your order at ${config.BUSINESS_NAME}! 🙏\n\n` +
        `Please complete the payment:\n` +
        `UPI ID: ${config.UPI_ID}\n\n` +
        `Send payment screenshot after payment.\n\n` +
        `Support: ${config.SUPPORT_NUMBER}`
      );

      const paymentQR = MessageMedia.fromFilePath(config.PAYMENT_QR_PATH);
      await message.reply(paymentQR, '', {
        caption: 'Scan this QR code to pay'
      });
    } catch (error) {
      console.error('Payment details error:', error);
      await message.reply('Error processing your order. Contact support.');
    }
  } else if (message.hasMedia) {
    await message.reply(
      "Thanks for the payment confirmation! 🙂\n" +
      "We're processing your order.\n\n" +
      `Support: ${config.SUPPORT_NUMBER}`
    );
  } else if (content.includes('hi') || content.includes('hello') || content.includes('hey')) {
    await message.reply(
      `Welcome to ${config.BUSINESS_NAME}! 👋\n` +
      `Support: ${config.SUPPORT_NUMBER}`
    );
  } else if (content.includes('query') || content.includes('help')) {
    await message.reply(
      `Please contact our support team: ${config.SUPPORT_NUMBER}\nWe're here to help!`
    );
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Frontend client connected');
  if (qrCodeData) {
    socket.emit('qr', qrCodeData);
  }
});

// Start WhatsApp client and HTTP server
client.initialize();
server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

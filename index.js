const { Client, MessageMedia } = require('whatsapp-web.js');
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
        origin: '*', // adjust this if you want to restrict Vercel domain
    }
});

// Setup basic authentication for the web interface
app.use(basicAuth({
    users: { [config.WEB_USERNAME]: config.WEB_PASSWORD },
    challenge: true
}));

// Serve the HTML UI for QR display (optional)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Optional: Health check endpoint to ping from Vercel
app.get('/ping', (req, res) => {
    console.log('📡 HTTP Ping received from:', req.ip, 'at', new Date().toISOString());
    res.send('✅ Bot is alive!');
});

// Initialize WhatsApp client
const client = new Client();

// Store QR code data globally
let qrCodeData = null;

// WhatsApp QR Code Event
client.on('qr', async (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('✅ QR Code generated. Please scan with WhatsApp.');

    try {
        qrCodeData = await QRCode.toDataURL(qr);
        io.emit('qr', qrCodeData);
    } catch (err) {
        console.error('❌ Error generating QR code image:', err);
    }
});

// WhatsApp Ready Event
client.on('ready', () => {
    console.log('🚀 WhatsApp bot is ready!');
    io.emit('status', 'WhatsApp Connected');
});

// WhatsApp Message Handling
client.on('message', async (message) => {
    const messageContent = message.body.toLowerCase();

    // Order message
    if (messageContent.includes('order details:') && messageContent.includes('customer details:')) {
        try {
            await message.reply(
                `Thank you for your order at ${config.BUSINESS_NAME}! 🙏\n\n` +
                `Please complete the payment using the following details:\n\n` +
                `UPI ID: ${config.UPI_ID}\n\n` +
                `After payment, please send the screenshot of the payment confirmation.\n\n` +
                `For any queries, contact: ${config.SUPPORT_NUMBER}`
            );

            const paymentQR = MessageMedia.fromFilePath(config.PAYMENT_QR_PATH);
            await message.reply(paymentQR, '', {
                caption: 'Scan this QR code to pay'
            });

        } catch (error) {
            console.error('❌ Error sending payment details:', error);
            await message.reply('Sorry, there was an error processing your order. Please contact support.');
        }
    }

    // Payment confirmation (media)
    else if (message.hasMedia) {
        await message.reply(
            "Thank you for the payment confirmation! 🙂\n\n" +
            "We are processing your order and will get back to you shortly.\n\n" +
            `If you have any questions, please contact: ${config.SUPPORT_NUMBER}`
        );
    }

    // General greetings
    else if (messageContent.includes('hi') || messageContent.includes('hello') || messageContent.includes('hey')) {
        await message.reply(
            `Welcome to ${config.BUSINESS_NAME}! 👋\n\n` +
            `For any queries, please contact: ${config.SUPPORT_NUMBER}`
        );
    }

    // Support query
    else if (messageContent.includes('query') || messageContent.includes('help') || messageContent.includes('support')) {
        await message.reply(
            `Please contact our support team at: ${config.SUPPORT_NUMBER}\n\n` +
            `We're here to help! 😊`
        );
    }
});

// Initialize the WhatsApp client
client.initialize();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('⚡ Web client connected:', socket.id);

    // Optional: Log origin (not always reliable with CORS)
    const origin = socket.handshake.headers.origin;
    console.log('🌐 Connection origin:', origin);

    // Send the QR code if it's already generated
    if (qrCodeData) {
        socket.emit('qr', qrCodeData);
    }

    // Listen for pings from the Vercel frontend
    socket.on('ping', (data) => {
        console.log('🔔 Ping received from Vercel:', data);
    });

    // Listen for any custom messages from the Vercel frontend
    socket.on('message', (data) => {
        console.log('💬 Message received from Vercel:', data);
    });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id}. Reason: ${reason}`);
    });
});

// Start server
server.listen(config.PORT, () => {
    console.log(`✅ Server running on port ${config.PORT}`);
});

console.log('🚀 WhatsApp bot is starting...');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
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
        origin: '*',
    }
});

// Basic authentication for the web interface
app.use(basicAuth({
    users: { [config.WEB_USERNAME]: config.WEB_PASSWORD },
    challenge: true
}));

// Serve QR UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/ping', (req, res) => {
    console.log('📡 Ping from:', req.ip);
    res.send('✅ Bot is alive!');
});

// Initialize WhatsApp client with LocalAuth for persistent sessions
const client = new Client({
    authStrategy: new LocalAuth(),   // Persistent login!
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

let qrCodeData = null;

// QR code event
client.on('qr', async (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('✅ QR Code generated! Scan it.');

    try {
        qrCodeData = await QRCode.toDataURL(qr);
        io.emit('qr', qrCodeData);
    } catch (err) {
        console.error('❌ QR generation failed:', err);
    }
});

// Ready event
client.on('ready', () => {
    console.log('🚀 WhatsApp client is ready!');
    io.emit('status', 'WhatsApp Connected');
});

// Message event
client.on('message', async (message) => {
    const messageContent = message.body.toLowerCase();

    if (messageContent.includes('order details:') && messageContent.includes('customer details:')) {
        try {
            await message.reply(
                `Thank you for your order at ${config.BUSINESS_NAME}! 🙏\n\n` +
                `Please complete the payment using the following details:\n\n` +
                `UPI ID: ${config.UPI_ID}\n\n` +
                `After payment, send the screenshot here.\n\n` +
                `For support: ${config.SUPPORT_NUMBER}`
            );

            const paymentQR = MessageMedia.fromFilePath(config.PAYMENT_QR_PATH);
            await message.reply(paymentQR, '', {
                caption: 'Scan this QR code to pay'
            });

        } catch (error) {
            console.error('❌ Error sending payment details:', error);
            await message.reply('Sorry! Contact support.');
        }
    } else if (message.hasMedia) {
        await message.reply(
            "Thank you for the payment confirmation! 🙂\n\n" +
            "Your order is being processed.\n\n" +
            `For support, contact: ${config.SUPPORT_NUMBER}`
        );
    } else if (messageContent.includes('hi') || messageContent.includes('hello') || messageContent.includes('hey')) {
        await message.reply(
            `Welcome to ${config.BUSINESS_NAME}! 👋\n\n` +
            `Contact support: ${config.SUPPORT_NUMBER}`
        );
    } else if (messageContent.includes('query') || messageContent.includes('help') || messageContent.includes('support')) {
        await message.reply(
            `Support contact: ${config.SUPPORT_NUMBER}\n\nWe're here to help! 😊`
        );
    }
});

// Initialize the client
client.initialize();

// Socket.IO handling
io.on('connection', (socket) => {
    console.log('⚡ Web client connected:', socket.id);
    const origin = socket.handshake.headers.origin;
    console.log('🌐 Origin:', origin);

    if (qrCodeData) {
        socket.emit('qr', qrCodeData);
    }

    socket.on('ping', (data) => {
        console.log('🔔 Ping from Vercel:', data);
    });

    socket.on('message', (data) => {
        console.log('💬 Message from Vercel:', data);
    });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Disconnected: ${socket.id} Reason: ${reason}`);
    });
});

// Start the server
server.listen(config.PORT, () => {
    console.log(`✅ Server running on port ${config.PORT}`);
});

console.log('🚀 WhatsApp bot starting...');

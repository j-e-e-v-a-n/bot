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
const io = socketIo(server);

// Setup basic authentication
app.use(basicAuth({
    users: { [config.WEB_USERNAME]: config.WEB_PASSWORD },
    challenge: true
}));

// Serve static HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize WhatsApp client
const client = new Client();

// Store QR code data
let qrCodeData = null;

// QR Code generation
client.on('qr', async (qr) => {
    // Generate QR in terminal
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Please scan with WhatsApp.');

    // Generate QR for web interface
    try {
        qrCodeData = await QRCode.toDataURL(qr);
        io.emit('qr', qrCodeData);
    } catch (err) {
        console.error('QR Code generation error:', err);
    }
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    io.emit('status', 'WhatsApp Connected');
});

client.on('message', async (message) => {
    const messageContent = message.body.toLowerCase();

    // Check if message contains order details
    if (messageContent.includes('order details:') && messageContent.includes('customer details:')) {
        try {
            // Send payment instructions
            await message.reply(
                `Thank you for your order at ${config.BUSINESS_NAME}! 🙏\n\n` +
                `Please complete the payment using the following details:\n\n` +
                `UPI ID: ${config.UPI_ID}\n\n` +
                `After payment, please send the screenshot of the payment confirmation.\n\n` +
                `For any queries, contact: ${config.SUPPORT_NUMBER}`
            );

            // Send the payment QR image
            const paymentQR = MessageMedia.fromFilePath(config.PAYMENT_QR_PATH);
            await message.reply(paymentQR, '', {
                caption: 'Scan this QR code to pay'
            });
        } catch (error) {
            console.error('Error sending payment details:', error);
            await message.reply('Sorry, there was an error processing your order. Please contact support.');
        }
    }
    // Check if message is an image (potentially payment screenshot)
    else if (message.hasMedia) {
        await message.reply(
            "Thank you for the payment confirmation! 🙂\n\n" +
            "We are processing your order and will get back to you shortly.\n\n" +
            `If you have any questions, please contact: ${config.SUPPORT_NUMBER}`
        );
    }
    // Handle general queries
    else if (messageContent.includes('hi') || messageContent.includes('hello') || messageContent.includes('hey')) {
        await message.reply(
            `Welcome to ${config.BUSINESS_NAME}! 👋\n\n` +
            `For any queries, please contact: ${config.SUPPORT_NUMBER}`
        );
    }
    // Handle query keyword
    else if (messageContent.includes('query') || messageContent.includes('help') || messageContent.includes('support')) {
        await message.reply(
            `Please contact our support team at: ${config.SUPPORT_NUMBER}\n\n` +
            `We're here to help! 😊`
        );
    }
});

// Initialize the client
client.initialize();

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Web client connected');
    if (qrCodeData) {
        socket.emit('qr', qrCodeData);
    }
});

// Start server
server.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});

console.log('WhatsApp bot is starting...');
const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');

const client = new Client();

// QR Code generation for initial WhatsApp Web setup
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Please scan with WhatsApp.');
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
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

console.log('WhatsApp bot is starting...');
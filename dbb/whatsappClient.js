// whatsappClient.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg; // Destructure Client and LocalAuth from the package
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

// WhatsApp Client Events
client.on('qr', async (qr) => {
    console.log('📱 QR RECEIVED!');
    qrcodeTerminal.generate(qr, { small: true });

    try {
        const qrCodeData = await QRCode.toDataURL(qr);
        // Emit the QR code to the client if using Socket.IO
    } catch (error) {
        console.error('❌ Error generating QR Code:', error.message);
    }
});

client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
});

client.on('authenticated', () => {
    console.log('🔐 Authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication Failure:', msg);
});

client.on('disconnected', (reason) => {
    console.warn('❌ Client Disconnected:', reason);
});

// Initialize the client
client.initialize();

export default client; // Export the client instance
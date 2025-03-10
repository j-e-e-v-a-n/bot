module.exports = {
    WEB_USERNAME: 'admin',                 // Username for web interface (optional use)
    WEB_PASSWORD: 'password123',           // Password for web interface (optional use)
    BUSINESS_NAME: 'My-Business',          // Display name in UPI requests & messages
    UPI_ID: 'farizmuhammed252-1@oksbi',              // Your UPI ID
    SUPPORT_NUMBER: '+91 9999999999',      // Customer support number in replies
    PAYMENT_QR_PATH: './resume.png',       // Static QR image path (fallback or default)
    SHIPPING_COST: 99,                     // Preset shipping cost (add to order total)
    ADMIN_NUMBERS: ['918113064544', '918089554476'], // The number to forward orders/screenshots (no +)
    PORT: process.env.PORT || 5000         // Server port for web interface / socket.io
  };
  
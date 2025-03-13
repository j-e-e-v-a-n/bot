// utils/sendMessage.js

/**
 * Sends a message to a specific user via WhatsApp.
 * @param {object} client - The WhatsApp client instance (whatsapp-web.js).
 * @param {string} phone - The recipient's phone number (without '@c.us').
 * @param {string} message - The message content to send.
 * @returns {object} { success: boolean, error?: string, data?: object }
 */

export const sendMessageToUser = async (client, phone, message) => {
    console.log("📞 Phone:", phone);
    console.log("💬 Message:", message);

    // Basic validation
    if (!client) {
        console.error('❌ Error: WhatsApp client instance is null or undefined.');
        return { success: false, error: 'WhatsApp client is not initialized.' };
    }

    if (!phone || !message) {
        console.error('❌ Error: Phone number and message are required.');
        return { success: false, error: 'Phone number and message are required.' };
    }

    // Optional: check if the client is connected and ready
    if (!client.info || !client.info.wid) {
        console.error('❌ Error: WhatsApp client is not connected.');
        return { success: false, error: 'WhatsApp client is not connected.' };
    }

    const chatId = `${phone}@c.us`; // Format for private chat (adjust for groups if needed)

    try {
        const sentMessage = await client.sendMessage(chatId, message);

        console.log(`✅ Successfully sent message to ${chatId}`);
        return { success: true, data: sentMessage };
    } catch (error) {
        console.error(`❌ Failed to send message to ${chatId}:`, error.message);
        return { success: false, error: error.message || 'Failed to send message.' };
    }
};

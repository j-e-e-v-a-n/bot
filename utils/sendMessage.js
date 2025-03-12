// utils/sendMessage.js

export const sendMessageToUser  = async (client, phone, message) => {
    console.log("phone",phone,"message",message);
    console.log("clinent",client);
    
    
    if (!phone || !message) {
        return { success: false, error: 'Phone number and message are required.' };
    }

    const chatId = `${phone}@c.us`; // Format the phone number for WhatsApp

    try {
        const sentMessage = await client.sendMessage(chatId, message); // Send the message
        console.log(`✅ Message sent to ${chatId}: ${message}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending message:', error);
        return { success: false, error: 'Failed to send message.' };
    }
};
import express from 'express';
import moment from 'moment';
import { getDB } from './models/db.js';
import { sendMessageToUser } from './utils/sendMessage.js';
import * as data from './models/data.js'; // since you're using data.getSettings() later
import { client } from './index.js'

const router = express.Router();


// API route for fetching orders
router.get('/orders', async (req, res) => {
    try {
        const db = getDB();
        const orders = await db.collection('orders').find({}).toArray();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/messages/bulk', async (req, res) => {
    const { message } = req.body;

    try {
        const phoneNumbers = await data.getUserPhones();

        let sentCount = 0;
        for (const phone of phoneNumbers) {
            const sendMessageResult = await sendMessageToUser(client, phone, message);
            if (sendMessageResult.success) {
                sentCount++;
            } else {
                console.error(`Failed to send message to ${phone}: ${sendMessageResult.error}`);
            }
        }

        res.status(200).json({ success: true, sent: sentCount });
    } catch (error) {
        console.error('Error sending bulk messages:', error);
        res.status(500).json({ success: false, error: 'Failed to send bulk messages' });
    }
});




// Assuming you have Express and MongoDB set up
router.put('/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    const updateData = req.body;

    try {
        const db = getDB();
        const ordersCollection = db.collection(ordersCollectionName);

        const result = await ordersCollection.updateOne(
            { id: orderId }, // Find the order by ID
            { $set: updateData } // Update the order with new data
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ detail: 'Not Found' });
        }

        res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ detail: 'Internal Server Error' });
    }
});


router.get('/settings', async (req, res) => {
    try {
        const settings = await data.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/settings', async (req, res) => {
    const { businessName, upiId, shippingCost, freeShippingAmount, supportNumber } = req.body;
    try {
        await data.updateSettings({ businessName, upiId, shippingCost, freeShippingAmount, supportNumber });
        res.json({ message: 'Settings updated successfully.' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
router.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone number bband message are required.' });
    }

    try {
        await sendMessageToUser (phone, message);
        return res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ error: 'Failed to send message.' });
    }
});




export default router;

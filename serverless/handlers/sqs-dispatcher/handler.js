import axios from 'axios';

const NOTIFICATION_WEBHOOK_URL = process.env.NOTIFICATION_WEBHOOK_URL;
const PAYMENT_WEBHOOK_URL = process.env.PAYMENT_WEBHOOK_URL;

export const handler = async (event) => {
    for (const record of event.Records) {
        const body = JSON.parse(record.body);

        // Example routing logic
        const { type, payload } = body;

        let endpoint;
        switch (type) {
            case 'notification':
                endpoint = NOTIFICATION_WEBHOOK_URL;
                break;
            case 'payment':
                endpoint = PAYMENT_WEBHOOK_URL;
                break;
            default:
                console.warn(`Unknown type: ${type}`);
                continue;
        }

        try {
            const response = await axios.post(endpoint, payload, {
                timeout: 5000
            });
            console.log(`Successfully routed to ${endpoint}: ${response.status}`);
        } catch (error) {
            console.error(`Failed to POST to ${endpoint}`, error);
            throw error; // rethrow so message goes to DLQ if needed
        }
    }
};

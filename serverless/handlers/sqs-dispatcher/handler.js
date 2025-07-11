import axios from 'axios';

export const handler = async (event) => {
    for (const record of event.Records) {
        const body = JSON.parse(record.body);

        // Example routing logic
        const { type, payload } = body;

        let endpoint;
        switch (type) {
            case 'notification':
                endpoint = 'http://notification.zng.local:3000/webhook';
                break;
            case 'payment':
                endpoint = 'http://payment.zng.local:3000/webhook';
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

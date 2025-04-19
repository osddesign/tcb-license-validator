// netlify/functions/validate.js
const axios = require('axios');

exports.handler = async (event) => {
    try {
        const { action, licenseKey, token } = JSON.parse(event.body);
        const FIREBASE_FUNCTION_URL = process.env.FIREBASE_FUNCTION_URL;

        // Appel à Firebase Function
        const response = await axios.post(FIREBASE_FUNCTION_URL, { licenseKey });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response.data)
        };
    } catch (error) {
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

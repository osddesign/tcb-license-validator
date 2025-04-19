// firebase/functions/index.js
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

admin.initializeApp();

// Helper pour générer JWT
const generateJWT = (licenseKey) => {
    return jwt.sign(
        {
            license: licenseKey,
            exp: Math.floor(Date.now() / 1000) + 2592000 // 30 jours
        },
        process.env.LV_JWT_SECRET
    );
};

// Endpoint HTTP pour validation licence
exports.validateLicense = onRequest(async (req, res) => {
    try {
        const { licenseKey } = req.body;

        if (!licenseKey) {
            return res.status(400).json({ error: 'licenseKey requis' });
        }

        const doc = await admin.firestore().collection('licenses').doc(licenseKey).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Licence non trouvée' });
        }

        const token = generateJWT(licenseKey);

        res.json({
            jwt: token,
            license: licenseKey,
            status: doc.data().status,
            expiresIn: '30d'
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook de désactivation
exports.processDeactivation = onDocumentCreated('license_webhooks/{docId}', async (event) => {
    const snap = event.data;
    const { authKey, licenseKey } = snap.data();

    if (authKey !== process.env.WEBHOOK_SECRET) {
        console.log('Tentative non autorisée');
        return snap.ref.delete();
    }

    const licenseRef = admin.firestore().collection('licenses').doc(licenseKey);
    await licenseRef.update({ status: 'inactive' });

    return snap.ref.update({ processed: true });
});

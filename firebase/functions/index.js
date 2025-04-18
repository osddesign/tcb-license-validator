const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

exports.processWebhook = onDocumentCreated('license_webhooks/{docId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log('No data associated with the event');
        return;
    }

    const { authKey, licenseKey, action } = snap.data();

    // Vérification sécurité
    if (authKey !== process.env.WEBHOOK_SECRET) {
        console.error('Tentative non autorisée');
        await snap.ref.delete();
        return;
    }

    if (action === 'deactivate') {
        const licenseRef = db.collection('licenses').doc(licenseKey);
        await licenseRef.update({
            status: 'inactive',
            deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await snap.ref.update({
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});

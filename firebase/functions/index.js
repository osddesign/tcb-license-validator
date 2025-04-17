const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.processWebhook = functions.firestore
  .document('license_webhooks/{docId}')
  .onCreate(async (snap, context) => {
    const { authKey, licenseKey, action } = snap.data();
    
    // Vérification sécurité
    if (authKey !== process.env.WEBHOOK_SECRET) {
      console.error('Tentative non autorisée');
      await snap.ref.delete();
      return null;
    }

    if (action === 'deactivate') {
      const licenseRef = admin.firestore().collection('licenses').doc(licenseKey);
      await licenseRef.update({ 
        status: 'inactive',
        deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return snap.ref.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return null;
  });
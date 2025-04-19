const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

initializeApp({ projectId: 'tcb-license-validator' });

const db = getFirestore();
db.settings({ host: 'localhost:18080', ssl: false }); // Utilisation de l’émulateur

// Génère une licence avec un ID de type "LIC-XXXX"
function generateLicenseKey(i) {
    return `LIC-${String(i).padStart(4, '0')}`;
}

async function seed() {
    const now = Timestamp.now();

    try {
        // Créer 10 licences
        for (let i = 1; i <= 10; i++) {
            const licenseKey = generateLicenseKey(i);
            await db
                .collection('licenses')
                .doc(licenseKey)
                .set({
                    status: i % 2 === 0 ? 'inactive' : 'active',
                    createdAt: now,
                    deactivatedAt: i % 2 === 0 ? now : null,
                    customer: `Client ${i}`
                });
            console.log(`✅ Licence ${licenseKey} ajoutée`);
        }

        // Créer 2 webhooks de test
        const webhookData = [
            {
                licenseKey: 'LIC-0001',
                action: 'deactivate',
                authKey: 'SAMPLE_AUTH_KEY',
                processed: false,
                createdAt: now
            },
            {
                licenseKey: 'LIC-0002',
                action: 'deactivate',
                authKey: 'SAMPLE_AUTH_KEY',
                processed: false,
                createdAt: now
            }
        ];

        for (const data of webhookData) {
            const ref = await db.collection('license_webhooks').add(data);
            console.log(`✅ Webhook pour ${data.licenseKey} ajouté avec ID : ${ref.id}`);
        }

        console.log('✨ Seed terminé !');
    } catch (error) {
        console.error('❌ Erreur pendant le seed :', error);
    }
}

seed();

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Gestion CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      }
    };
  }

  try {
    const { licenseKey, token } = JSON.parse(event.body);
    
    // Étape 5-6 : Validation JWT
    if (token) {
      const decoded = jwt.verify(token, process.env.LV_JWT_SECRET);
      return respond({ valid: true, data: decoded });
    }

    // Étape 2 : Vérification Firestore
    const doc = await db.collection('licenses').doc(licenseKey).get();
    if (!doc.exists) throw new Error('Licence non trouvée');
    
    const { status } = doc.data();
    if (status !== 'active') throw new Error('Licence inactive');

    // Étape 3 : Génération JWT
    const jwtToken = jwt.sign(
      {
        license: licenseKey,
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 3600) // 30 jours
      },
      process.env.LV_JWT_SECRET
    );

    // Étape 4 : Réponse
    return respond({ jwt: jwtToken });

  } catch (error) {
    return respond({ error: error.message }, 401);
  }
};

function respond(data, statusCode = 200) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' 
    },
    body: JSON.stringify(data)
  };
}
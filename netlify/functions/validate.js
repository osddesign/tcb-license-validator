const { Firestore } = require("@google-cloud/firestore");

const firestore = new Firestore({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
});

exports.handler = async (event) => {
  console.log("Received event:", event);

  try {
    const { key } = JSON.parse(event.body);
    console.log("Validating key:", key);

    const doc = await firestore.collection("licenses").doc(key).get();

    if (!doc.exists) {
      return { statusCode: 404, body: JSON.stringify({ valid: false }) };
    }

    const data = doc.data();
    console.log("Firestore data:", data);

    const valid =
      data.status === "active" &&
      new Date(data.valid_until) > new Date() &&
      data.activations < data.max_activations;

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid,
        activations_left: data.max_activations - data.activations,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

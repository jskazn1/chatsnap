const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

// Send push notification when a new room message is created
exports.onNewRoomMessage = onDocumentCreated("rooms/{roomId}/messages/{messageId}", async (event) => {
  const message = event.data.data();
  if (!message) return;

  const db = getFirestore();
  const messaging = getMessaging();
  const roomId = event.params.roomId;

  // Get all users with FCM tokens who aren't the sender
  const usersSnap = await db.collection("users").get();
  const tokens = [];

  usersSnap.forEach((doc) => {
    const userData = doc.data();
    if (doc.id !== message.uid && userData.fcmToken) {
      tokens.push(userData.fcmToken);
    }
  });

  if (tokens.length === 0) return;

  const payload = {
    notification: {
      title: `${message.displayName || "Someone"} in #${roomId}`,
      body: message.text || "(sent a photo)",
    },
    data: {
      type: "room",
      room: roomId,
    },
  };

  const response = await messaging.sendEachForMulticast({
    tokens,
    ...payload,
  });

  // Clean up invalid tokens
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
      // Token is invalid, remove it
      const invalidToken = tokens[idx];
      usersSnap.forEach((doc) => {
        if (doc.data().fcmToken === invalidToken) {
          db.collection("users").doc(doc.id).update({ fcmToken: null });
        }
      });
    }
  });
});

// Send push notification when a new DM message is created
exports.onNewDMMessage = onDocumentCreated(
  "conversations/{convoId}/messages/{messageId}",
  async (event) => {
    const message = event.data.data();
    if (!message) return;

    const db = getFirestore();
    const messaging = getMessaging();
    const convoId = event.params.convoId;

    // Get the conversation to find participants
    const convoSnap = await db.collection("conversations").doc(convoId).get();
    if (!convoSnap.exists) return;

    const convo = convoSnap.data();
    // Schema uses `participants`, not `participantIds`
    const otherUids = (convo.participants || []).filter((uid) => uid !== message.uid);

    // Get tokens for other participants
    const tokens = [];
    for (const uid of otherUids) {
      const userSnap = await db.collection("users").doc(uid).get();
      if (userSnap.exists && userSnap.data().fcmToken) {
        tokens.push(userSnap.data().fcmToken);
      }
    }

    if (tokens.length === 0) return;

    const payload = {
      notification: {
        title: message.displayName || "New message",
        body: message.text || "(sent a photo)",
      },
      data: {
        type: "dm",
        conversationId: convoId,
      },
    };

    await messaging.sendEachForMulticast({
      tokens,
      ...payload,
    });
  }
);

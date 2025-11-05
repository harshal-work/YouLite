// utils/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";

// ✅ Your actual Firebase project configuration (from google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyAENaXStkbX_9GvDGI7rQl7rxOKweLoLvA",
  authDomain: "youlite-e2dd4.firebaseapp.com",
  projectId: "youlite-e2dd4",
  storageBucket: "youlite-e2dd4.firebasestorage.app",
  messagingSenderId: "80955700657",
  appId: "1:80955700657:android:28d6ce359938c22e96b990",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn(
    "⚠️ Firebase Messaging not supported in this environment (usually web-only):",
    error
  );
}

// ✅ Web Push certificate (VAPID key from Firebase Console → Cloud Messaging)
const vapidKey =
  "BHwXzTi3L5ak4p08dX0QlpTXu18IUrVpDQIVszL0injYiwA0nxMBstC6fIGmu6ADlmjIgnWK_uwUqloNpj9X-jM";

// ✅ Request and return FCM token
export const requestFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.log("❌ Firebase Messaging not initialized");
    return null;
  }

  try {
    const token = await getToken(messaging, { vapidKey });
    if (token) {
      console.log("✅ FCM Token fetched:", token);
      return token;
    } else {
      console.warn("⚠️ No FCM token available. Request permission first.");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching FCM token:", error);
    return null;
  }
};

// ✅ Listen for foreground messages (when app is open)
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log("📩 Foreground message received:", payload);

    // Optional: trigger in-app notification (Expo or RN)
    if (payload?.notification) {
      alert(
        `${payload.notification.title ?? "New Message"}\n${
          payload.notification.body ?? ""
        }`
      );
    }
  });
}

export { app, messaging, getToken, onMessage };

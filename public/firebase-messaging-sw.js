importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "MET_TON_API_KEY_ICI",
  authDomain: "MET_TON_AUTH_DOMAIN_ICI",
  projectId: "MET_TON_PROJECT_ID_ICI",
  storageBucket: "MET_TON_STORAGE_BUCKET_ICI",
  messagingSenderId: "78436530479",
  appId: "MET_TON_APP_ID_ICI"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
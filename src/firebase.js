import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB6NIS1-Q0VwUQltAae-77oHL79FVsXH_w",
  authDomain: "batirplus.firebaseapp.com",
  projectId: "batirplus",
  storageBucket: "batirplus.firebasestorage.app",
  messagingSenderId: "784365309479",
  appId: "1:784365309479:web:160eebc83b598851a88802",
  measurementId: "G-8G718D7WD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
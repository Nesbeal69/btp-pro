import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6NIS1-Q8vwUQltAse-77oHL79FVsXHW_",
  authDomain: "batirplus.firebaseapp.com",
  projectId: "batirplus",
  storageBucket: "batirplus.firebasestorage.app",
  messagingSenderId: "784365389479",
  appId: "1:784365389479:web:160eabc83b598b51a88802",
  measurementId: "G-8G7718DZM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
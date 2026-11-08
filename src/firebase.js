import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB6NIS1-Q8vwUQ1tAse-77oHL79FVsXHW_",
  authDomain: "batirplus.firebaseapp.com",
  projectId: "batirplus",
  storageBucket: "batirplus.appspot.com",
  messagingSenderId: "784365389497",
  appId: "1:784365389497:web:160eabc83b598b51a88802",
  measurementId: "G-8G718DZM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
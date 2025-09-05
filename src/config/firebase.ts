
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBibfk30dVe8_a1zPHz5vXAPoK5HWhZZXg",
  authDomain: "backr-prototype.firebaseapp.com",
  projectId: "backr-prototype",
  storageBucket: "backr-prototype.firebasestorage.app",
  messagingSenderId: "227596228830",
  appId: "1:227596228830:web:446be00b065e6495c90a4f",
  measurementId: "G-HP0BTL85TM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTNTUMSZODtH7XROiax0ysWMA51eKkAyo",
  authDomain: "career-guidance-for-lesotho.firebaseapp.com",
  projectId: "career-guidance-for-lesotho",
  storageBucket: "career-guidance-for-lesotho.firebasestorage.app",
  messagingSenderId: "827541738802",
  appId: "1:827541738802:web:b2e43008d85b1915a1732b",
  measurementId: "G-3X1QYN0ZYS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export all auth methods
export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
};

export default app;
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDmZLCSISrd-LoC94cpMXm73N_tut1HSOU",
  authDomain: "fire-store-45cda.firebaseapp.com",
  projectId: "fire-store-45cda",
  storageBucket: "fire-store-45cda.firebasestorage.app",
  messagingSenderId: "316370504514",
  appId: "1:316370504514:web:bf795a394cd19a3f0ad6db"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
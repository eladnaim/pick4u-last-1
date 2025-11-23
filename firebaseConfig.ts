import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBbeJ98ed6WVgd9k5Lgd4C5G-ulu3xuTIs",
  authDomain: "pick4u-70c3b.firebaseapp.com",
  projectId: "pick4u-70c3b",
  storageBucket: "pick4u-70c3b.firebasestorage.app",
  messagingSenderId: "20261347967",
  appId: "1:20261347967:web:0c7779dee8dc9a1de2554a",
  measurementId: "G-X305LC40B7"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true, useFetchStreams: false });
export const auth = getAuth(app);
export const storage = getStorage(app);

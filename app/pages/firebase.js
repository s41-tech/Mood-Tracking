import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAjxUFsNJUYGP0qqy-Sju7KQdkIgXjRds8",
  authDomain: "miniprojectre.firebaseapp.com",
  projectId: "miniprojectre",
  databaseURL: "https://miniprojectre-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "miniprojectre.firebasestorage.app",
  messagingSenderId: "1052152222921",
  appId: "1:1052152222921:web:42bd2eb48b7f2d26fce918"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
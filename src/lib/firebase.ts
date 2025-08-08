// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "aliinsights",
  "appId": "1:48131222137:web:7fc2ec9861093a7e20c2a8",
  "storageBucket": "aliinsights.firebasestorage.app",
  "apiKey": "AIzaSyArzg3zwPRGPAzqatLrX_UHUzhdLeRrp0E",
  "authDomain": "aliinsights.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "48131222137"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
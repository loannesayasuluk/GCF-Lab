import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdCUy2LawCUkykPuNXzQuMtwlmWYF-ojw",
  authDomain: "gcf-lab-13e42.firebaseapp.com",
  projectId: "gcf-lab-13e42",
  storageBucket: "gcf-lab-13e42.appspot.com",
  messagingSenderId: "406543918534",
  appId: "1:406543918534:web:575b501cf297f4e3a4bec7",
  measurementId: "G-99X08SYSC0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 
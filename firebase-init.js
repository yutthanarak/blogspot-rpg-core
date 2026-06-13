// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAh6RoiIMzqiDsyxRzCFt8zRtHrObQoaKo",
  authDomain: "mecha-vs-mutant.firebaseapp.com",
  databaseURL: "https://mecha-vs-mutant-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mecha-vs-mutant",
  storageBucket: "mecha-vs-mutant.firebasestorage.app",
  messagingSenderId: "118810259307",
  appId: "1:118810259307:web:b278cdc3787bbe3e64a62e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCFTUl8Z_Jesno4dwqsMYBqLGvo01AAtXM',
  authDomain: 'emprest-simples.firebaseapp.com',
  projectId: 'emprest-simples',
  storageBucket: 'emprest-simples.firebasestorage.app',
  messagingSenderId: '730637115553',
  appId: '1:730637115553:web:a64c5c04214d08c02850e0',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

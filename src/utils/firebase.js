// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCtDXExG-OP6k5H6F2SCszOJVdfrr5TGeY",
  authDomain: "chatroomv4-9529e.firebaseapp.com",
  databaseURL: "https://chatroomv4-9529e-default-rtdb.firebaseio.com",
  projectId: "chatroomv4-9529e",
  storageBucket: "chatroomv4-9529e.appspot.com",
  messagingSenderId: "794806065543",
  appId: "1:794806065543:web:b5896406d0631b22671b22",
  measurementId: "G-PC94W3WTPS"
};
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export default app; 
const auth = getAuth(app);
export { auth };
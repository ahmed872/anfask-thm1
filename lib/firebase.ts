import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAFOvSYDlQCAQInLuF2gxfVa95zRPStQ4",
  authDomain: "anfasek-app.firebaseapp.com",
  projectId: "anfasek-app",
  storageBucket: "anfasek-app.appspot.com",
  messagingSenderId: "815691358709",
  appId: "1:815691358709:web:c07335996fa077bfea80bc"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

import firebase from "firebase/app";
import "firebase/auth";
 
 
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  var firebaseConfig = {
    apiKey: "AIzaSyC8qyQuzK1lgZXtTkHafik45Xrpyi4Ns_A",
    authDomain: "deco-1.firebaseapp.com",
    projectId: "deco-1",
    storageBucket: "deco-1.appspot.com",
    messagingSenderId: "131726768724",
    appId: "1:131726768724:web:6da20aae81ee21eadc8bc1",
    measurementId: "G-KHRNQLBLHJ"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  export const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  export const signInWithGoogle = () => {
    auth.signInWithPopup(provider);
  };

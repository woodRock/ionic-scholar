import firebase from "firebase";

/**
 * This is a utility class for the Firebase API
 * It handles the business logic for interaction with Firebase.
 */

// In a production version we would hide these firebase API keys
// Especially if the code was hosted on a public repository
const key = {
  apiKey: "AIzaSyAdLiVMSFfBcTNxPw48V9cEsq-fA8XvIDc",
  authDomain: "scholar-e5753.firebaseapp.com",
  databaseURL: "https://scholar-e5753.firebaseio.com",
  projectId: "scholar-e5753",
  storageBucket: "scholar-e5753.appspot.com",
  messagingSenderId: "289588095416",
  appId: "1:289588095416:web:bb273d746f68f82775474d",
  measurementId: "G-NESTJ3Z9VR"
};

const initialize = () => {};

firebase.initializeApp(key);
firebase.analytics();

const auth = firebase.auth();

const firestore = firebase.firestore();

const provider = new firebase.auth.GoogleAuthProvider();

const signInWithGoogle = () => {
  auth.signInWithPopup(provider);
};

const generateUserDocument = async (user: any, additionalData?: any) => {
  if (!user) return;
  const userRef = firestore.doc(`users/${user.uid}`);
  const snapshot = await userRef.get();
  if (!snapshot.exists) {
    const { email, displayName, photoURL } = user;
    try {
      await userRef.set({
        displayName,
        email,
        photoURL,
        ...additionalData
      });
    } catch (error) {
      console.error("Error creating user document", error);
    }
  }
  return getUserDocument(user.uid);
};

const getUserDocument = async (uid: string) => {
  if (!uid) return null;
  try {
    const userDocument = await firestore.doc(`users/${uid}`).get();
    return {
      uid,
      ...userDocument.data()
    };
  } catch (error) {
    console.error("Error fetching user", error);
  }
};

const collection = (uid: string) => {
  return firestore
    .collection("users")
    .doc(uid)
    .collection("library");
};

export {
  initialize,
  auth,
  firestore,
  signInWithGoogle,
  generateUserDocument,
  collection
};

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  User, 
  UserCredential 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  deleteDoc,
  getDocs,
  collection as firestoreCollection,
  query,
  orderBy,
  onSnapshot,
  CollectionReference,
  DocumentData,
  DocumentSnapshot as FirestoreDocumentSnapshot
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

/**
 * This is a utility class for the Firebase API
 * It handles the business logic for interaction with Firebase.
 */

// In a production version we would hide these firebase API keys
// Especially if the code was hosted on a public repository
const firebaseConfig = {
  apiKey: "AIzaSyAdLiVMSFfBcTNxPw48V9cEsq-fA8XvIDc",
  authDomain: "scholar-e5753.firebaseapp.com",
  databaseURL: "https://scholar-e5753.firebaseio.com",
  projectId: "scholar-e5753",
  storageBucket: "scholar-e5753.appspot.com",
  messagingSenderId: "289588095416",
  appId: "1:289588095416:web:bb273d746f68f82775474d",
  measurementId: "G-NESTJ3Z9VR"
};

// Type definition for user data
interface UserData {
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  [key: string]: any;
}

// Define types for our Firebase wrappers
type QuerySnapshotCallback = (snapshot: {
  docs: Array<{
    id: string;
    data: () => any;
  }>;
}) => void;

// Custom document snapshot type that matches Firebase v8 API
type DocumentSnapshot = {
  exists: boolean;
  id: string;
  data: () => any;
};

// Document reference type with v8 API methods
interface DocumentRef {
  set: (data: any) => Promise<void>;
  delete: () => Promise<void>;
  get: () => Promise<DocumentSnapshot>;
  onSnapshot: (callback: (doc: DocumentSnapshot) => void) => () => void;
}

// Define a custom type for our collection wrapper to ensure TypeScript recognizes our methods
interface LibraryCollection {
  ref: CollectionReference<DocumentData>;
  orderBy: (field: string) => {
    onSnapshot: (callback: QuerySnapshotCallback) => () => void;
  };
  doc: (docId: string) => DocumentRef;
  get: () => Promise<{
    docs: Array<{
      id: string;
      data: () => any;
    }>;
  }>;
  onSnapshot: (callback: (querySnapshot: {
    forEach: (fn: (doc: DocumentSnapshot) => void) => void;
  }) => void) => () => void;
}

// Initialize Firebase only if it hasn't been initialized already
const initialize = (): void => {
  if (getApps().length === 0) {
    const app = initializeApp(firebaseConfig);
    getAnalytics(app);
  }
};

// Initialize Firebase on module import
initialize();

// Get Firebase instances
const app = getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const provider = new GoogleAuthProvider();

const signInWithGoogle = async (): Promise<UserCredential | void> => {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
};

const generateUserDocument = async (user: User, additionalData?: UserData): Promise<UserData | null> => {
  if (!user) return null;
  
  const userRef = doc(firestore, `users/${user.uid}`);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    try {
      await setDoc(userRef, {
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

const getUserDocument = async (uid: string): Promise<UserData | null> => {
  if (!uid) return null;
  
  try {
    const userDocument = await getDoc(doc(firestore, `users/${uid}`));
    const userData = userDocument.data();
    
    return userData ? {
      uid,
      ...userData
    } : null;
  } catch (error) {
    console.error("Error fetching user", error);
    return null;
  }
};

// Returns everything needed to work with a user's library collection
const collection = (uid: string): LibraryCollection => {
  const libraryRef = firestoreCollection(firestore, `users/${uid}/library`);
  
  return {
    ref: libraryRef,
    
    // Helper methods that match the v8 API style for backward compatibility
    orderBy: (field: string) => ({
      onSnapshot: (callback: QuerySnapshotCallback) => {
        const q = query(libraryRef, orderBy(field));
        return onSnapshot(q, callback);
      }
    }),
    
    doc: (docId: string) => {
      const docRef = doc(libraryRef, docId);
      return {
        set: (data: any) => setDoc(docRef, data),
        delete: () => deleteDoc(docRef),
        get: async () => {
          const snapshot = await getDoc(docRef);
          return {
            exists: snapshot.exists(),
            id: snapshot.id,
            data: () => snapshot.data()
          };
        },
        onSnapshot: (callback: (doc: DocumentSnapshot) => void) => {
          return onSnapshot(docRef, (snapshot) => {
            callback({
              exists: snapshot.exists(),
              id: snapshot.id,
              data: () => snapshot.data()
            });
          });
        }
      };
    },
    
    get: () => getDocs(libraryRef),
    
    // Add onSnapshot at collection level
    onSnapshot: (callback) => {
      return onSnapshot(libraryRef, (snapshot) => {
        callback({
          forEach: (fn) => {
            snapshot.docs.forEach((doc) => {
              fn({
                id: doc.id,
                exists: doc.exists(),
                data: () => doc.data()
              });
            });
          }
        });
      });
    }
  };
};

export {
  initialize,
  auth,
  firestore,
  signInWithGoogle,
  generateUserDocument,
  getUserDocument,
  collection,
};

export type { LibraryCollection, UserData, DocumentSnapshot};
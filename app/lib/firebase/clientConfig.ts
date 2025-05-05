import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate Firebase config
function validateFirebaseConfig(config: any): boolean {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  return requiredFields.every(field => !!config[field]);
}

// Initialize Firebase for client-side
function initializeFirebaseClient() {
  if (typeof window === 'undefined') {
    return { db: null, auth: null };
  }

  try {
    const apps = getApps();
    let app: FirebaseApp;

    if (!validateFirebaseConfig(firebaseConfig)) {
      console.error('Invalid Firebase client configuration');
      return { db: null, auth: null };
    }

    if (!apps.length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = apps[0];
    }

    return {
      db: getFirestore(app),
      auth: getAuth(app)
    };
  } catch (error) {
    console.error('Firebase client initialization error:', error);
    return { db: null, auth: null };
  }
}

// Export the Firebase client instances
export const { db, auth } = initializeFirebaseClient();

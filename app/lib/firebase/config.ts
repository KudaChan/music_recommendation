import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from './serviceAccount';
import { config } from '../config';

// Initialize Firebase Admin SDK for server-side operations
function initializeFirebaseAdmin() {
    // Only initialize if Firebase is enabled
    if (!config.firebase.useFirebase) {
        console.log('Firebase is disabled. Skipping initialization.');
        return null;
    }

    const apps = getApps();

    if (!apps.length) {
        try {
            // Check if we have a project ID in env vars
            if (config.firebase.projectId) {
                console.log('Initializing Firebase Admin with project ID:', config.firebase.projectId);
                
                // Try to load service account from file
                const serviceAccount = loadServiceAccount();
                
                if (serviceAccount) {
                    // Initialize with service account
                    console.log('Using service account from file');
                    initializeApp({
                        credential: cert(serviceAccount),
                        projectId: config.firebase.projectId
                    });
                } else {
                    // No service account, use application default credentials
                    console.log('No service account found, using application default credentials');
                    initializeApp({
                        projectId: config.firebase.projectId
                    });
                }
            } else {
                throw new Error('Firebase project ID is required');
            }
        } catch (error) {
            console.error('Firebase Admin initialization error:', error);
            if (config.environment.isProduction) {
                // In production, we might want to continue without Firebase rather than crash
                console.error('Failed to initialize Firebase Admin. Some features may be unavailable.');
                return null;
            } else {
                // In development, we want to fail fast
                throw new Error('Failed to initialize Firebase Admin');
            }
        }
    }

    return getFirestore();
}

// Export the Firestore instance
export const db = initializeFirebaseAdmin();

// Helper function to check if Firebase is available
export function isFirebaseAvailable() {
    return !!db;
}

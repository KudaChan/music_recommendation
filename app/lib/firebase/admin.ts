import { db } from './config';

// Check if Firebase Admin is properly initialized
export async function checkFirebaseAdmin() {
  try {
    // Try to access a collection to verify connection
    const testRef = db.collection('_test_connection');
    await testRef.listDocuments();
    return { success: true, message: 'Firebase Admin SDK is properly initialized' };
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    return { 
      success: false, 
      message: 'Firebase Admin SDK initialization failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
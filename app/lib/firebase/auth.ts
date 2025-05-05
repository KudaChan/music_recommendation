import { NextRequest } from 'next/server';
import { auth } from 'firebase-admin';
import { db } from './config';

// Get authenticated user from request
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('firebase-auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const decodedToken = await auth().verifyIdToken(token);
    
    // Return user info
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || ''
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Create or update user profile
export async function updateUserProfile(userId: string, data: any) {
  try {
    const userRef = db.collection('users').doc(userId);
    
    // Check if user exists
    const doc = await userRef.get();
    
    if (doc.exists) {
      // Update existing user
      await userRef.update({
        ...data,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new user
      await userRef.set({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false };
  }
}
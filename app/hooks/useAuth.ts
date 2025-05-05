'use client';

import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  getIdToken
} from 'firebase/auth';
import { auth } from '@/app/lib/firebase/clientConfig';
import { createUserProfile, getUserProfile } from '@/app/lib/firebase/firestore';
import Cookies from 'js-cookie';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          // Get the ID token
          const token = await getIdToken(firebaseUser);
          
          // Store token in cookie for middleware
          Cookies.set('firebase-auth-token', token, { 
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === 'production'
          });
          
          // Check if user profile exists
          const userProfile = await getUserProfile(firebaseUser.uid);
          
          if (!userProfile) {
            // Create user profile if it doesn't exist
            await createUserProfile(firebaseUser.uid, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            });
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } else {
          // Remove token from cookies
          Cookies.remove('firebase-auth-token');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('Failed to authenticate user');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      Cookies.remove('firebase-auth-token');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };
}

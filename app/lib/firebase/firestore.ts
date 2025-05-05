import { db } from './clientConfig';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';

// User profile operations
export async function getUserProfile(userId: string) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data();
    }

    return null;
}

export async function createUserProfile(userId: string, userData: any) {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
}

export async function updateUserProfile(userId: string, userData: any) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        ...userData,
        updatedAt: Timestamp.now()
    });
}

// Chat history operations
export async function saveChatMessage(userId: string, message: any) {
    const chatRef = doc(collection(db, 'chats'));
    await setDoc(chatRef, {
        userId,
        content: message.content,
        role: message.role,
        timestamp: Timestamp.now()
    });

    // Update user's chat history reference
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        chatHistory: arrayUnion(chatRef.id)
    });

    return chatRef.id;
}

export async function getUserChatHistory(userId: string, limit = 50) {
    const chatsQuery = query(
        collection(db, 'chats'),
        where('userId', '==', userId)
    );

    const chatSnap = await getDocs(chatsQuery);
    const chats: any[] = [];

    chatSnap.forEach((doc) => {
        chats.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // Sort by timestamp
    return chats.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
}

// Music preferences and recommendations
export async function saveUserMusicPreference(userId: string, preference: any) {
    const prefRef = doc(collection(db, 'musicPreferences'));
    await setDoc(prefRef, {
        userId,
        ...preference,
        timestamp: Timestamp.now()
    });

    return prefRef.id;
}

export async function saveSongRecommendation(userId: string, song: any) {
    const songRef = doc(collection(db, 'recommendations'));
    await setDoc(songRef, {
        userId,
        ...song,
        timestamp: Timestamp.now(),
        liked: false
    });

    return songRef.id;
}

export async function updateSongFeedback(recommendationId: string, feedback: { liked: boolean }) {
    const songRef = doc(db, 'recommendations', recommendationId);
    await updateDoc(songRef, {
        ...feedback,
        feedbackTimestamp: Timestamp.now()
    });
}
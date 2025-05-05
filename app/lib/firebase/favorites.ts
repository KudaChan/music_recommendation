import { db } from './config';
import { Recommendation } from '@/app/types';

// Save a song to favorites
export async function saveFavorite(userId: string, song: Recommendation) {
    try {
        console.log('Attempting to save favorite:', { userId, songData: song });
        const favoritesRef = db.collection('users').doc(userId).collection('favorites');
        
        // Check if song already exists in favorites - use only youtubeId for comparison
        const querySnapshot = await favoritesRef
            .where('youtubeId', '==', song.youtubeId)
            .get();
        
        console.log('Existing favorites check:', { 
            youtubeId: song.youtubeId, 
            exists: !querySnapshot.empty,
            docsCount: querySnapshot.size 
        });
        
        if (!querySnapshot.empty) {
            return { success: false, message: 'Song already in favorites' };
        }
        
        // Create a clean song object without undefined values
        const cleanSong = {
            title: song.title || '',
            artist: song.artist || '',
            youtubeId: song.youtubeId,
            // Add any other required fields with fallbacks
            addedAt: new Date().toISOString()
        };
        
        console.log('Adding song to favorites:', cleanSong);
        
        // Add to favorites
        const docRef = await favoritesRef.add(cleanSong);
        
        console.log('Successfully added to favorites with ID:', docRef.id);
        
        return { success: true, message: 'Added to favorites' };
    } catch (error) {
        console.error('Error saving favorite:', error);
        return { success: false, message: `Failed to add to favorites: ${error}` };
    }
}

// Get all favorites for a user
export async function getFavorites(userId: string) {
    try {
        const favoritesRef = db.collection('users').doc(userId).collection('favorites');
        
        // Get all favorites, ordered by when they were added
        const querySnapshot = await favoritesRef
            .orderBy('addedAt', 'desc')
            .get();
        
        // Convert to array of favorites
        const favorites = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || '',
                artist: data.artist || '',
                youtubeId: data.youtubeId,
                addedAt: data.addedAt
            };
        });
        
        return { success: true, favorites };
    } catch (error) {
        console.error('Error getting favorites:', error);
        return { success: false, favorites: [] };
    }
}

// Remove a song from favorites
export async function removeFavorite(userId: string, youtubeId: string) {
    try {
        const favoritesRef = db.collection('users').doc(userId).collection('favorites');
        
        // Find the favorite with the matching youtubeId
        const querySnapshot = await favoritesRef
            .where('youtubeId', '==', youtubeId)
            .get();
        
        if (querySnapshot.empty) {
            return { success: false, message: 'Song not found in favorites' };
        }
        
        // Delete the favorite
        const batch = db.batch();
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        return { success: true, message: 'Removed from favorites' };
    } catch (error) {
        console.error('Error removing favorite:', error);
        return { success: false, message: 'Failed to remove from favorites' };
    }
}

// Check if a song is in favorites
export async function checkFavorite(userId: string, youtubeId: string) {
    try {
        console.log('Checking if song is favorite:', { userId, youtubeId });
        const favoritesRef = db.collection('users').doc(userId).collection('favorites');
        
        // Find the favorite with the matching youtubeId
        const querySnapshot = await favoritesRef
            .where('youtubeId', '==', youtubeId)
            .limit(1)
            .get();
        
        const isFavorite = !querySnapshot.empty;
        console.log('Favorite check result:', { youtubeId, isFavorite, docsCount: querySnapshot.size });
        
        return { 
            success: true, 
            isFavorite: isFavorite 
        };
    } catch (error) {
        console.error('Error checking favorite:', error);
        return { success: false, isFavorite: false, error: error };
    }
}

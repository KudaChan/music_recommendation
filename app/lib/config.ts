// Centralized configuration management
export const config = {
  firebase: {
    useFirebase: process.env.USE_FIREBASE === 'true',
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    }
  },
  ai: {
    useGemini: process.env.USE_GEMINI === 'true',
    geminiModel: 'gemini-2.0-flash',
    apiKey: process.env.GEMINI_API_KEY,
  },
  youtube: {
    useYoutubeApi: process.env.USE_YOUTUBE_API === 'true',
    apiKey: process.env.YOUTUBE_API_KEY,
  },
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
  features: {
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    enableOfflineSupport: process.env.ENABLE_OFFLINE_SUPPORT === 'true',
  }
};

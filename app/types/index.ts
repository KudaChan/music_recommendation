// Message type for chat
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Mood analysis result
export interface MoodAnalysis {
  [x: string]: any;
  primaryMood: string;
  moodScores: Record<string, number>;
  confidence: number;
}

// Music recommendation
export interface Recommendation {
  title: string;
  artist: string;
  youtubeId: string;
  mood?: string;
  genre?: string;
  onNext?: () => void;
}

export interface ChatResponse {
  message: Message;
  mood: MoodAnalysis;
  recommendations: Recommendation[];
  history: Message[];
}

// Playlist type
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songCount: number;
  songs: Recommendation[];
  createdAt: string | null;
  updatedAt: string | null;
}

// User settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  colorScheme: string;
  notificationsEnabled: boolean;
  autoplay: boolean;
  defaultVolume: number;
  highQualityAudio: boolean;
  dataCollection: boolean;
}

// Color scheme
export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

// Push notification
export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

// Extend existing types with more comprehensive definitions

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Service error type
export interface ServiceError {
  message: string;
  code?: string;
  details?: any;
}

// Enhanced recommendation type
export interface EnhancedRecommendation extends Recommendation {
  addedAt?: string;
  playCount?: number;
  inPlaylists?: string[];
}

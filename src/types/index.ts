// Track interface matching API response from /api/tracks
export interface Track {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  artist_name?: string; // Новое поле из API
  album?: string;
  album_title?: string; // Новое поле из API
  album_id?: string; // Новое поле из API для навигации к альбому
  genre?: string; // Новое поле из API
  release_date?: string; // Новое поле из API
  duration_seconds: number;
  s3_audio_key: string;
  s3_image_key: string;
  cover_url?: string; // Новое поле из API
  plays_count: number;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
}

// User interface
export interface User {
  id: string;
  email: string;
  provider: 'local' | 'google' | 'yandex';
  external_id?: string;
  role: 'user' | 'admin' | 'guest';
  created_at: string;
}

// Auth response from login/register endpoints
export interface AuthResponse {
  token: string;
  user: User;
}

// API response wrapper for tracks with pagination
export interface TracksResponse {
  tracks: Track[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Like response from /api/tracks/{id}/like
export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

// Error response from API
export interface ErrorResponse {
  error: string;
}

// Player state interface
export interface PlayerState {
  track_id: string;  // UUID format
  position: number;  // seconds, >= 0
  volume: number;    // 0-100 integer
  updated_at: string;
}

// User profile interface for /api/users/me
export interface UserProfile {
  id: number;
  email?: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  role: string;
  last_login_at?: string;
  created_at: string;
  last_track?: Track;
  player_state?: PlayerState;
}

// Update profile request
export interface UpdateProfileRequest {
  name?: string | null;
  avatar_key?: string | null;
}

// Album interface (simple)
export interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  release_date: string;
  genre: string;
  year: number;
  created_at: string;
  tracks?: Track[]; // Optional, if loaded with details
}

// Album detail response from API
export interface AlbumDetailResponse {
  album: Album;
  tracks: Track[];
}

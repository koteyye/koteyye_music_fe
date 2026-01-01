import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import type {
  Track,
  TracksResponse,
  AuthResponse,
  LikeResponse,
  ErrorResponse,
  User,
  UserProfile,
  UpdateProfileRequest,
  PlayerState,
  Album,
  AlbumDetailResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug logging for admin requests
      if (config.url?.includes('/admin/')) {
        console.log('Admin API request:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenPreview: token ? `${token.slice(0, 20)}...` : 'none'
        });
      }
    } else {
      console.warn('No auth token found for request:', config.url);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ErrorResponse>) => {
    // Handle auth errors - but be careful with admin operations
    if (error.response?.status === 401) {
      const isAdminOperation = error.config?.url?.includes('/admin/');
      
      if (isAdminOperation) {
        console.warn('401 on admin operation - may be temporary:', error.config?.url);
        // Don't immediately clear tokens for admin operations
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { isAdminOperation: true } 
        }));
      } else {
        // Clear tokens for non-admin operations
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", {
      email,
      password,
    });
    return response.data;
  },

  loginAsGuest: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/guest");
    return response.data;
  },

  fetchUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/users/me");
    return response.data;
  },

  getGoogleAuthUrl: (guestId?: string): string => {
    const url = `${API_BASE_URL}/auth/google/login`;
    return guestId ? `${url}?guest_id=${guestId}` : url;
  },

  getYandexAuthUrl: (guestId?: string): string => {
    const url = `${API_BASE_URL}/auth/yandex/login`;
    return guestId ? `${url}?guest_id=${guestId}` : url;
  },
};

// Tracks API
export const tracksAPI = {
  getTracks: async (
    page: number = 1,
    limit: number = 20,
    genre?: string,
  ): Promise<TracksResponse> => {
    const params: any = { page, limit };
    if (genre && genre.trim() !== '') {
      params.genre = genre;
    }
    
    const response = await apiClient.get<TracksResponse>("/tracks", {
      params,
    });
    return response.data;
  },

  getMyTracks: async (): Promise<Track[]> => {
    const response = await apiClient.get<{ tracks: Track[] }>("/tracks/my");
    return response.data.tracks;
  },

  getStreamUrl: (trackId: string): string => {
    return `${API_BASE_URL}/tracks/${trackId}/stream`;
  },

  getCoverUrl: (trackId: string): string => {
    if (!trackId || typeof trackId !== 'string') {
      console.error('getCoverUrl: Invalid trackId:', trackId, typeof trackId);
      return `${API_BASE_URL}/tracks/invalid/cover`;
    }
    return `${API_BASE_URL}/tracks/${trackId}/cover`;
  },

  // Проверка существования обложки
  checkCoverExists: async (trackId: string): Promise<boolean> => {
    try {
      const response = await apiClient.head(`/tracks/${trackId}/cover`);
      return response.status === 200;
    } catch {
      return false;
    }
  },

  toggleLike: async (trackId: string): Promise<LikeResponse> => {
    const response = await apiClient.post<LikeResponse>(
      `/tracks/${trackId}/like`,
    );
    return response.data;
  },

  recordPlay: async (trackId: string): Promise<void> => {
    await apiClient.post(`/tracks/${trackId}/play`);
  },

  getTrack: async (trackId: string): Promise<Track> => {
    const response = await apiClient.get<Track>(`/tracks/${trackId}`);
    return response.data;
  },

  getAlbumDetails: async (albumId: string): Promise<AlbumDetailResponse> => {
    const response = await apiClient.get<AlbumDetailResponse>(`/albums/${albumId}`);
    return response.data;
  },

  getAlbums: async (
    page: number = 1,
    limit: number = 20,
    genre?: string,
  ): Promise<Album[]> => {
    const params: any = { page, limit };
    if (genre && genre.trim() !== '') {
      params.genre = genre;
    }
    
    const response = await apiClient.get<Album[]>("/albums", {
      params,
    });
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Legacy track upload (keeping for backward compatibility)
  uploadTrack: async (formData: FormData): Promise<Track> => {
    const response = await apiClient.post<Track>(
      "/admin/tracks/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  deleteTrack: async (trackId: string): Promise<void> => {
    await apiClient.delete(`/admin/tracks/${trackId}`);
  },

  // New album-based API
  createAlbum: async (formData: FormData): Promise<Album> => {
    const response = await apiClient.post<Album>(
      "/admin/albums",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  uploadTrackToAlbum: async (albumId: string, formData: FormData): Promise<Track> => {
    const response = await apiClient.post<Track>(
      `/admin/albums/${albumId}/tracks`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  getAdminAlbums: async (): Promise<Album[]> => {
    const response = await apiClient.get<Album[]>("/albums");
    return response.data;
  },

  deleteAlbum: async (albumId: string): Promise<void> => {
    await apiClient.delete(`/admin/albums/${albumId}`);
  },
};

// User Profile API
export const userAPI = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>("/users/me");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>("/users/me", data);
    return response.data;
  },

  removeAvatar: async (): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>("/users/me", {
      avatar_key: null
    });
    return response.data;
  },

  savePlayerState: async (playerState: Omit<PlayerState, 'updated_at'>): Promise<void> => {
    await apiClient.post("/users/player-state", playerState);
  },
};

// Avatar upload utility
export const uploadAvatar = async (file: File): Promise<string> => {
  // Convert to base64 for simple implementation
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Ошибка преобразования файла"));
      }
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
};

export default apiClient;

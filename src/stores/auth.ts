import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserProfile } from '../types';
import { authAPI, userAPI } from '../api/client';
import { isTokenValid, getUserDataFromToken } from '../utils/jwt';
import { extractOAuthParams, clearOAuthParams, isOAuthCallback } from '../utils/oauth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const userProfile = ref<UserProfile | null>(null);
  const token = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isGuest = computed(() => user.value?.role === 'guest');

  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('auth_token', newToken);
    // Оставляем старый ключ для обратной совместимости
    localStorage.setItem('token', newToken);
  };

  const setUser = (newUser: User) => {
    user.value = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    setToken(response.token);
    setUser(response.user);
  };

  const register = async (email: string, password: string) => {
    const response = await authAPI.register(email, password);
    setToken(response.token);
    setUser(response.user);
  };

  const loginAsGuest = async () => {
    const response = await authAPI.loginAsGuest();
    setToken(response.token);
    setUser(response.user);
  };

  const fetchUser = async () => {
    const userData = await authAPI.fetchUser();
    setUser(userData);
  };

  const fetchUserProfile = async () => {
    try {
      userProfile.value = await userAPI.getProfile();
      
      // Check for player state and restore if available
      // Note: This will be enabled when backend supports player state sync
      if (userProfile.value?.last_track && userProfile.value?.player_state) {
        try {
          const { usePlayerStore } = await import('./player');
          const playerStore = usePlayerStore();
          
          await playerStore.restoreState(
            userProfile.value.last_track,
            userProfile.value.player_state.position,
            userProfile.value.player_state.volume
          );
        } catch (error) {
          console.log('Player state restoration not available yet:', error);
        }
      }
      
      return userProfile.value;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: { name?: string; avatar_url?: string | null }) => {
    try {
      userProfile.value = await userAPI.updateProfile(data);
      return userProfile.value;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  const logout = () => {
    user.value = null;
    userProfile.value = null;
    token.value = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleOAuthCallback = () => {
    if (!isOAuthCallback()) return false;
    
    const params = extractOAuthParams();
    
    if (params.error) {
      console.error('OAuth error:', params.error);
      clearOAuthParams();
      return false;
    }
    
    if (params.token) {
      if (isTokenValid(params.token)) {
        setToken(params.token);
        
        // Попытаться извлечь данные пользователя из токена
        const userData = getUserDataFromToken(params.token);
        if (userData) {
          setUser({
            id: userData.user_id.toString(),
            email: userData.email,
            role: userData.role as 'user' | 'admin' | 'guest',
            provider: params.provider as 'google' | 'yandex' | 'local' || 'local',
            created_at: new Date().toISOString()
          });
        }
        
        clearOAuthParams();
        return true;
      } else {
        console.error('Invalid token received from OAuth');
        clearOAuthParams();
        return false;
      }
    }
    
    return false;
  };

  const initialize = () => {
    // Сначала проверяем OAuth callback
    if (handleOAuthCallback()) {
      return;
    }
    
    // Затем проверяем сохраненные данные
    const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && isTokenValid(storedToken)) {
      token.value = storedToken;
    } else if (storedToken) {
      // Токен есть но не валидный - очищаем
      logout();
    }

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
  };

  // Слушать события авто-logout
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', (event: any) => {
      // Don't auto-logout if we're on admin page and it might be a temporary issue
      const isOnAdminPage = window.location.pathname.includes('/admin');
      if (isOnAdminPage && event.detail?.isAdminOperation) {
        console.warn('Skipping auto-logout for admin operation');
        return;
      }
      logout();
    });
  }

  return {
    user,
    userProfile,
    token,
    isAuthenticated,
    isAdmin,
    isGuest,
    setToken,
    setUser,
    login,
    register,
    loginAsGuest,
    fetchUser,
    fetchUserProfile,
    updateUserProfile,
    logout,
    initialize,
    handleOAuthCallback,
  };
});

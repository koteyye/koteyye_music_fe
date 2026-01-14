<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useAuthStore } from './stores/auth';
import { usePlayerStore } from './stores/player';
import GlobalPlayer from './components/GlobalPlayer.vue';
import { useTheme } from './composables/useTheme';

const authStore = useAuthStore();
const playerStore = usePlayerStore();
const { isDark } = useTheme();

const isInitializing = ref(true);
const initError = ref<string | null>(null);

const handleReload = () => {
  window.location.reload();
};

onMounted(async () => {
  try {
    // Инициализируем состояние из localStorage
    authStore.initialize();
    
    // Инициализируем плеер из localStorage
    if (!playerStore.isInitialized) {
      await playerStore.initializeFromStorage();
    }
    
    // Если токена нет совсем — логинимся как гость
    if (!authStore.token) {
      try {
        await authStore.loginAsGuest();
      } catch (guestError) {
        console.error('Guest login failed:', guestError);
        // Не блокируем приложение, если гостевой вход не удался сразу
        // Пользователь увидит интерфейс, но запросы могут падать
      }
    }
    // Если токен есть — пытаемся получить профиль (валидация)
    else {
      try {
        await authStore.fetchUser();
      } catch (e) {
        console.warn('Token validation failed, logging in as guest...');
        // Если токен протух — снова логинимся как гость
        try {
          await authStore.loginAsGuest();
        } catch (guestError) {
           console.error('Guest re-login failed:', guestError);
        }
      }
    }
  } catch (error: any) {
    console.error('App initialization failed:', error);
    initError.value = 'Не удалось загрузить приложение. Пожалуйста, обновите страницу.';
  } finally {
    isInitializing.value = false;
  }
});

// Only cleanup on app shutdown, not on navigation
onUnmounted(() => {
  playerStore.fullCleanup();
});
</script>

<template>
    <div 
        id="app" 
        class="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-24 bg-cream dark:bg-zinc-900 dark:text-gray-100 transition-colors duration-300"
    >
        <div v-if="isInitializing" class="flex h-screen w-full items-center justify-center">
            <div class="flex flex-col items-center gap-4">
                <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-kot-orange"></div>
                <p class="text-gray-500 dark:text-gray-400">Загрузка...</p>
            </div>
        </div>

        <div v-else-if="initError" class="flex h-screen w-full items-center justify-center p-4">
            <div class="text-center">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">Ошибка запуска</h3>
                <p class="text-gray-500 dark:text-gray-400">{{ initError }}</p>
                <button 
                    @click="handleReload" 
                    class="mt-6 rounded-xl bg-kot-orange px-6 py-2 text-white hover:bg-orange-600 transition-colors"
                >
                    Обновить страницу
                </button>
            </div>
        </div>

        <template v-else>
            <!-- Main router view -->
            <RouterView />
            
            <!-- Global Player -->
            <GlobalPlayer />
        </template>
    </div>
</template>

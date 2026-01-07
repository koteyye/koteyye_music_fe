<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { usePlayerStore } from './stores/player';
import GlobalPlayer from './components/GlobalPlayer.vue';
import { useTheme } from './composables/useTheme';


const authStore = useAuthStore();
const playerStore = usePlayerStore();
const { isDark } = useTheme();

onMounted(async () => {
  // Инициализируем состояние из localStorage
  authStore.initialize();
  
  // Инициализируем плеер из localStorage
  if (!playerStore.isInitialized) {
    await playerStore.initializeFromStorage();
  }
  
  // Если токена нет совсем — логинимся как гость
  if (!authStore.token) {
    await authStore.loginAsGuest();
  }
  // Если токен есть — пытаемся получить профиль (валидация)
  else {
    try {
      await authStore.fetchUser();
    } catch (e) {
      // Если токен протух — снова логинимся как гость
      await authStore.loginAsGuest();
    }
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
        <!-- Main router view -->
        <RouterView />
        
        <!-- Global Player -->
        <GlobalPlayer />
    </div>
</template>

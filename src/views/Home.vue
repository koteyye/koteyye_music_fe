<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { LogOut, Shield, Sun, Moon } from "lucide-vue-next";

import TrackList from "../components/TrackList.vue";
import AlbumGrid from "../components/AlbumGrid.vue";
import GenreFilter from "../components/GenreFilter.vue";
import ContentToggle from "../components/ContentToggle.vue";
import UserAvatar from "../components/UserAvatar.vue";
import KoteyyeLogo from "../components/KoteyyeLogo.vue";
import { usePlayerStore } from "../stores/player";
import { useAuthStore } from "../stores/auth";
import { tracksAPI } from "../api/client";
import { useTheme } from "../composables/useTheme";
import type { UserProfile } from "../types";

const playerStore = usePlayerStore();
const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();
const router = useRouter();
const route = useRoute();

// Auth store инициализируется в App.vue

// Navigate to login page
const goToLogin = () => {
    router.push('/login');
};

const goToProfile = () => {
    router.push('/profile');
};

const userProfile = ref<UserProfile | null>(null);

// Восстанавливаем жанр из localStorage
const getInitialGenre = (): string => {
    return localStorage.getItem('home_selected_genre') || '';
};

const selectedGenre = ref(getInitialGenre());

// Восстанавливаем состояние из localStorage или route query
const getInitialTab = (): 'tracks' | 'albums' => {
    // Сначала проверяем query параметры в URL
    const tabFromQuery = route.query.tab as string;
    if (tabFromQuery === 'albums' || tabFromQuery === 'tracks') {
        return tabFromQuery as 'tracks' | 'albums';
    }
    
    // Затем проверяем localStorage
    const savedTab = localStorage.getItem('home_active_tab');
    if (savedTab === 'albums' || savedTab === 'tracks') {
        return savedTab as 'tracks' | 'albums';
    }
    
    // По умолчанию треки
    return 'tracks';
};

const activeTab = ref<'tracks' | 'albums'>(getInitialTab());

const loadUserProfile = async () => {
    if (authStore.isAuthenticated && !authStore.isGuest) {
        try {
            userProfile.value = await authStore.fetchUserProfile();
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }
};

// Handle genre selection
const handleGenreSelect = async (genre: string) => {
    selectedGenre.value = genre;
    // Сохраняем жанр в localStorage
    localStorage.setItem('home_selected_genre', genre);
};

// Watch для сохранения состояния вкладки
watch(activeTab, (newTab) => {
    // Сохраняем в localStorage
    localStorage.setItem('home_active_tab', newTab);
    
    // Обновляем URL без перезагрузки страницы
    const newQuery = { ...route.query, tab: newTab };
    router.replace({ query: newQuery });
}, { immediate: true });

// Handle deep linking for shared tracks
const handleTrackDeepLink = async () => {
    const trackId = route.params.id as string;
    if (trackId) {
        try {
            // Загружаем конкретный трек
            const track = await tracksAPI.getTrack(trackId);
            
            // Запускаем трек
            playerStore.playTrack(track);
            
            // Проверяем, нужно ли открыть плеер
            const shouldOpenPlayer = route.query.player === 'open';
            if (shouldOpenPlayer && !playerStore.isExpanded) {
                // Небольшая задержка, чтобы трек успел загрузиться
                setTimeout(() => {
                    playerStore.toggleExpand();
                }, 500);
            }
            
            // Загружаем общий список треков для очереди
            const response = await tracksAPI.getTracks(1, 20);
            if (response.tracks && response.tracks.length > 0) {
                // Добавляем треки в очередь, начиная с текущего
                const allTracks = [track, ...response.tracks.filter(t => t.id !== track.id)];
                playerStore.setQueue(allTracks, track.id);
            }
        } catch (error) {
            console.error('Failed to load shared track:', error);
            // В случае ошибки просто загружаем обычный список
            router.push('/');
        }
    }
};

// Load user profile on mount
onMounted(async () => {
    // Плеер уже инициализируется в App.vue, не нужно дублировать
    // if (!playerStore.isInitialized) {
    //     playerStore.initializeFromStorage();
    // }
    
    await loadUserProfile();
    await handleTrackDeepLink();
});

// Don't cleanup player state when leaving home page - keep it persistent
// onUnmounted(() => {
//     playerStore.cleanup();
// });
</script>

<template>
    <div class="min-h-screen p-4 md:p-8 bg-[rgba(253,246,227,0.9)] backdrop-blur-[4px] dark:bg-zinc-900/90 dark:backdrop-blur-none transition-colors duration-300">
        <div class="max-w-6xl mx-auto space-y-8">
            <!-- Header with Logo and Auth Button -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-3">
                    <div class="w-16 h-16 border-2 border-orange-500 rounded-2xl flex items-center justify-center shadow-lg p-2 bg-cream dark:bg-zinc-800 transition-colors">
                        <KoteyyeLogo container-class="w-full h-full" />
                    </div>
                    <h1 class="text-3xl md:text-4xl font-bold text-kot-dark dark:text-gray-100 transition-colors">
                        Koteyye Music
                    </h1>
                </div>

                <!-- Auth Section -->
                <div class="flex items-center gap-4">
                    <!-- Theme Toggle -->
                    <button 
                        @click="toggleTheme" 
                        class="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-kot-dark dark:text-gray-200"
                        :title="isDark ? 'Включить светлую тему' : 'Включить темную тему'"
                    >
                        <Sun v-if="isDark" class="w-6 h-6" />
                        <Moon v-else class="w-6 h-6" />
                    </button>

                    <!-- Guest: Show Login Button -->
                    <button
                        v-if="authStore.isGuest"
                        @click="goToLogin"
                        class="px-6 py-3 bg-kot-orange hover:bg-orange-600 text-white font-medium rounded-full transition-colors shadow-lg hover:shadow-xl"
                    >
                        Войти
                    </button>
                    
                    <!-- User: Show Profile Avatar and Actions -->
                    <div v-else-if="authStore.isAuthenticated && !authStore.isGuest" class="flex items-center gap-2">
                        <UserAvatar
                            :avatar-url="userProfile?.avatar_url"
                            :name="userProfile?.name"
                            :email="authStore.user?.email"
                            size="md"
                            clickable
                            show-name
                            @click="goToProfile"
                            class="cursor-pointer"
                        />
                        
                        <!-- Admin Panel Button -->
                        <button
                            v-if="authStore.isAdmin"
                            @click="router.push('/admin')"
                            class="p-2 text-gray-500 hover:text-kot-orange hover:bg-orange-50 rounded-full transition-all"
                            title="Админ панель"
                        >
                            <Shield class="w-5 h-5" />
                        </button>
                        
                        <!-- Logout Button -->
                        <button
                            @click="authStore.logout(); authStore.loginAsGuest()"
                            class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Выйти"
                        >
                            <LogOut class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="mb-6">
                <!-- Genre Filter -->
                <div class="mb-4">
                    <GenreFilter 
                        :selected-genre="selectedGenre"
                        @select="handleGenreSelect"
                        class="w-full"
                    />
                </div>
                
                <!-- Content Toggle -->
                <div>
                    <ContentToggle 
                        v-model:active-tab="activeTab"
                    />
                </div>
            </div>

            <!-- Content Based on Active Tab -->
            <TrackList 
                v-if="activeTab === 'tracks'"
                :genre="selectedGenre" 
            />
            <AlbumGrid 
                v-else-if="activeTab === 'albums'"
                :genre="selectedGenre"
            />
        </div>
    </div>
</template>

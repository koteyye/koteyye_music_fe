<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { tracksAPI } from "../api/client";
import { getGenreDisplayName } from "../constants/genres";
import { ArrowLeft, Play, Pause, Clock, Music, Cat } from "lucide-vue-next";
import TrackCover from "../components/TrackCover.vue";
import type { AlbumDetailResponse, Track } from "../types";

const route = useRoute();
const router = useRouter();
const playerStore = usePlayerStore();

const albumDetail = ref<AlbumDetailResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Format duration as MM:SS
const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Check if track is currently playing
const isCurrentlyPlaying = (track: Track): boolean => {
    return playerStore.currentTrack?.id === track.id && playerStore.isPlaying;
};

// Fetch album details
const fetchAlbumDetails = async () => {
    const albumId = route.params.id as string;
    if (!albumId) {
        error.value = "ID альбома не указан";
        loading.value = false;
        return;
    }

    try {
        loading.value = true;
        error.value = null;
        albumDetail.value = await tracksAPI.getAlbumDetails(albumId);
    } catch (err) {
        console.error("Failed to fetch album details:", err);
        error.value = "Не удалось загрузить альбом";
    } finally {
        loading.value = false;
    }
};

// Play album - replace player queue with album tracks
const playAlbum = () => {
    if (albumDetail.value?.tracks && albumDetail.value.tracks.length > 0) {
        const firstTrack = albumDetail.value.tracks[0];
        playerStore.setQueue(albumDetail.value.tracks, firstTrack.id);
        playerStore.playTrack(firstTrack);
    }
};

// Play specific track
const playTrack = (track: Track) => {
    if (albumDetail.value?.tracks) {
        playerStore.setQueue(albumDetail.value.tracks, track.id);
    }
    playerStore.playTrack(track);
};

// Toggle like for track
const toggleLike = async (track: Track) => {
    const originalIsLiked = track.is_liked;
    const originalLikesCount = track.likes_count;

    track.is_liked = !originalIsLiked;
    track.likes_count = originalIsLiked ? originalLikesCount - 1 : originalLikesCount + 1;

    // Update in player store if this is the current track
    playerStore.updateCurrentTrack(track);

    try {
        await tracksAPI.toggleLike(track.id);
    } catch (err) {
        console.error("Failed to toggle like:", err);
        track.is_liked = originalIsLiked;
        track.likes_count = originalLikesCount;
        playerStore.updateCurrentTrack(track);
    }
};

// Go back to home with correct tab state
const goBack = () => {
    // Возвращаемся на главную с вкладкой альбомов
    router.push({
        path: '/',
        query: { tab: 'albums' }
    });
};

onMounted(() => {
    fetchAlbumDetails();
});
</script>

<template>
    <div class="min-h-screen bg-cream p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
            <!-- Back Button -->
            <button
                @click="goBack"
                class="mb-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl transition-all shadow-sm hover:shadow-md"
            >
                <ArrowLeft class="w-5 h-5" />
                На главную
            </button>

            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-kot-orange"></div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-12">
                <p class="text-red-600 text-lg">{{ error }}</p>
            </div>

            <!-- Album Details -->
            <div v-else-if="albumDetail" class="space-y-8">
                <!-- Album Header -->
                <div class="bg-gradient-to-br from-kot-orange to-orange-600 rounded-3xl p-8 text-white">
                    <div class="flex flex-col md:flex-row gap-8 items-start">
                        <!-- Album Cover -->
                        <div class="flex-shrink-0">
                            <div class="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    v-if="albumDetail.album.cover_url"
                                    :src="albumDetail.album.cover_url"
                                    :alt="albumDetail.album.title"
                                    class="w-full h-full object-cover"
                                />
                                <div v-else class="w-full h-full bg-white/20 flex items-center justify-center">
                                    <Music class="w-16 h-16 text-white/50" />
                                </div>
                            </div>
                        </div>

                        <!-- Album Info -->
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-white/80 mb-2">Альбом</p>
                            <h1 class="text-4xl md:text-5xl font-bold mb-4 break-words">
                                {{ albumDetail.album.title }}
                            </h1>
                            <p class="text-xl text-white/90 mb-4">
                                {{ albumDetail.album.artist }}
                            </p>
                            
                            <div class="flex flex-wrap items-center gap-4 text-sm text-white/80 mb-6">
                                <!-- Genre -->
                                <span v-if="albumDetail.album.genre" class="flex items-center gap-2">
                                    <span class="w-2 h-2 bg-white/50 rounded-full"></span>
                                    {{ getGenreDisplayName(albumDetail.album.genre) }}
                                </span>
                                
                                <!-- Year -->
                                <span v-if="albumDetail.album.year" class="flex items-center gap-2">
                                    <span class="w-2 h-2 bg-white/50 rounded-full"></span>
                                    {{ albumDetail.album.year }}
                                </span>
                                
                                <!-- Track Count -->
                                <span v-if="albumDetail.tracks" class="flex items-center gap-2">
                                    <span class="w-2 h-2 bg-white/50 rounded-full"></span>
                                    {{ albumDetail.tracks.length }} {{ albumDetail.tracks.length === 1 ? 'трек' : 'треков' }}
                                </span>
                            </div>

                            <!-- Play Album Button -->
                            <button
                                @click="playAlbum"
                                :disabled="!albumDetail.tracks?.length"
                                class="flex items-center gap-3 px-8 py-4 bg-white text-kot-orange font-semibold rounded-2xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play class="w-6 h-6 ml-0.5" />
                                Слушать альбом
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Track List -->
                <div v-if="albumDetail.tracks?.length" class="bg-white rounded-3xl shadow-xl p-6">
                    <h2 class="text-2xl font-bold text-kot-dark mb-6">Список треков</h2>
                    
                    <div class="space-y-2">
                        <div
                            v-for="(track, index) in albumDetail.tracks"
                            :key="track.id"
                            class="group flex items-center gap-3 p-3 md:p-4 rounded-2xl transition-all hover:bg-gray-50 cursor-pointer"
                            @click="playTrack(track)"
                        >
                            <!-- Track Number (только десктоп) -->
                            <div class="hidden md:block w-8 text-center flex-shrink-0">
                                <span
                                    v-if="!isCurrentlyPlaying(track)"
                                    class="text-gray-400 group-hover:hidden"
                                >
                                    {{ index + 1 }}
                                </span>
                                <Play
                                    v-if="!isCurrentlyPlaying(track)"
                                    class="w-4 h-4 text-kot-orange hidden group-hover:block"
                                />
                                <div
                                    v-if="isCurrentlyPlaying(track)"
                                    class="w-4 h-4 text-kot-orange"
                                >
                                    <div class="flex items-center gap-1">
                                        <div class="w-1 h-3 bg-kot-orange animate-pulse"></div>
                                        <div class="w-1 h-2 bg-kot-orange animate-pulse" style="animation-delay: 0.1s"></div>
                                        <div class="w-1 h-3 bg-kot-orange animate-pulse" style="animation-delay: 0.2s"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Track Cover (только десктоп) -->
                            <div class="hidden md:block flex-shrink-0">
                                <TrackCover
                                    :track="track"
                                    size="small"
                                    :lazy="false"
                                />
                            </div>

                            <!-- Track Info -->
                            <div class="flex-1 min-w-0">
                                <h3
                                    class="font-semibold text-kot-dark truncate transition-colors text-sm md:text-base"
                                    :class="{
                                        'text-kot-orange': isCurrentlyPlaying(track),
                                    }"
                                >
                                    {{ track.title }}
                                </h3>
                                <p class="text-xs md:text-sm text-gray-500 truncate">
                                    {{ track.artist_name || track.artist }}
                                </p>
                                <!-- Длительность для мобильной версии -->
                                <p class="text-xs text-gray-400 md:hidden">
                                    {{ formatDuration(track.duration_seconds) }}
                                </p>
                            </div>

                            <!-- Duration (только десктоп) -->
                            <div class="hidden md:flex text-sm text-gray-400 flex-shrink-0 items-center gap-2">
                                <Clock class="w-4 h-4" />
                                {{ formatDuration(track.duration_seconds) }}
                            </div>

                            <!-- Like Button (только десктоп) -->
                            <button
                                @click.stop="toggleLike(track)"
                                class="hidden md:flex items-center gap-2 px-3 py-2 rounded-full transition-colors flex-shrink-0"
                                :class="{
                                    'bg-orange-100 text-kot-orange': track.is_liked,
                                    'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-kot-orange': !track.is_liked,
                                }"
                            >
                                <Cat
                                    class="w-4 h-4 transition-all"
                                    :class="{ 'fill-current': track.is_liked }"
                                />
                                <span class="text-sm font-medium">{{ track.likes_count }}</span>
                            </button>

                            <!-- Play Button (мобильная версия) -->
                            <button 
                                @click.stop="playTrack(track)"
                                class="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-kot-orange text-white hover:bg-orange-600 transition-colors shadow-sm flex-shrink-0"
                            >
                                <Play 
                                    v-if="!isCurrentlyPlaying(track)" 
                                    :size="14" 
                                    class="ml-0.5"
                                />
                                <Pause v-else :size="14" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-12">
                    <p class="text-gray-500">В альбоме пока нет треков</p>
                </div>
            </div>
        </div>
    </div>
</template>
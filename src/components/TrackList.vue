<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { tracksAPI } from "../api/client";
import { getGenreDisplayName } from "../constants/genres";
import { Play, Pause, Cat, Clock, Music } from "lucide-vue-next";
import TrackCover from "./TrackCover.vue";
import type { Track } from "../types";

interface Props {
    genre?: string;
}

const props = withDefaults(defineProps<Props>(), {
    genre: ''
});

const playerStore = usePlayerStore();
const router = useRouter();
const tracks = ref<Track[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Предварительная загрузка обложек для видимых треков
const preloadTrackCovers = (tracks: Track[]) => {
    tracks.slice(0, 10).forEach(track => {
        if (track.s3_image_key && track.s3_image_key.trim() !== '') {
            const img = new Image();
            img.src = tracksAPI.getCoverUrl(track.id);
        }
    });
};

// Fetch tracks on mount
const fetchTracks = async () => {
    try {
        loading.value = true;
        error.value = null;
        const response = await tracksAPI.getTracks(1, 20, props.genre);
        tracks.value = response.tracks || [];
        
        // Временная отладка: проверим структуру данных
        if (tracks.value.length > 0) {
            console.log('First track data:', tracks.value[0]);
            console.log('Album fields:', {
                album: tracks.value[0].album,
                album_title: tracks.value[0].album_title,
                album_id: tracks.value[0].album_id
            });
        }
        
        // Предварительно загружаем первые 10 обложек
        if (tracks.value.length > 0) {
            preloadTrackCovers(tracks.value);
        }
    } catch (err) {
        console.error("Failed to fetch tracks:", err);
        error.value = "Не удалось загрузить треки";
    } finally {
        loading.value = false;
    }
};

// Play track
const playTrack = (track: Track) => {
    // Загружаем весь список в очередь и начинаем воспроизведение выбранного трека
    playerStore.setQueue(tracks.value, track.id);
};

// Toggle like with optimistic update
const toggleLike = async (track: Track) => {
    // Optimistic update - update UI immediately
    const originalIsLiked = track.is_liked;
    const originalLikesCount = track.likes_count;

    track.is_liked = !originalIsLiked;
    track.likes_count = originalIsLiked
        ? originalLikesCount - 1
        : originalLikesCount + 1;

    // Update in player store if this is the current track
    playerStore.updateCurrentTrack(track);

    try {
        await tracksAPI.toggleLike(track.id);
    } catch (err) {
        // Revert on error
        console.error("Failed to toggle like:", err);
        track.is_liked = originalIsLiked;
        track.likes_count = originalLikesCount;
        // Revert in player store as well
        playerStore.updateCurrentTrack(track);
    }
};

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

// Get year from track release_date (fallback to created_at)
const getTrackYear = (track: Track): string => {
    const dateString = track.release_date || track.created_at;
    if (!dateString) return '';
    
    try {
        return new Date(dateString).getFullYear().toString();
    } catch {
        return '';
    }
};

// Load tracks on mount
onMounted(() => {
    fetchTracks();
});

// Watch for genre changes
watch(() => props.genre, () => {
    fetchTracks();
});

// Navigate to album page
const goToAlbum = (track: Track) => {
    console.log('goToAlbum called for track:', track.title, 'album_id:', track.album_id);
    
    if (track.album_id) {
        router.push(`/albums/${track.album_id}`);
    } else {
        console.warn('No album_id found for track:', track);
    }
};
</script>

<template>
    <div class="bg-white rounded-3xl shadow-xl p-6">
        <h2
            class="text-2xl font-bold text-kot-dark mb-4 flex items-center gap-2"
        >
            <Music class="w-6 h-6 text-kot-orange" />
            Треки
        </h2>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
            <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-kot-orange"
            ></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12 text-red-500">
            <p class="text-lg">{{ error }}</p>
            <button
                @click="fetchTracks"
                class="mt-4 px-6 py-2 bg-kot-orange text-white rounded-full hover:bg-orange-600 transition-colors"
            >
                Попробовать снова
            </button>
        </div>

        <!-- Empty State -->
        <div
            v-else-if="!tracks || tracks.length === 0"
            class="text-center py-12 text-gray-400"
        >
            <Music class="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p class="text-lg">Треки не найдены</p>
        </div>

        <!-- Track List -->
        <div v-else class="space-y-2">
            <div
                v-for="track in tracks"
                :key="track.id"
                class="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-200 cursor-pointer group"
                :class="{
                    'bg-orange-50': isCurrentlyPlaying(track),
                    'hover:bg-orange-50': !isCurrentlyPlaying(track),
                }"
                @click="playTrack(track)"
                style="min-height: 68px;"
            >
                <!-- Track Cover -->
                <div class="flex-shrink-0">
                    <TrackCover
                        :track="track"
                        size="medium"
                        :lazy="false"
                        :show-play-overlay="true"
                        @play="playTrack(track)"
                        class="shadow-sm"
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
                    <p class="text-sm text-gray-500 truncate">
                        {{ track.artist_name || track.artist }}
                    </p>
                    <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <!-- Album (скрыт на мобильных) -->
                        <button
                            v-if="track.album_title || track.album"
                            @click.stop="goToAlbum(track)"
                            class="truncate transition-colors text-left hidden md:block"
                            :class="{ 
                                'hover:text-kot-orange hover:underline cursor-pointer': track.album_id,
                                'cursor-default': !track.album_id
                            }"
                            :disabled="!track.album_id"
                        >
                            {{ track.album_title || track.album }}
                        </button>
                        
                        <!-- Separator (скрыт на мобильных) -->
                        <span v-if="(track.album_title || track.album) && (track.genre || getTrackYear(track))" class="text-gray-300 hidden md:inline">•</span>
                        
                        <!-- Genre (скрыт на планшетах и меньше) -->
                        <span v-if="track.genre" class="flex-shrink-0 hidden lg:inline">
                            {{ getGenreDisplayName(track.genre) }}
                        </span>
                        
                        <!-- Separator (скрыт на планшетах и меньше) -->
                        <span v-if="track.genre && getTrackYear(track)" class="text-gray-300 hidden lg:inline">•</span>
                        
                        <!-- Year (скрыт на планшетах и меньше) -->
                        <span v-if="getTrackYear(track)" class="flex-shrink-0 hidden lg:inline">
                            {{ getTrackYear(track) }}
                        </span>
                    </div>
                </div>

                <!-- Duration (всегда видимый, компактный на мобильных) -->
                <div class="flex items-center gap-1 text-gray-400 text-xs md:text-sm flex-shrink-0 mr-1 md:mr-0">
                    <Clock class="w-3 h-3 md:w-4 md:h-4" />
                    <span>{{ formatDuration(track.duration_seconds) }}</span>
                </div>

                <!-- Desktop Controls (скрыты на мобильных) -->
                <div class="hidden md:flex items-center gap-2 flex-shrink-0">
                    <!-- Play Button -->
                    <button
                        @click.stop="playTrack(track)"
                        class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                        :class="{
                            'bg-kot-orange text-white shadow-lg shadow-orange-500/30':
                                isCurrentlyPlaying(track),
                            'bg-gray-100 text-gray-400 group-hover:bg-kot-orange group-hover:text-white':
                                !isCurrentlyPlaying(track),
                        }"
                        style="min-width: 44px; min-height: 44px;"
                    >
                        <Pause
                            v-if="isCurrentlyPlaying(track)"
                            class="w-4 h-4"
                        />
                        <Play v-else class="w-4 h-4 ml-0.5" />
                    </button>

                    <!-- Like Button -->
                    <button
                        @click.stop="toggleLike(track)"
                        class="flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
                        :class="{
                            'bg-orange-100 text-kot-orange': track.is_liked,
                            'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-kot-orange':
                                !track.is_liked,
                        }"
                    >
                        <Cat
                            class="w-5 h-5 transition-all"
                            :class="{ 'fill-current': track.is_liked }"
                        />
                        <span class="font-medium">{{ track.likes_count }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Music } from "lucide-vue-next";
export default { components: { Music } };
</script>

<style scoped>
/* Smooth transitions for hover effects */
.group:hover .group-hover\:bg-kot-orange {
    background-color: #ff6600;
}

.group:hover .group-hover\:text-white {
    color: white;
}
</style>

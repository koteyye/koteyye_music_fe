<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { tracksAPI } from "../api/client";
import { getGenreDisplayName } from "../constants/genres";
import TrackCover from "./TrackCover.vue";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Cat,
    Headphones,
    Repeat,
    Shuffle,
    Share2,
    Volume2,
} from "lucide-vue-next";

const playerStore = usePlayerStore();
const router = useRouter();

// Computed properties
const currentTrack = computed(() => playerStore.currentTrack);
const isPlaying = computed(() => playerStore.isPlaying);
const progressPercent = computed(() => playerStore.progressPercent);
const formattedProgress = computed(() => playerStore.formattedProgress);
const formattedDuration = computed(() => playerStore.formattedDuration);
const volume = computed(() => playerStore.volume);
const isShuffled = computed(() => playerStore.isShuffled);
const hasQueue = computed(() => playerStore.queue.length > 0);

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');

// Get year from track release_date (fallback to created_at)
const trackYear = computed(() => {
    const track = currentTrack.value;
    if (!track) return '';
    
    // Приоритет: release_date, затем created_at
    const dateString = track.release_date || track.created_at;
    if (!dateString) return '';
    
    try {
        return new Date(dateString).getFullYear().toString();
    } catch {
        return '';
    }
});

// Actions
const togglePlay = () => playerStore.togglePlay();

const handleSeek = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const percent = parseFloat(target.value);
    playerStore.seekByPercent(percent);
};

const handleVolumeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    playerStore.setVolume(parseFloat(target.value));
};

// Player control functions
const handleShuffle = () => playerStore.toggleShuffle();
const handlePrev = () => playerStore.prevTrack();
const handleNext = () => playerStore.nextTrack();
const handleRepeat = () => {}; // TODO: Implement repeat mode

// Share track function - создаем ссылку с открытым плеером
const shareTrack = async () => {
    if (!currentTrack.value) return;
    
    try {
        const shareUrl = `${window.location.origin}/track/${currentTrack.value.id}?player=open`;
        await navigator.clipboard.writeText(shareUrl);
        
        // Show toast notification
        toastMessage.value = 'Ссылка скопирована!';
        showToast.value = true;
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            showToast.value = false;
        }, 3000);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toastMessage.value = 'Не удалось скопировать ссылку';
        showToast.value = true;
        setTimeout(() => {
            showToast.value = false;
        }, 3000);
    }
};

// Toggle like for current track
const toggleLike = async () => {
    if (!currentTrack.value) return;
    
    const track = currentTrack.value;
    // Optimistic update - update UI immediately
    const originalIsLiked = track.is_liked;
    const originalLikesCount = track.likes_count;

    const updatedTrack = {
        ...track,
        is_liked: !originalIsLiked,
        likes_count: originalIsLiked ? originalLikesCount - 1 : originalLikesCount + 1
    };
    
    // Update in player store
    playerStore.updateCurrentTrack(updatedTrack);

    try {
        await tracksAPI.toggleLike(track.id);
    } catch (err) {
        // Revert on error
        console.error("Failed to toggle like:", err);
        const revertedTrack = {
            ...track,
            is_liked: originalIsLiked,
            likes_count: originalLikesCount
        };
        playerStore.updateCurrentTrack(revertedTrack);
    }
};

// Navigate to album page
const goToAlbum = () => {
    const track = currentTrack.value;
    
    if (track?.album_id) {
        router.push(`/albums/${track.album_id}`);
    } else {
        console.warn('No album_id found for current track:', track);
    }
};
</script>

<template>
    <div class="bg-gradient-to-br from-[#FF9A3D] to-[#FF5500] rounded-[30px] shadow-xl p-8 text-white">
        <div class="flex flex-col md:flex-row gap-8">
            <!-- Left Column: Cover & Stats -->
            <div class="w-full md:w-72 flex-shrink-0">
                <!-- Album Cover -->
                <div class="relative mb-6">
                    <div
                        v-if="currentTrack"
                        class="aspect-square w-full rounded-2xl shadow-2xl overflow-hidden relative"
                    >
                        <TrackCover
                            :track="currentTrack"
                            size="hero"
                            :lazy="false"
                            fallback-type="icon"
                            class="w-full h-full"
                        />
                        <!-- Genre overlay -->
                        <div v-if="currentTrack?.genre" class="absolute top-4 left-4">
                            <p class="text-white text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                {{ getGenreDisplayName(currentTrack.genre) }}
                            </p>
                        </div>
                    </div>
                    <div
                        v-else
                        class="aspect-square w-full rounded-2xl shadow-2xl bg-white/20 flex items-center justify-center"
                    >
                        <div class="text-center">
                            <Cat class="w-20 h-20 mx-auto mb-4 opacity-80" />
                            <p class="text-lg font-semibold opacity-90">Выберите трек</p>
                        </div>
                    </div>
                </div>

                <!-- Statistics Blocks -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- Listeners Block -->
                    <div class="bg-white/20 rounded-2xl p-4 text-center">
                        <Headphones class="w-8 h-8 mx-auto mb-2" />
                        <p class="text-xs text-white/80 mb-1">Слушателей</p>
                        <p class="text-lg font-bold">{{ currentTrack?.plays_count || 0 }}</p>
                    </div>

                    <!-- Cats (Likes) Block -->
                    <button 
                        @click="toggleLike"
                        :disabled="!currentTrack"
                        class="bg-white/20 rounded-2xl p-4 text-center transition-all hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Поставить котика"
                    >
                        <Cat 
                            :class="{ 'fill-current': currentTrack?.is_liked }"
                            class="w-8 h-8 mx-auto mb-2 transition-all" 
                        />
                        <p class="text-xs text-white/80 mb-1">Котиков</p>
                        <p class="text-lg font-bold">{{ currentTrack?.likes_count || 0 }}</p>
                    </button>
                </div>
            </div>

            <!-- Right Column: Controls -->
            <div class="flex-1 flex flex-col justify-between h-[300px]">
                <!-- Track Info -->
                <div>
                    <h1 class="text-3xl font-bold mb-2">
                        {{ currentTrack?.title || 'Нет трека' }}
                    </h1>
                    
                    <p class="text-xl mb-1">
                        {{ currentTrack?.artist || 'Выберите трек для воспроизведения' }}
                    </p>
                    
                    <div v-if="currentTrack?.album_title || currentTrack?.album" class="text-white/80 text-sm">
                        <button
                            @click="goToAlbum"
                            class="transition-colors text-left"
                            :class="{ 
                                'hover:text-white hover:underline cursor-pointer': currentTrack?.album_id, 
                                'cursor-default': !currentTrack?.album_id
                            }"
                            :disabled="!currentTrack?.album_id"
                        >
                            {{ currentTrack.album_title || currentTrack.album }}
                        </button>
                        <span>{{ trackYear ? ` • ${trackYear}` : '' }}</span>
                    </div>
                    <p v-else class="text-white/80 text-sm">
                        {{ currentTrack ? `Сингл${trackYear ? ` • ${trackYear}` : ''}` : 'Музыка для котов' }}
                    </p>
                </div>

                <!-- Progress Bar -->
                <div class="my-8">
                    <div class="mb-2">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            :value="progressPercent"
                            @input="handleSeek"
                            :disabled="!currentTrack"
                            class="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer slider-white"
                        />
                    </div>
                    <div class="flex justify-between text-sm text-white/80">
                        <span>{{ formattedProgress }}</span>
                        <span>{{ formattedDuration }}</span>
                    </div>
                </div>

                <!-- Control Buttons -->
                <div class="flex items-center justify-center gap-6 mb-6">
                    <!-- Shuffle -->
                    <button
                        @click="handleShuffle"
                        :disabled="!hasQueue"
                        :class="[
                            'text-white transition-opacity',
                            isShuffled ? 'opacity-100' : 'opacity-70',
                            !hasQueue ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-100'
                        ]"
                        title="Перемешать"
                    >
                        <Shuffle class="w-5 h-5" />
                    </button>

                    <!-- Previous -->
                    <button
                        @click="handlePrev"
                        :disabled="!hasQueue"
                        :class="[
                            'text-white transition-opacity',
                            !hasQueue ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
                        ]"
                        title="Предыдущий"
                    >
                        <SkipBack class="w-6 h-6" />
                    </button>

                    <!-- Play/Pause -->
                    <button
                        @click="togglePlay"
                        :disabled="!currentTrack"
                        class="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Pause
                            v-if="isPlaying"
                            class="w-8 h-8 text-[#FF5500]"
                        />
                        <Play 
                            v-else 
                            class="w-8 h-8 text-[#FF5500] ml-0.5" 
                        />
                    </button>

                    <!-- Next -->
                    <button
                        @click="handleNext"
                        :disabled="!hasQueue"
                        :class="[
                            'text-white transition-opacity',
                            !hasQueue ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
                        ]"
                        title="Следующий"
                    >
                        <SkipForward class="w-6 h-6" />
                    </button>

                    <!-- Like -->
                    <button
                        @click="toggleLike"
                        :disabled="!currentTrack"
                        :class="[
                            'transition-all',
                            currentTrack?.is_liked 
                                ? 'text-white opacity-100 scale-110' 
                                : 'text-white/70 hover:text-white hover:opacity-100',
                            !currentTrack ? 'opacity-30 cursor-not-allowed' : ''
                        ]"
                        title="Поставить котика"
                    >
                        <Cat 
                            :class="{ 'fill-current': currentTrack?.is_liked }"
                            class="w-6 h-6 transition-all" 
                        />
                    </button>

                    <!-- Repeat -->
                    <button
                        @click="handleRepeat"
                        class="text-white opacity-70 hover:opacity-100 transition-opacity"
                        title="Повтор"
                    >
                        <Repeat class="w-5 h-5" />
                    </button>
                </div>

                <!-- Bottom section with Volume and Share -->
                <div class="flex items-center justify-between">
                    <!-- Volume Control -->
                    <div class="flex items-center gap-3 flex-1 max-w-xs">
                        <Volume2 class="w-5 h-5 text-white/70" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            :value="volume"
                            @input="handleVolumeChange"
                            class="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer slider-white-small"
                        />
                    </div>

                    <!-- Share Button -->
                    <button
                        v-if="currentTrack"
                        @click="shareTrack"
                        class="flex items-center gap-2 text-white/80 hover:text-white transition-colors ml-6"
                        title="Поделиться треком"
                    >
                        <Share2 class="w-5 h-5" />
                        <span class="text-sm font-medium hidden md:inline">Поделиться</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div
            v-if="showToast"
            class="fixed top-4 right-4 z-50 bg-white text-gray-800 px-6 py-3 rounded-full shadow-xl border border-gray-200 flex items-center gap-2 animate-slide-in"
        >
            <Share2 class="w-4 h-4 text-green-500" />
            <span class="font-medium">{{ toastMessage }}</span>
        </div>
    </div>
</template>

<style scoped>
/* Custom range slider styling for progress bar */
.slider-white::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    margin-top: -6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider-white::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
}

.slider-white::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider-white::-moz-range-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
}

/* Custom range slider styling for volume */
.slider-white-small::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    margin-top: -5px;
}

.slider-white-small::-webkit-slider-runnable-track {
    width: 100%;
    height: 2px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 1px;
}

.slider-white-small::-moz-range-thumb {
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: none;
}

.slider-white-small::-moz-range-track {
    width: 100%;
    height: 2px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 1px;
}

/* Toast animation */
@keyframes slide-in {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate-slide-in {
    animation: slide-in 0.3s ease-out;
}
</style>

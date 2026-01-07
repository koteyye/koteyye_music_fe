<template>
  <div 
    class="absolute bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-zinc-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 pointer-events-auto pb-[env(safe-area-inset-bottom)] transition-colors duration-300"
  >
    <!-- Desktop Click Hint (Always visible & blinking on desktop) -->
    <div class="hidden md:flex absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <span class="text-[10px] text-gray-400 dark:text-gray-500 animate-pulse font-medium tracking-wide">
            Нажмите, чтобы развернуть плеер
        </span>
    </div>

    <!-- Swipe Indicator (только на мобильных) -->
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 md:hidden">
      <div class="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    </div>
    
    <!-- Прогресс-бар сверху -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-zinc-700">
      <div 
        class="h-full bg-kot-orange transition-all duration-100"
        :style="{ width: progressPercent + '%' }"
      ></div>
    </div>

    <div class="flex items-center h-20 px-4 gap-3">
      <!-- Обложка и информация о треке -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="w-12 h-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
          <img 
            :src="trackCover" 
            :alt="currentTrack?.title"
            class="w-full h-full object-cover"
          />
        </div>
        
        <div class="min-w-0 flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm md:text-base transition-colors">{{ currentTrack?.title }}</h4>
          <!-- Артист скрыт на мобильных -->
          <p class="text-sm text-gray-600 dark:text-gray-400 truncate hidden md:block transition-colors">{{ trackArtist }}</p>
        </div>
      </div>

      <!-- Контролы -->
      <div class="flex items-center gap-1 md:gap-2" @click.stop>
        <!-- Play/Pause (всегда видимый) -->
        <button 
          @click="playerStore.togglePlay"
          class="flex items-center justify-center w-11 h-11 md:w-10 md:h-10 rounded-full bg-kot-orange text-white hover:bg-orange-600 transition-colors"
          style="min-width: 44px; min-height: 44px;"
        >
          <Play v-if="!isPlaying" :size="18" class="ml-0.5" />
          <Pause v-else :size="18" />
        </button>
        
        <!-- Next (скрыт на маленьких экранах) -->
        <button 
          @click="playerStore.nextTrack"
          class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <SkipForward :size="16" />
        </button>
        
        <!-- Like (скрыт на маленьких экранах) -->
        <button 
          @click="toggleLike"
          class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full transition-colors"
          :class="currentTrack?.is_liked ? 'text-kot-orange hover:text-orange-600' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
        >
          <Cat 
            :size="16" 
            :class="{ 'fill-current': currentTrack?.is_liked }"
          />
        </button>

        <!-- Volume Control (Desktop only) -->
        <div class="hidden md:flex items-center justify-center relative group w-8 h-8" @click.stop>
          <button class="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 group-hover:text-kot-orange transition-colors">
            <Volume2 :size="18" />
          </button>
          
          <!-- Volume Slider Popup -->
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div class="h-24 flex items-center justify-center w-6 relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                :value="volume"
                @input="(e) => playerStore.setVolume(parseFloat((e.target as HTMLInputElement).value))"
                class="w-24 h-1 bg-gray-200 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer slider-mini -rotate-90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '../../stores/player'
import { tracksAPI } from '../../api/client'
import { buildMediaUrl } from '../../utils/media-urls'
import { Play, Pause, SkipForward, Cat, Volume2 } from 'lucide-vue-next'

const playerStore = usePlayerStore()

const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.isPlaying)
const progressPercent = computed(() => playerStore.progressPercent)
const volume = computed(() => playerStore.volume)

const trackArtist = computed(() => {
  const track = currentTrack.value;
  return track?.artist_name || track?.artist || 'Неизвестный артист';
});

const trackCover = computed(() => {
  const track = currentTrack.value;
  if (!track) return '/default-cover.jpg';
  
  // 1. Try cover_url
  if (track.cover_url) {
    return buildMediaUrl(track.cover_url) || '/default-cover.jpg';
  }
  
  // 2. Fallback to s3_image_key / API
  if (track.s3_image_key) {
    return tracksAPI.getCoverUrl(track.id);
  }

  // 3. Fallback to album cover
  if (track.album_id) {
    return tracksAPI.getAlbumCoverUrl(track.album_id);
  }
  
  return '/default-cover.jpg';
});

// Toggle like for current track
const toggleLike = async () => {
    if (!currentTrack.value) return;
    
    const track = currentTrack.value;
    const originalIsLiked = track.is_liked;
    const originalLikesCount = track.likes_count;

    const updatedTrack = {
        ...track,
        is_liked: !originalIsLiked,
        likes_count: originalIsLiked ? originalLikesCount - 1 : originalLikesCount + 1
    };
    
    playerStore.updateCurrentTrack(updatedTrack);

    try {
        await tracksAPI.toggleLike(track.id);
    } catch (err) {
        console.error("Failed to toggle like:", err);
        const revertedTrack = {
            ...track,
            is_liked: originalIsLiked,
            likes_count: originalLikesCount
        };
        playerStore.updateCurrentTrack(revertedTrack);
    }
};
</script>

<style scoped>
/* Mini Player Volume Slider */
.slider-mini::-webkit-slider-thumb {
  appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #FF6600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.slider-mini::-webkit-slider-track {
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
}

.slider-mini::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #FF6600;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.slider-mini::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  border: none;
}
</style>

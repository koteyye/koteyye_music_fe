<template>
  <div 
    class="fixed inset-0 z-50 bg-black text-white overflow-hidden flex flex-col"
  >
    <!-- Background Layer (Atmosphere) -->
    <div class="absolute inset-0 z-0">
      <img 
        :src="trackCover" 
        :alt="currentTrack?.title"
        class="w-full h-full object-cover blur-3xl opacity-60 scale-125 transition-all duration-700"
      />
      <!-- Gradient Overlay for readability -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90"></div>
    </div>

    <!-- Main Content Layer -->
    <div class="relative z-10 flex flex-col h-full safe-area-inset">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 pt-8 md:p-6">
        <button 
          @click="playerStore.toggleExpand"
          class="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
        >
          <ChevronDown :size="24" class="text-white" />
        </button>
        <span class="text-xs font-medium tracking-widest uppercase text-white/60">Сейчас играет</span>
        <div class="w-10"></div>
      </div>

      <!-- Main Cover Art Area -->
      <div class="flex-1 flex items-center justify-center p-6 md:p-10 min-h-0">
        <div class="relative w-full h-full max-w-2xl max-h-[60vh] md:max-h-[70vh] flex items-center justify-center">
            <img 
              :src="trackCover" 
              :alt="currentTrack?.title"
              class="w-auto h-auto max-w-full max-h-full object-contain drop-shadow-2xl rounded-3xl shadow-2xl"
            />
        </div>
      </div>

      <!-- Controls & Info Area (Bottom) -->
      <div class="p-6 md:p-10 pb-12 md:pb-16 w-full max-w-3xl mx-auto space-y-6 md:space-y-8">
        <!-- Track Info -->
        <div class="flex items-end justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl md:text-4xl font-bold text-white mb-2 truncate leading-tight">
              {{ currentTrack?.title }}
            </h1>
            <button 
              @click="goToAlbum"
              class="text-lg md:text-xl text-white/80 hover:text-white truncate transition-colors text-left w-full"
              :disabled="!currentTrack?.album_id"
            >
              {{ trackArtist }}
            </button>
          </div>
          
          <!-- Like/Share Buttons -->
          <div class="flex items-center gap-4 flex-shrink-0 mb-1">
            <button 
              @click="toggleLike"
              class="text-white/70 hover:text-kot-orange transition-colors active:scale-95"
            >
              <Cat :size="24" :class="{ 'fill-kot-orange text-kot-orange': currentTrack?.is_liked }" />
            </button>
            <button 
              @click="shareTrack"
              class="text-white/70 hover:text-white transition-colors active:scale-95"
            >
              <Share2 :size="22" />
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-2">
          <div 
            class="h-1.5 bg-white/20 rounded-full cursor-pointer group"
            @click="onProgressClick"
          >
            <div 
              class="h-full bg-white rounded-full relative"
              :style="{ width: progressPercent + '%' }"
            >
              <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs md:text-sm font-medium text-white/60">
            <span>{{ formattedProgress }}</span>
            <span>{{ formattedDuration }}</span>
          </div>
        </div>

        <!-- Main Controls -->
        <div class="flex items-center justify-center gap-6 md:gap-10">
          <button 
            @click="playerStore.toggleShuffle"
            class="text-white/60 hover:text-white transition-colors"
            :class="{ 'text-kot-orange hover:text-kot-orange': isShuffled }"
          >
            <Shuffle :size="24" />
          </button>
          
          <button 
            @click="playerStore.prevTrack"
            class="text-white hover:text-kot-orange transition-colors active:scale-95"
          >
            <SkipBack :size="36" class="fill-current" />
          </button>
          
          <button 
            @click="playerStore.togglePlay"
            class="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            <Play v-if="!isPlaying" :size="32" class="ml-1 fill-current" />
            <Pause v-else :size="32" class="fill-current" />
          </button>
          
          <button 
            @click="playerStore.nextTrack"
            class="text-white hover:text-kot-orange transition-colors active:scale-95"
          >
            <SkipForward :size="36" class="fill-current" />
          </button>
          
          <button class="text-white/60 hover:text-white transition-colors">
            <Repeat :size="24" />
          </button>
        </div>

        <!-- Volume (Desktop Only) -->
        <div class="hidden md:flex items-center gap-4 max-w-xs mx-auto transition-opacity duration-300">
          <Volume2 :size="20" class="text-white/60" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            @input="(e) => playerStore.setVolume(parseFloat((e.target as HTMLInputElement).value))"
            class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider hover:h-2 transition-all"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../../stores/player'
import { tracksAPI } from '../../api/client'
import { getGenreDisplayName } from '../../constants/genres'
import { buildMediaUrl } from '../../utils/media-urls'
import { 
  Play, Pause, SkipForward, SkipBack, 
  Cat, Share2, ChevronDown, Shuffle, Repeat, Headphones, Volume2
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'show-toast', message: string): void
}>()

const playerStore = usePlayerStore()
const router = useRouter()

const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.isPlaying)
const isExpanded = computed(() => playerStore.isExpanded)
const progressPercent = computed(() => playerStore.progressPercent)
const formattedProgress = computed(() => playerStore.formattedProgress)
const formattedDuration = computed(() => playerStore.formattedDuration)
const isShuffled = computed(() => playerStore.isShuffled)
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

const shareTrack = async () => {
    if (!currentTrack.value) return;
    
    try {
        const shareUrl = `${window.location.origin}/track/${currentTrack.value.id}?player=open`;
        await navigator.clipboard.writeText(shareUrl);
        emit('show-toast', 'Ссылка скопирована!')
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        emit('show-toast', 'Не удалось скопировать ссылку')
    }
};

const goToAlbum = () => {
    const track = currentTrack.value;
    if (track?.album_id) {
        router.push(`/albums/${track.album_id}`);
        // Maybe collapse player?
        // playerStore.toggleExpand()
    }
};

const onProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = ((event.clientX - rect.left) / rect.width) * 100
  playerStore.seekByPercent(percent)
}
</script>

<style scoped>
/* Volume slider styling */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-webkit-slider-track {
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.slider::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
}
</style>

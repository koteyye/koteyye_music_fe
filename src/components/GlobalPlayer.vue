<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="currentTrack" class="fixed inset-0 z-50 flex flex-col" :class="{ 'pointer-events-none': !isExpanded }">
        <!-- Full Player (Развернутый) -->
        <div 
          v-if="isExpanded" 
          class="flex-1 bg-gradient-to-b from-kot-orange to-orange-300 overflow-hidden pointer-events-auto pb-[env(safe-area-inset-bottom)]"
          @touchstart="handleFullPlayerTouchStart"
          @touchmove="handleFullPlayerTouchMove"
          @touchend="handleFullPlayerTouchEnd"
        >
          <!-- Header с кнопкой свернуть -->
          <div class="flex flex-col items-center p-4 md:p-6 pt-[env(safe-area-inset-top,1rem)] md:pt-6">
            <!-- Swipe Indicator (только на мобильных) -->
            <div class="w-10 h-1 bg-white/30 rounded-full mb-4 md:hidden"></div>
            
            <div class="flex items-center justify-between w-full">
              <button 
                @click="playerStore.toggleExpand"
                class="flex items-center justify-center w-11 h-11 md:w-10 md:h-10 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                style="min-width: 44px; min-height: 44px;"
              >
                <ChevronDown :size="24" class="text-white" />
              </button>
              <div class="text-center hidden md:block">
              </div>
              <div class="w-11 md:w-10"></div>
            </div>
          </div>

          <!-- Mobile/Small Tablet Layout -->
          <div class="md:hidden h-full flex flex-col">
            <div class="flex-1 flex flex-col justify-center px-4 py-2 min-h-0">
              
              <!-- Обложка (адаптивный размер) -->
              <div class="flex justify-center mb-3 sm:mb-4">
                <div class="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl mx-auto"
                     style="max-width: min(280px, 45vw);">
                  <img 
                    :src="trackCover" 
                    :alt="currentTrack.title"
                    class="w-full h-full object-cover"
                  />
                  <!-- Genre overlay -->
                  <div v-if="currentTrack?.genre" class="absolute top-2 left-2">
                    <p class="text-white text-xs font-medium bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      {{ getGenreDisplayName(currentTrack.genre) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Track Info (компактно) -->
              <div class="text-center mb-3 sm:mb-4">
                <h1 class="text-lg sm:text-xl font-bold mb-1 text-white px-4 leading-tight">{{ currentTrack.title }}</h1>
                <p class="text-base sm:text-lg text-white mb-2">{{ trackArtist }}</p>
                
                <div v-if="currentTrack?.album_title || currentTrack?.album" class="text-white/80 text-sm">
                  <button
                    @click="goToAlbum"
                    class="transition-colors text-white/80"
                    :class="{ 
                      'hover:text-white hover:underline cursor-pointer': currentTrack?.album_id, 
                      'cursor-default': !currentTrack?.album_id
                    }"
                    :disabled="!currentTrack?.album_id"
                  >
                    {{ currentTrack.album_title || currentTrack.album }}
                  </button>
                  <span class="text-white/80">{{ trackYear ? ` • ${trackYear}` : '' }}</span>
                </div>
                <p v-else class="text-white/80 text-sm">
                  {{ currentTrack ? `Сингл${trackYear ? ` • ${trackYear}` : ''}` : '' }}
                </p>
              </div>

              <!-- Прогресс-бар -->
              <div class="mb-3 sm:mb-4">
                <div class="flex items-center justify-between text-white/60 text-xs sm:text-sm mb-1">
                  <span>{{ formattedProgress }}</span>
                  <span>{{ formattedDuration }}</span>
                </div>
                <div 
                  class="h-1 bg-white/20 rounded-full cursor-pointer"
                  @click="onProgressClick"
                >
                  <div 
                    class="h-full bg-white rounded-full transition-all duration-100"
                    :style="{ width: progressPercent + '%' }"
                  ></div>
                </div>
              </div>

              <!-- Mobile Controls (компактные) -->
              <div class="flex items-center justify-center gap-3 mb-3">
                <button 
                  @click="playerStore.toggleShuffle"
                  class="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                  :class="isShuffled ? 'bg-white text-kot-orange' : 'text-white/60'"
                  style="min-width: 44px; min-height: 44px;"
                >
                  <Shuffle :size="18" />
                </button>
                
                <button 
                  @click="playerStore.prevTrack"
                  class="flex items-center justify-center w-10 h-10 rounded-full text-white/60"
                  style="min-width: 44px; min-height: 44px;"
                >
                  <SkipBack :size="28" />
                </button>
                
                <button 
                  @click="playerStore.togglePlay"
                  class="flex items-center justify-center w-16 h-16 rounded-full bg-white text-kot-orange shadow-lg"
                  style="min-width: 64px; min-height: 64px;"
                >
                  <Play v-if="!isPlaying" :size="32" class="ml-1" />
                  <Pause v-else :size="32" />
                </button>
                
                <button 
                  @click="playerStore.nextTrack"
                  class="flex items-center justify-center w-10 h-10 rounded-full text-white/60"
                  style="min-width: 44px; min-height: 44px;"
                >
                  <SkipForward :size="28" />
                </button>
                
                <button 
                  @click="toggleLike"
                  class="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                  :class="currentTrack?.is_liked ? 'text-white' : 'text-white/60'"
                  style="min-width: 44px; min-height: 44px;"
                >
                  <Cat 
                    :size="18" 
                    :class="{ 'fill-current': currentTrack?.is_liked }"
                  />
                </button>
              </div>

              <!-- Statistics Blocks (компактные) -->
              <div class="grid grid-cols-3 gap-2">
                <div class="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm text-white">
                  <Headphones class="w-4 h-4 mx-auto mb-1 text-white" />
                  <p class="text-xs text-white/80">{{ currentTrack?.plays_count || 0 }}</p>
                </div>

                <button 
                  @click="toggleLike"
                  :disabled="!currentTrack"
                  class="bg-white/20 rounded-lg p-2 text-center transition-all active:scale-95 backdrop-blur-sm text-white"
                >
                  <Cat 
                    :class="{ 'fill-current': currentTrack?.is_liked }"
                    class="w-4 h-4 mx-auto mb-1 text-white" 
                  />
                  <p class="text-xs text-white">{{ currentTrack?.likes_count || 0 }}</p>
                </button>

                <button 
                  @click="shareTrack"
                  :disabled="!currentTrack"
                  class="bg-white/20 rounded-lg p-2 text-center transition-all active:scale-95 backdrop-blur-sm text-white"
                >
                  <Share2 class="w-4 h-4 mx-auto mb-1 text-white" />
                  <p class="text-xs text-white">•••</p>
                </button>
              </div>
            </div>
          </div>

          <!-- Tablet/Desktop Layout -->
          <div class="hidden md:flex flex-col xl:flex-row gap-6 lg:gap-8 max-w-6xl mx-auto px-6 pb-6 flex-1">
            <!-- Left Column: Cover & Stats (адаптивные размеры) -->
            <div class="w-full xl:w-96 flex-shrink-0 flex flex-col justify-center">
              <!-- Большая обложка -->
              <div class="relative mb-4 lg:mb-6 flex justify-center">
                <div class="aspect-square rounded-3xl overflow-hidden shadow-2xl relative"
                     style="width: min(320px, 50vw, 80vh);">
                  <img 
                    :src="trackCover" 
                    :alt="currentTrack.title"
                    class="w-full h-full object-cover"
                  />
                  <!-- Genre overlay -->
                  <div v-if="currentTrack?.genre" class="absolute top-4 left-4">
                    <p class="text-white text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      {{ getGenreDisplayName(currentTrack.genre) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Statistics Blocks -->
              <div class="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <div class="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm text-white">
                  <Headphones class="w-6 h-6 mx-auto mb-2 text-white" />
                  <p class="text-xs text-white/80 mb-1">Слушателей</p>
                  <p class="text-sm font-bold text-white">{{ currentTrack?.plays_count || 0 }}</p>
                </div>

                <button 
                  @click="toggleLike"
                  :disabled="!currentTrack"
                  class="bg-white/20 rounded-2xl p-3 text-center transition-all hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm text-white"
                  title="Поставить котика"
                >
                  <Cat 
                    :class="{ 'fill-current': currentTrack?.is_liked }"
                    class="w-6 h-6 mx-auto mb-2 transition-all text-white" 
                  />
                  <p class="text-xs text-white/80 mb-1">Котиков</p>
                  <p class="text-sm font-bold text-white">{{ currentTrack?.likes_count || 0 }}</p>
                </button>

                <button 
                  @click="shareTrack"
                  :disabled="!currentTrack"
                  class="bg-white/20 rounded-2xl p-3 text-center transition-all hover:bg-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm text-white"
                  title="Поделиться треком"
                >
                  <Share2 class="w-6 h-6 mx-auto mb-2 text-white" />
                  <p class="text-xs text-white/80 mb-1">Поделиться</p>
                  <p class="text-sm font-bold text-white">•••</p>
                </button>
              </div>
            </div>

            <!-- Right Column: Track Info & Controls -->
            <div class="flex-1 flex flex-col justify-between min-h-0 xl:min-h-[400px]">
              <!-- Track Info -->
              <div class="text-center xl:text-left mb-6 xl:mb-0">
                <h1 class="text-2xl md:text-3xl xl:text-4xl font-bold mb-3 text-white leading-tight">{{ currentTrack.title }}</h1>
                <p class="text-lg md:text-xl xl:text-2xl mb-2 text-white">{{ trackArtist }}</p>
                
                <div v-if="currentTrack?.album_title || currentTrack?.album" class="text-white/80 text-base md:text-lg">
                  <button
                    @click="goToAlbum"
                    class="transition-colors text-white/80"
                    :class="{ 
                      'hover:text-white hover:underline cursor-pointer': currentTrack?.album_id, 
                      'cursor-default': !currentTrack?.album_id
                    }"
                    :disabled="!currentTrack?.album_id"
                  >
                    {{ currentTrack.album_title || currentTrack.album }}
                  </button>
                  <span class="text-white/80">{{ trackYear ? ` • ${trackYear}` : '' }}</span>
                </div>
                <p v-else class="text-white/80 text-base md:text-lg">
                  {{ currentTrack ? `Сингл${trackYear ? ` • ${trackYear}` : ''}` : '' }}
                </p>
              </div>

              <!-- Прогресс-бар -->
              <div class="mb-6 xl:mb-0 xl:my-6">
                <div class="flex items-center justify-between text-white/60 text-sm mb-2">
                  <span>{{ formattedProgress }}</span>
                  <span>{{ formattedDuration }}</span>
                </div>
                <div 
                  class="h-2 bg-white/20 rounded-full cursor-pointer"
                  @click="onProgressClick"
                >
                  <div 
                    class="h-full bg-white rounded-full transition-all duration-100"
                    :style="{ width: progressPercent + '%' }"
                  ></div>
                </div>
              </div>

              <!-- Tablet/Desktop Controls -->
              <div class="flex items-center justify-center gap-6 lg:gap-8">
                <button 
                  @click="playerStore.toggleShuffle"
                  class="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full transition-colors"
                  :class="isShuffled ? 'bg-white text-kot-orange' : 'text-white/60 hover:text-white'"
                >
                  <Shuffle :size="20" class="text-current" />
                </button>
                
                <button 
                  @click="playerStore.prevTrack"
                  class="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full text-white/60 hover:text-white transition-colors"
                >
                  <SkipBack :size="28" class="text-current" />
                </button>
                
                <button 
                  @click="playerStore.togglePlay"
                  class="flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white text-kot-orange hover:scale-105 transition-transform shadow-lg"
                >
                  <Play v-if="!isPlaying" :size="36" class="ml-1 text-current" />
                  <Pause v-else :size="36" class="text-current" />
                </button>
                
                <button 
                  @click="playerStore.nextTrack"
                  class="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full text-white/60 hover:text-white transition-colors"
                >
                  <SkipForward :size="28" class="text-current" />
                </button>
                
                <button class="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full text-white/60 hover:text-white transition-colors">
                  <Repeat :size="20" class="text-current" />
                </button>
              </div>

              <!-- Volume Control -->
              <div class="flex items-center gap-3 mt-6 max-w-sm mx-auto xl:mx-0">
                <Volume2 :size="20" class="text-white/60 flex-shrink-0" />
                <div class="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    :value="volume"
                    @input="(e) => playerStore.setVolume(parseFloat((e.target as HTMLInputElement).value))"
                    class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mini Player (Свернутый) -->
        <div 
          v-if="!isExpanded"
          class="absolute bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 pointer-events-auto pb-[env(safe-area-inset-bottom)]"
          @click="playerStore.toggleExpand"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove" 
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
        >
          <!-- Swipe Indicator (только на мобильных) -->
          <div class="absolute top-2 left-1/2 transform -translate-x-1/2 md:hidden">
            <div class="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          <!-- Прогресс-бар сверху -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gray-200">
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
                  :alt="currentTrack.title"
                  class="w-full h-full object-cover"
                />
              </div>
              
              <div class="min-w-0 flex-1">
                <h4 class="font-semibold text-gray-900 truncate text-sm md:text-base">{{ currentTrack.title }}</h4>
                <!-- Артист скрыт на мобильных -->
                <p class="text-sm text-gray-600 truncate hidden md:block">{{ trackArtist }}</p>
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
                class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <SkipForward :size="16" />
              </button>
              
              <!-- Like (скрыт на маленьких экранах) -->
              <button 
                @click="toggleLike"
                class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                :class="currentTrack?.is_liked ? 'text-kot-orange hover:text-orange-600' : 'text-gray-400 hover:text-gray-600'"
              >
                <Cat 
                  :size="16" 
                  :class="{ 'fill-current': currentTrack?.is_liked }"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showToast"
        class="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { tracksAPI } from '../api/client'
import { getGenreDisplayName } from '../constants/genres'
import { buildMediaUrl } from '../utils/media-urls'
import { 
  Play, Pause, SkipForward, SkipBack, 
  Cat, Share2, ChevronDown, Shuffle, Repeat, Headphones, Volume2
} from 'lucide-vue-next'

const playerStore = usePlayerStore()
const router = useRouter()

// Используем computed из store как в HeroPlayer
const currentTrack = computed(() => playerStore.currentTrack)
const isPlaying = computed(() => playerStore.isPlaying)
const isExpanded = computed(() => playerStore.isExpanded)
const progressPercent = computed(() => playerStore.progressPercent)
const formattedProgress = computed(() => playerStore.formattedProgress)
const formattedDuration = computed(() => playerStore.formattedDuration)
const isShuffled = computed(() => playerStore.isShuffled)
const volume = computed(() => playerStore.volume)

// Helper computed для артиста и обложки (как в HeroPlayer)
const trackArtist = computed(() => {
  const track = currentTrack.value;
  return track?.artist_name || track?.artist || 'Неизвестный артист';
});

const trackCover = computed(() => {
  const track = currentTrack.value;
  return buildMediaUrl(track?.cover_url) || '/default-cover.jpg';
});

// Get year from track release_date (как в HeroPlayer)
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

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');

// Toggle like for current track (как в HeroPlayer)
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

// Share track function (как в HeroPlayer)
const shareTrack = async () => {
    if (!currentTrack.value) return;
    
    try {
        const shareUrl = `${window.location.origin}/track/${currentTrack.value.id}`;
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

// Navigate to album page (как в HeroPlayer)
const goToAlbum = () => {
    const track = currentTrack.value;
    if (track?.album_id) {
        router.push(`/albums/${track.album_id}`);
    }
};

const onProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = ((event.clientX - rect.left) / rect.width) * 100
  playerStore.seekByPercent(percent)
}

// Swipe functionality for mobile
const swipeState = ref({
  startY: 0,
  startTime: 0,
  isDragging: false,
  initialExpanded: false
})

// Touch start handler
const handleTouchStart = (e: TouchEvent) => {
  // Только для mini player
  if (isExpanded.value) return
  
  const touch = e.touches[0]
  swipeState.value = {
    startY: touch.clientY,
    startTime: Date.now(),
    isDragging: true,
    initialExpanded: isExpanded.value
  }
}

// Touch move handler  
const handleTouchMove = (e: TouchEvent) => {
  if (!swipeState.value.isDragging || isExpanded.value) return
  
  const touch = e.touches[0]
  const deltaY = swipeState.value.startY - touch.clientY
  const deltaX = Math.abs(touch.clientX - (e.target as HTMLElement).getBoundingClientRect().left)
  const deltaTime = Date.now() - swipeState.value.startTime
  
  // Если свайп вверх больше 40px за разумное время И не слишком горизонтальный
  if (deltaY > 40 && deltaTime < 500 && Math.abs(deltaX) < 50) {
    // Предотвращаем дальнейшую обработку
    e.preventDefault()
    swipeState.value.isDragging = false
    // Раскрываем плеер
    playerStore.toggleExpand()
  }
}

// Touch end handler
const handleTouchEnd = () => {
  swipeState.value.isDragging = false
}

// Touch cancel handler
const handleTouchCancel = () => {
  swipeState.value.isDragging = false
}

// Swipe down для закрытия полного плеера
const fullPlayerSwipeState = ref({
  startY: 0,
  startTime: 0,
  isDragging: false
})

const handleFullPlayerTouchStart = (e: TouchEvent) => {
  if (!isExpanded.value) return
  
  const touch = e.touches[0]
  fullPlayerSwipeState.value = {
    startY: touch.clientY,
    startTime: Date.now(),
    isDragging: true
  }
}

const handleFullPlayerTouchMove = (e: TouchEvent) => {
  if (!fullPlayerSwipeState.value.isDragging || !isExpanded.value) return
  
  const touch = e.touches[0]
  const deltaY = touch.clientY - fullPlayerSwipeState.value.startY
  const deltaTime = Date.now() - fullPlayerSwipeState.value.startTime
  
  // Если свайп вниз больше 80px за разумное время
  if (deltaY > 80 && deltaTime < 600) {
    e.preventDefault()
    fullPlayerSwipeState.value.isDragging = false
    playerStore.toggleExpand()
  }
}

const handleFullPlayerTouchEnd = () => {
  fullPlayerSwipeState.value.isDragging = false
}

// Добавляем обработчики событий только на мобильных
onMounted(() => {
  // Проверяем, что это мобильное устройство
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!isMobile) return
})

onUnmounted(() => {
  // Очистка если нужна
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-in-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

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
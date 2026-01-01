<template>
  <div 
    :class="[
      'relative flex items-center justify-center rounded-xl overflow-hidden',
      sizeClasses,
      className
    ]"
    :ref="lazyRef"
  >
    <!-- Loading State -->
    <div 
      v-if="isLoading && !showFallback" 
      class="absolute inset-0 bg-gray-200 animate-pulse"
    />
    
    <!-- Fallback/Error State -->
    <div 
      v-if="showFallback"
      :class="[
        'w-full h-full flex items-center justify-center text-white font-bold',
        gradientClass
      ]"
    >
      <div v-if="fallbackType === 'icon'" class="text-center">
        <Music :class="iconSizeClass" class="mx-auto mb-1 opacity-80" />
        <span :class="textSizeClass" class="block leading-none">
          {{ getTrackInitials() }}
        </span>
      </div>
      <span v-else :class="textSizeClass">
        {{ getTrackInitials() }}
      </span>
    </div>
    
    <!-- Actual Image -->
    <img
      v-if="shouldLoadImage && !showFallback"
      :src="coverUrl"
      :alt="`${track.title} обложка`"
      :class="[
        'w-full h-full object-cover transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100'
      ]"
      @load="handleImageLoad"
      @error="handleImageError"
      loading="lazy"
    />
    
    <!-- Play Overlay (опционально) -->
    <div 
      v-if="showPlayOverlay && !isLoading"
      class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
      @click.stop="$emit('play')"
    >
      <Play class="w-8 h-8 text-white" fill="currentColor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Music, Play } from 'lucide-vue-next'
import { tracksAPI } from '../api/client'
import { buildMediaUrl } from '../utils/media-urls'
import type { Track } from '../types'

interface Props {
  track: Track
  size?: 'small' | 'medium' | 'large' | 'hero'
  className?: string
  lazy?: boolean
  showPlayOverlay?: boolean
  fallbackType?: 'initials' | 'icon'
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  className: '',
  lazy: true,
  showPlayOverlay: false,
  fallbackType: 'icon',
  maxRetries: 2
})

const emit = defineEmits<{
  play: []
}>()

// Reactive state
const isLoading = ref(true)
const imageError = ref(false)
const retryCount = ref(0)
const isInView = ref(!props.lazy)
const lazyRef = ref<HTMLElement>()

// Computed properties
const hasTrackCover = computed(() => {
  // Проверяем сначала cover_url (новая архитектура), потом s3_image_key (старая)
  const hasCover = (props.track.cover_url && props.track.cover_url.trim() !== '') ||
                   (props.track.s3_image_key && props.track.s3_image_key.trim() !== '')
  
  console.log('TrackCover: hasTrackCover for track', props.track.title, {
    has_cover_url: !!(props.track.cover_url && props.track.cover_url.trim() !== ''),
    cover_url: props.track.cover_url,
    has_s3_key: !!(props.track.s3_image_key && props.track.s3_image_key.trim() !== ''),
    s3_image_key: props.track.s3_image_key,
    result: hasCover
  })
  
  return hasCover
})

const coverUrl = computed(() => {
  if (!hasTrackCover.value) return null
  
  // Если есть cover_url - используем его через buildMediaUrl
  if (props.track.cover_url && props.track.cover_url.trim() !== '') {
    const baseUrl = buildMediaUrl(props.track.cover_url)
    console.log('TrackCover: using cover_url', props.track.cover_url, '-> buildMediaUrl result:', baseUrl)
    if (!baseUrl) return null
    
    // Добавляем параметр для retry
    const timestamp = retryCount.value > 0 ? `?v=${Date.now()}` : ''
    return baseUrl + timestamp
  }
  
  // Fallback - используем старый способ через API
  const trackId = props.track.id
  if (!trackId || typeof trackId !== 'string') {
    console.error('TrackCover: Invalid track ID:', trackId, 'Track:', props.track)
    return null
  }
  
  // Добавляем параметр для retry
  const timestamp = retryCount.value > 0 ? `?v=${Date.now()}` : ''
  return tracksAPI.getCoverUrl(trackId) + timestamp
})

const showFallback = computed(() => {
  return !hasTrackCover.value || imageError.value
})

const shouldLoadImage = computed(() => {
  return hasTrackCover.value && isInView.value && !imageError.value
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-14 h-14'
    case 'medium':
      return 'w-20 h-20'
    case 'large':
      return 'w-32 h-32'
    case 'hero':
      return 'w-64 h-64'
    default:
      return 'w-20 h-20'
  }
})

const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-4 h-4'
    case 'medium':
      return 'w-6 h-6'
    case 'large':
      return 'w-8 h-8'
    case 'hero':
      return 'w-16 h-16'
    default:
      return 'w-6 h-6'
  }
})

const textSizeClass = computed(() => {
  switch (props.size) {
    case 'small':
      return 'text-xs'
    case 'medium':
      return 'text-sm'
    case 'large':
      return 'text-lg'
    case 'hero':
      return 'text-3xl'
    default:
      return 'text-sm'
  }
})

const gradientClass = computed(() => {
  const colors = [
    'bg-gradient-to-br from-purple-400 to-pink-400',
    'bg-gradient-to-br from-blue-400 to-purple-400', 
    'bg-gradient-to-br from-green-400 to-blue-400',
    'bg-gradient-to-br from-yellow-400 to-orange-400',
    'bg-gradient-to-br from-pink-400 to-red-400',
    'bg-gradient-to-br from-indigo-400 to-purple-400',
    'bg-gradient-to-br from-orange-400 to-red-400'
  ]
  
  const hash = props.track.title.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
})

// Helper functions
const getTrackInitials = () => {
  const artist = props.track.artist || 'Unknown'
  const title = props.track.title || 'Track'
  return `${artist[0]?.toUpperCase() || 'U'}${title[0]?.toUpperCase() || 'T'}`
}

const handleImageLoad = () => {
  isLoading.value = false
}

const handleImageError = () => {
  if (retryCount.value < props.maxRetries) {
    retryCount.value++
    console.log(`Retrying cover load for track ${props.track.id}, attempt ${retryCount.value}`)
  } else {
    imageError.value = true
    isLoading.value = false
    console.error('Failed to load cover for track:', {
      trackId: props.track.id,
      title: props.track.title,
      hasImageKey: !!props.track.s3_image_key,
      imageKey: props.track.s3_image_key
    })
  }
}

// Intersection Observer для lazy loading
onMounted(() => {
  if (props.lazy && lazyRef.value) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isInView.value = true
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    observer.observe(lazyRef.value)
    
    // Cleanup
    const cleanup = () => observer.disconnect()
    return cleanup
  }
})

// Watch for track changes
watch(() => props.track.id, () => {
  isLoading.value = true
  imageError.value = false
  retryCount.value = 0
})
</script>
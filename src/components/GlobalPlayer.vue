<template>
  <Teleport to="body">
    <div v-if="currentTrack" class="fixed inset-0 z-[60] flex flex-col pointer-events-none">
      <!-- Full Player Container -->
      <div
        class="absolute inset-0 bg-black z-20 pointer-events-auto flex flex-col will-change-transform"
        :class="{
          'transition-transform duration-300 ease-out': !isDragging,
          'translate-y-full': !isExpanded && !isDragging,
          'translate-y-0': isExpanded && !isDragging
        }"
        :style="dragStyle"
        @touchstart="onFullTouchStart"
        @touchmove="onFullTouchMove"
        @touchend="onFullTouchEnd"
      >
        <FullPlayer @show-toast="handleShowToast" />
      </div>

      <!-- Mini Player Container -->
      <div
        class="absolute bottom-0 left-0 right-0 z-10 pointer-events-auto"
        :class="{ 'opacity-0': isExpanded && !isDragging }"
        @click="onMiniClick"
        @touchstart="onMiniTouchStart"
        @touchmove="onMiniTouchMove"
        @touchend="onMiniTouchEnd"
      >
        <MiniPlayer />
      </div>
    </div>

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
        class="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[70] bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import FullPlayer from './player/FullPlayer.vue'
import MiniPlayer from './player/MiniPlayer.vue'

const playerStore = usePlayerStore()

const currentTrack = computed(() => playerStore.currentTrack)
const isExpanded = computed(() => playerStore.isExpanded)

// Toast notification state
const showToast = ref(false)
const toastMessage = ref('')

const handleShowToast = (message: string) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// --- Gesture Logic ---

const isDragging = ref(false)
const isTouchInteraction = ref(false)
const dragOffset = ref(0)
const startY = ref(0)
const windowHeight = ref(window.innerHeight)

// Updates style directly during drag for 1:1 movement
const dragStyle = computed(() => {
  if (!isDragging.value) return {}
  
  // If dragging UP from Mini (isExpanded=false), offset is negative.
  // We want to translate from 100% (windowHeight) upwards.
  // Transform = windowHeight + offset
  
  // If dragging DOWN from Full (isExpanded=true), offset is positive.
  // Transform = offset
  
  const base = isExpanded.value ? 0 : windowHeight.value
  const translateY = base + dragOffset.value
  
  // Clamp values
  // Can't go above 0 (top of screen)
  // Can't go below windowHeight (bottom of screen)
  const clampedY = Math.max(0, Math.min(windowHeight.value, translateY))
  
  return {
    transform: `translateY(${clampedY}px)`
  }
})

// --- Mini Player Interaction ---

const onMiniClick = () => {
  // If this click was preceded by a touchstart, it's a tap on mobile.
  // We want to ignore taps (clicks) on mobile for expanding, requiring a swipe instead.
  // Desktop clicks (where isTouchInteraction is false) will still work.
  if (isTouchInteraction.value) {
    isTouchInteraction.value = false
    return
  }
  playerStore.toggleExpand()
}

const onMiniTouchStart = (e: TouchEvent) => {
  // Only handle if not already expanded (safety check)
  if (isExpanded.value) return
  
  isTouchInteraction.value = true
  isDragging.value = true
  startY.value = e.touches[0].clientY
  dragOffset.value = 0 // Start at 0 delta
  windowHeight.value = window.innerHeight
}

const onMiniTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  
  const currentY = e.touches[0].clientY
  const delta = currentY - startY.value
  
  // Only allow dragging UP (negative delta)
  if (delta < 0) {
    dragOffset.value = delta
    e.preventDefault() // Prevent scrolling/pull-to-refresh
  }
}

const onMiniTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  
  // Threshold to snap open (e.g., 15% of screen height)
  const threshold = windowHeight.value * 0.15
  
  // If dragged up enough (negative offset), expand
  if (dragOffset.value < -threshold) {
    playerStore.isExpanded = true
  }
  // Otherwise snap back to mini (handled by :class binding when isDragging becomes false)
  
  dragOffset.value = 0
}

// --- Full Player Touch Handlers (Closing) ---

const onFullTouchStart = (e: TouchEvent) => {
  // Only handle if expanded
  if (!isExpanded.value) return
  
  // Check if we are interacting with a slider/volume control to avoid conflict?
  // Usually sliders stop propagation, but good to be aware.
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'range') {
    return
  }

  isDragging.value = true
  startY.value = e.touches[0].clientY
  dragOffset.value = 0
  windowHeight.value = window.innerHeight
}

const onFullTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  
  const currentY = e.touches[0].clientY
  const delta = currentY - startY.value
  
  // Only allow dragging DOWN (positive delta)
  if (delta > 0) {
    dragOffset.value = delta
    e.preventDefault()
  }
}

const onFullTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  
  // Threshold to snap close
  const threshold = windowHeight.value * 0.15
  
  // If dragged down enough (positive offset), collapse
  if (dragOffset.value > threshold) {
    playerStore.isExpanded = false
  }
  
  dragOffset.value = 0
}
</script>

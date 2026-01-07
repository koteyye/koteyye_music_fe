<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="currentTrack" class="fixed inset-0 z-50 flex flex-col" :class="{ 'pointer-events-none': !isExpanded }">
        <FullPlayer 
          v-if="isExpanded" 
          @show-toast="handleShowToast"
        />
        <MiniPlayer v-else />
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
import { computed, ref, onMounted } from 'vue'
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

// Добавляем обработчики событий только на мобильных
onMounted(() => {
  // Проверяем, что это мобильное устройство
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!isMobile) return
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
</style>

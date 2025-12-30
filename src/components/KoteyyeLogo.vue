<template>
  <img 
    :src="logoUrl"
    :alt="alt" 
    :class="containerClass"
    class="object-contain"
  />
</template>

<script setup lang="ts">
import logoUrl from '../assets/icons/koteyye_music.svg?url'

interface Props {
  alt?: string
  containerClass?: string
}

withDefaults(defineProps<Props>(), {
  alt: 'Koteyye Music Logo',
  containerClass: 'w-12 h-12'
})
</script>

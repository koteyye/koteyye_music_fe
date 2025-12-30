<template>
  <div class="flex gap-3">
    <button
      @click="$emit('update:activeTab', 'tracks')"
      :class="{
        'bg-kot-orange text-white shadow-md': activeTab === 'tracks',
        'bg-white text-gray-700 border border-gray-200 hover:border-gray-300': activeTab !== 'tracks'
      }"
      class="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
    >
      Треки
    </button>
    <button
      @click="$emit('update:activeTab', 'albums')"
      :class="{
        'bg-kot-orange text-white shadow-md': activeTab === 'albums',
        'bg-white text-gray-700 border border-gray-200 hover:border-gray-300': activeTab !== 'albums'
      }"
      class="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
    >
      Альбомы
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  activeTab: 'tracks' | 'albums'
}

defineProps<Props>()

defineEmits<{
  'update:activeTab': [value: 'tracks' | 'albums']
}>()
</script>
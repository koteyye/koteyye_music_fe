<template>
  <div class="flex gap-3">
    <button
      @click="$emit('update:activeTab', 'tracks')"
      :class="{
        'bg-kot-orange text-white shadow-md': activeTab === 'tracks',
        'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600': activeTab !== 'tracks'
      }"
      class="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
    >
      Треки
    </button>
    <button
      @click="$emit('update:activeTab', 'albums')"
      :class="{
        'bg-kot-orange text-white shadow-md': activeTab === 'albums',
        'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600': activeTab !== 'albums'
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
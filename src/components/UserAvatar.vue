<template>
  <div 
    :class="[
      'flex flex-col items-center gap-1',
      { 'cursor-pointer': clickable }
    ]"
    @click="handleClick"
  >
    <!-- Avatar Circle -->
    <div
      :class="[
        'rounded-full flex items-center justify-center text-white font-bold overflow-hidden',
        sizeClasses
      ]"
      :style="{ backgroundColor: avatarUrl ? 'transparent' : '#f97316' }"
    >
      <img 
        v-if="avatarUrl" 
        :src="avatarUrl" 
        :alt="name || email || 'User'"
        class="w-full h-full object-cover"
      />
      <span v-else :class="textSizeClasses">
        {{ getInitials(name || email || 'U') }}
      </span>
    </div>
    
    <!-- Name Label -->
    <span 
      v-if="showName && (name || email)" 
      :class="[
        'text-center font-medium truncate max-w-20',
        nameSizeClasses
      ]"
    >
      {{ name || (email ? email.split('@')[0] : 'Пользователь') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  avatarUrl?: string | null
  name?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  clickable?: boolean
  showName?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  clickable: false,
  showName: false
})

const emit = defineEmits<{
  click: []
}>()

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-8 h-8'
    case 'md':
      return 'w-12 h-12'
    case 'lg':
      return 'w-16 h-16'
    case 'xl':
      return 'w-24 h-24'
    default:
      return 'w-12 h-12'
  }
})

const textSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'md':
      return 'text-sm'
    case 'lg':
      return 'text-lg'
    case 'xl':
      return 'text-2xl'
    default:
      return 'text-sm'
  }
})

const nameSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs text-gray-600 dark:text-gray-400'
    case 'md':
      return 'text-xs text-gray-700 dark:text-gray-300'
    case 'lg':
      return 'text-sm text-gray-700 dark:text-gray-300'
    case 'xl':
      return 'text-base text-gray-800 dark:text-gray-200'
    default:
      return 'text-xs text-gray-700 dark:text-gray-300'
  }
})

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>
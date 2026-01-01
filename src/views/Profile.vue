<template>
  <ProtectedRoute>
    <div class="min-h-screen bg-gradient-to-br from-kot-dark to-slate-900">
    <div class="container mx-auto px-4 py-8">
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-kot-orange"></div>
      </div>
      
      <div v-else-if="profile" class="max-w-2xl mx-auto">
        <!-- Back Button -->
        <button
          @click="router.push('/')"
          class="mb-6 flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-2xl transition-all backdrop-blur-sm"
        >
          <ArrowLeft class="w-5 h-5" />
          На главную
        </button>

        <!-- Profile Header -->
        <div class="bg-white rounded-3xl p-6 mb-6 shadow-2xl">
          <div class="flex items-center space-x-6">
            <div class="relative">
              <div
                class="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                :style="{ backgroundColor: profile.avatar_url ? 'transparent' : '#f97316' }"
              >
                <img
                  v-if="profile.avatar_url"
                  :src="profile.avatar_url"
                  :alt="profile.name || profile.email"
                  class="w-24 h-24 rounded-full object-cover"
                />
                <span v-else>
                  {{ getInitials(profile.name || profile.email || 'U') }}
                </span>
              </div>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-kot-dark">
                {{ profile.name || 'Пользователь' }}
              </h1>
              <p class="text-gray-600">{{ profile.email }}</p>
              <p class="text-sm text-gray-500">
                Провайдер: {{ getProviderName(profile.provider) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Avatar Management -->
        <div class="bg-white rounded-3xl p-6 mb-6 shadow-2xl">
          <h2 class="text-xl font-bold text-kot-dark mb-4">Управление аватаром</h2>
          
          <div class="space-y-4">
            <!-- Current Avatar -->
            <div class="flex items-center space-x-4">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold"
                :style="{ backgroundColor: profile.avatar_url ? 'transparent' : '#f97316' }"
              >
                <img
                  v-if="profile.avatar_url"
                  :src="profile.avatar_url"
                  :alt="profile.name || profile.email"
                  class="w-16 h-16 rounded-full object-cover"
                />
                <span v-else>
                  {{ getInitials(profile.name || profile.email || 'U') }}
                </span>
              </div>
              <div>
                <p class="font-medium text-kot-dark">Текущий аватар</p>
                <p v-if="!profile.avatar_url" class="text-sm text-gray-500">
                  Аватар не установлен
                </p>
              </div>
            </div>

            <!-- Upload Section -->
            <div class="space-y-4">
              <div
                @drop="handleDrop"
                @dragover.prevent
                @dragenter.prevent
                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-kot-orange transition-colors cursor-pointer"
                :class="{ 'border-kot-orange': isDragging }"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  @change="handleFileSelect"
                  class="hidden"
                />
                <div class="space-y-2">
                  <Upload class="mx-auto h-8 w-8 text-gray-400" />
                  <p class="text-gray-600">
                    Перетащите изображение или нажмите для выбора
                  </p>
                  <p class="text-sm text-gray-500">
                    JPG, PNG или GIF (макс. 2МБ)
                  </p>
                </div>
              </div>

              <!-- Preview -->
              <div v-if="previewImage" class="space-y-4">
                <div class="flex items-center space-x-4">
                  <img
                    :src="previewImage"
                    alt="Превью"
                    class="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p class="font-medium text-kot-dark">Превью нового аватара</p>
                    <div class="flex space-x-2 mt-2">
                      <button
                        @click="uploadNewAvatar"
                        :disabled="isUploading"
                        class="px-4 py-2 bg-kot-orange text-white rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        <span v-if="isUploading">Загрузка...</span>
                        <span v-else>Сохранить</span>
                      </button>
                      <button
                        @click="cancelPreview"
                        :disabled="isUploading"
                        class="px-4 py-2 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Remove Avatar -->
              <div v-if="profile.avatar_url && !previewImage" class="pt-4 border-t">
                <button
                  @click="removeAvatar"
                  :disabled="isUploading"
                  class="px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Удалить аватар
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Form -->
        <div class="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 class="text-xl font-bold text-kot-dark mb-4">Редактировать профиль</h2>
          
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Отображаемое имя
              </label>
              <input
                v-model="editForm.name"
                type="text"
                :disabled="isUpdating"
                class="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-kot-orange focus:border-transparent transition-colors disabled:opacity-50"
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                :value="profile.email"
                type="email"
                disabled
                class="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-gray-50 text-gray-500"
              />
              <p class="text-sm text-gray-500 mt-1">
                Email нельзя изменить для {{ getProviderName(profile.provider) }} аккаунта
              </p>
            </div>

            <div class="pt-4">
              <button
                type="submit"
                :disabled="isUpdating || !hasChanges"
                class="w-full px-6 py-3 bg-kot-orange text-white rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <span v-if="isUpdating">Сохранение...</span>
                <span v-else>Сохранить изменения</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-else class="text-center text-white">
        <p>Ошибка загрузки профиля</p>
        <button
          @click="loadProfile"
          class="mt-4 px-6 py-3 bg-kot-orange text-white rounded-2xl hover:bg-orange-600 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
    </div>
  </ProtectedRoute>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, ArrowLeft } from 'lucide-vue-next'
import { userAPI, uploadAvatar } from '../api/client'
import type { UserProfile } from '../types'
import ProtectedRoute from '../components/ProtectedRoute.vue'

const router = useRouter()
const profile = ref<UserProfile | null>(null)
const loading = ref(true)
const isUploading = ref(false)
const isUpdating = ref(false)
const isDragging = ref(false)
const previewImage = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

const editForm = ref({
  name: ''
})

const hasChanges = computed(() => {
  return editForm.value.name !== (profile.value?.name || '')
})

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getProviderName = (provider?: string): string => {
  switch (provider) {
    case 'google':
      return 'Google'
    case 'yandex':
      return 'Yandex'
    case 'local':
      return 'Локальный'
    default:
      return 'Неизвестный'
  }
}

const loadProfile = async () => {
  try {
    loading.value = true
    profile.value = await userAPI.getProfile()
    editForm.value.name = profile.value.name || ''
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
  } finally {
    loading.value = false
  }
}

const validateFile = (file: File): string | null => {
  if (file.size > 2 * 1024 * 1024) {
    return 'Размер файла не должен превышать 2МБ'
  }
  
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    return 'Поддерживаются только файлы JPG, PNG и GIF'
  }
  
  return null
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  const error = validateFile(file)
  if (error) {
    alert(error)
    return
  }
  
  selectedFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const uploadNewAvatar = async () => {
  if (!selectedFile.value) return
  
  try {
    isUploading.value = true
    const avatarUrl = await uploadAvatar(selectedFile.value)
    
    const updatedProfile = await userAPI.updateProfile({
      avatar_key: avatarUrl
    })
    
    profile.value = updatedProfile
    cancelPreview()
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error)
    alert('Не удалось загрузить аватар')
  } finally {
    isUploading.value = false
  }
}

const cancelPreview = () => {
  previewImage.value = null
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removeAvatar = async () => {
  if (!confirm('Вы уверены, что хотите удалить аватар?')) {
    return
  }
  
  try {
    isUploading.value = true
    const updatedProfile = await userAPI.removeAvatar()
    
    profile.value = updatedProfile
  } catch (error) {
    console.error('Ошибка удаления аватара:', error)
    alert('Не удалось удалить аватар')
  } finally {
    isUploading.value = false
  }
}

const updateProfile = async () => {
  try {
    isUpdating.value = true
    const updatedProfile = await userAPI.updateProfile({
      name: editForm.value.name || null
    })
    
    profile.value = updatedProfile
  } catch (error) {
    console.error('Ошибка обновления профиля:', error)
    alert('Не удалось обновить профиль')
  } finally {
    isUpdating.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>
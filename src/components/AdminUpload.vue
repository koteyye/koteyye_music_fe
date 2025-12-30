<script setup lang="ts">
import { ref } from 'vue';
import { adminAPI } from '../api/client';
import { Upload, X, Music, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-vue-next';

const emit = defineEmits<{
  uploadSuccess: [track: any];
}>();

// Form state
const title = ref('');
const artist = ref('');
const album = ref('');
const coverFile = ref<File | null>(null);
const audioFile = ref<File | null>(null);

// UI state
const isUploading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const coverPreview = ref<string | null>(null);

// File input handlers
const handleCoverChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      error.value = 'Пожалуйста, выберите изображение';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'Размер изображения не должен превышать 5MB';
      return;
    }

    coverFile.value = file;
    error.value = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      coverPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleAudioChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'];
    if (!validTypes.includes(file.type)) {
      error.value = 'Пожалуйста, выберите аудиофайл (MP3, WAV, OGG, FLAC)';
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      error.value = 'Размер аудиофайла не должен превышать 50MB';
      return;
    }

    audioFile.value = file;
    error.value = null;
  }
};

// Clear file selections
const clearCover = () => {
  coverFile.value = null;
  coverPreview.value = null;
  error.value = null;
};

const clearAudio = () => {
  audioFile.value = null;
  error.value = null;
};

// Form validation
const validateForm = (): boolean => {
  if (!title.value.trim()) {
    error.value = 'Введите название трека';
    return false;
  }
  if (!artist.value.trim()) {
    error.value = 'Введите исполнителя';
    return false;
  }
  if (!coverFile.value) {
    error.value = 'Выберите обложку';
    return false;
  }
  if (!audioFile.value) {
    error.value = 'Выберите аудиофайл';
    return false;
  }
  return true;
};

// Submit form
const handleSubmit = async () => {
  if (!validateForm()) return;

  isUploading.value = true;
  error.value = null;
  success.value = false;

  try {
    const formData = new FormData();
    formData.append('title', title.value);
    formData.append('artist', artist.value);
    if (album.value) {
      formData.append('album', album.value);
    }
    if (coverFile.value) {
      formData.append('cover', coverFile.value);
    }
    if (audioFile.value) {
      formData.append('audio', audioFile.value);
    }

    const uploadedTrack = await adminAPI.uploadTrack(formData);

    success.value = true;
    emit('uploadSuccess', uploadedTrack);

    // Reset form after successful upload
    setTimeout(() => {
      resetForm();
    }, 2000);

  } catch (err: any) {
    console.error('Upload failed:', err);
    error.value = err.response?.data?.error || 'Не удалось загрузить трек. Попробуйте снова.';
  } finally {
    isUploading.value = false;
  }
};

// Reset form
const resetForm = () => {
  title.value = '';
  artist.value = '';
  album.value = '';
  coverFile.value = null;
  audioFile.value = null;
  coverPreview.value = null;
  error.value = null;
  success.value = false;
};
</script>

<template>
  <div class="bg-white rounded-3xl shadow-xl p-6">
    <h2 class="text-2xl font-bold text-kot-dark mb-6 flex items-center gap-2">
      <Upload class="w-6 h-6 text-kot-orange" />
      Загрузка трека
    </h2>

    <!-- Success Message -->
    <div
      v-if="success"
      class="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700"
    >
      <CheckCircle class="w-5 h-5 flex-shrink-0" />
      <span class="font-medium">Трек успешно загружен!</span>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700"
    >
      <AlertCircle class="w-5 h-5 flex-shrink-0" />
      <span class="font-medium">{{ error }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Title Input -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Название *</label>
        <input
          v-model="title"
          type="text"
          placeholder="Введите название трека"
          :disabled="isUploading"
          class="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Artist Input -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Исполнитель *</label>
        <input
          v-model="artist"
          type="text"
          placeholder="Введите имя исполнителя"
          :disabled="isUploading"
          class="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Album Input (Optional) -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Альбом</label>
        <input
          v-model="album"
          type="text"
          placeholder="Введите название альбома (необязательно)"
          :disabled="isUploading"
          class="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-kot-orange focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Cover Upload -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Обложка *</label>
        <div
          v-if="!coverPreview"
          class="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-kot-orange transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept="image/*"
            @change="handleCoverChange"
            :disabled="isUploading"
            class="hidden"
            id="cover-upload"
          />
          <label
            for="cover-upload"
            class="cursor-pointer"
          >
            <ImageIcon class="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p class="text-gray-600 font-medium">Нажмите для выбора обложки</p>
            <p class="text-sm text-gray-400 mt-1">PNG, JPG до 5MB</p>
          </label>
        </div>

        <!-- Cover Preview -->
        <div v-else class="relative">
          <img
            :src="coverPreview"
            alt="Preview"
            class="w-full h-48 object-cover rounded-2xl"
          />
          <button
            type="button"
            @click="clearCover"
            :disabled="isUploading"
            class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X class="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <!-- Audio Upload -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Аудиофайл *</label>
        <div
          v-if="!audioFile"
          class="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-kot-orange transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept="audio/*"
            @change="handleAudioChange"
            :disabled="isUploading"
            class="hidden"
            id="audio-upload"
          />
          <label
            for="audio-upload"
            class="cursor-pointer"
          >
            <Music class="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p class="text-gray-600 font-medium">Нажмите для выбора аудиофайла</p>
            <p class="text-sm text-gray-400 mt-1">MP3, WAV, OGG, FLAC до 50MB</p>
          </label>
        </div>

        <!-- Audio File Selected -->
        <div v-else class="relative p-4 bg-orange-50 rounded-2xl flex items-center gap-3">
          <Music class="w-10 h-10 text-kot-orange flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-kot-dark truncate">{{ audioFile.name }}</p>
            <p class="text-sm text-gray-500">{{ (audioFile.size / (1024 * 1024)).toFixed(2) }} MB</p>
          </div>
          <button
            type="button"
            @click="clearAudio"
            :disabled="isUploading"
            class="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X class="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isUploading"
        class="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
      >
        <Upload v-if="!isUploading" class="w-5 h-5" />
        <div v-else class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        {{ isUploading ? 'Загрузка...' : 'Загрузить трек' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { adminAPI } from "../api/client";
import { GENRE_OPTIONS } from "../constants/genres";
import { buildMediaUrl } from "../utils/media-urls";
import FormSelect from "../components/FormSelect.vue";
import TrackCover from "../components/TrackCover.vue";
import {
    Upload,
    Trash2,
    Music,
    AlertCircle,
    CheckCircle,
    Loader2,
    Shield,
    ArrowLeft,
    Plus,
    Paperclip,
    ChevronDown,
    ChevronRight,
    Calendar,
    Disc3,
} from "lucide-vue-next";
import type { Album, Track } from "../types";

// State
const albums = ref<Album[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadSuccess = ref(false);
const expandedAlbums = ref<Set<string>>(new Set());

// Refs for file inputs
const coverInputRef = ref<HTMLInputElement>();
const trackFileRefs = ref<{ [key: string]: HTMLInputElement }>({});

// Form state
const releaseForm = ref({
    title: '',
    artist: '',
    genre: 'pop',
    releaseDate: new Date().toISOString().split('T')[0],
    coverFile: null as File | null,
    coverPreview: null as string | null,
});

const tracks = ref<Array<{
    id: string;
    title: string;
    audioFile: File | null;
    fileName: string;
}>>([
    { id: crypto.randomUUID(), title: '', audioFile: null, fileName: '' }
]);

// Auth check
const authStore = useAuthStore();
const router = useRouter();



// Validation functions
const validateAlbumData = () => {
    const errors = [];
    
    if (!releaseForm.value.title || releaseForm.value.title.trim().length === 0) {
        errors.push('Название альбома обязательно');
    }
    
    if (!releaseForm.value.artist || releaseForm.value.artist.trim().length === 0) {
        errors.push('Исполнитель обязателен');
    }
    
    const validGenres = GENRE_OPTIONS.map(option => option.value);
    if (!validGenres.includes(releaseForm.value.genre)) {
        errors.push('Неверный жанр');
    }
    
    if (!releaseForm.value.releaseDate) {
        errors.push('Дата выпуска обязательна');
    }
    
    if (!releaseForm.value.coverFile) {
        errors.push('Обложка обязательна');
    } else {
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validImageTypes.includes(releaseForm.value.coverFile.type)) {
            errors.push('Обложка должна быть в формате JPG или PNG');
        }
        
        // Check file size (max 10MB as mentioned in UI)
        if (releaseForm.value.coverFile.size > 10 * 1024 * 1024) {
            errors.push('Размер обложки не должен превышать 10MB');
        }
    }
    
    return errors;
};

const validateTracksData = () => {
    const errors = [];
    
    if (tracks.value.length === 0) {
        errors.push('Добавьте хотя бы один трек');
    }
    
    tracks.value.forEach((track, index) => {
        if (!track.title || track.title.trim().length === 0) {
            errors.push(`Название трека ${index + 1} обязательно`);
        }
        
        if (!track.audioFile) {
            errors.push(`Аудио файл для трека ${index + 1} обязателен`);
        } else {
            const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac'];
            if (!validAudioTypes.includes(track.audioFile.type)) {
                errors.push(`Трек ${index + 1}: аудио должно быть в формате MP3, WAV, M4A или FLAC`);
            }
            
            // Check file size (max 50MB for audio)
            if (track.audioFile.size > 50 * 1024 * 1024) {
                errors.push(`Трек ${index + 1}: размер аудио файла не должен превышать 50MB`);
            }
        }
    });
    
    return errors;
};

// Computed
const isFormValid = computed(() => {
    const albumErrors = validateAlbumData();
    const tracksErrors = validateTracksData();
    return albumErrors.length === 0 && tracksErrors.length === 0;
});

const albumsCount = computed(() => albums.value?.length || 0);

onMounted(() => {
    fetchMyAlbums();
});

// Fetch albums uploaded by current user
const fetchMyAlbums = async () => {
    try {
        loading.value = true;
        error.value = null;
        albums.value = await adminAPI.getAdminAlbums();
    } catch (err: any) {
        console.error("Failed to fetch albums:", err);
        error.value = "Не удалось загрузить релизы";
    } finally {
        loading.value = false;
    }
};

// Handle cover file selection
const handleCoverSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
        releaseForm.value.coverFile = file;
        releaseForm.value.coverPreview = URL.createObjectURL(file);
    }
};

// Handle track file selection
const handleTrackFileSelect = (trackId: string, event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.audioFile = file;
            track.fileName = file.name;
        }
    }
};

// Add new track
const addTrack = () => {
    tracks.value.push({
        id: crypto.randomUUID(),
        title: '',
        audioFile: null,
        fileName: ''
    });
};

// Remove track
const removeTrack = (trackId: string) => {
    if (tracks.value.length > 1) {
        tracks.value = tracks.value.filter(t => t.id !== trackId);
    }
};

// Submit release
const submitRelease = async () => {
    // Validate form before submitting
    const albumErrors = validateAlbumData();
    const tracksErrors = validateTracksData();
    const allErrors = [...albumErrors, ...tracksErrors];
    
    if (allErrors.length > 0) {
        error.value = allErrors.join('; ');
        return;
    }
    
    isUploading.value = true;
    uploadProgress.value = 0;
    error.value = null;
    
    let album: Album | null = null;
    
    try {
        // 1. Create album
        console.log('Creating album...');
        const albumFormData = new FormData();
        albumFormData.append('title', releaseForm.value.title.trim());
        albumFormData.append('artist', releaseForm.value.artist.trim());
        albumFormData.append('genre', releaseForm.value.genre);
        albumFormData.append('release_date', releaseForm.value.releaseDate);
        albumFormData.append('cover', releaseForm.value.coverFile!);
        
        // Check token before starting
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
        console.log('Token available:', !!token);
        console.log('Auth store state:', {
            isAuthenticated: authStore.isAuthenticated,
            isAdmin: authStore.isAdmin,
            user: authStore.user
        });
        
        if (!token) {
            error.value = "Токен авторизации отсутствует. Попробуйте перезайти.";
            return;
        }
        
        // Try to refresh user data before proceeding
        try {
            await authStore.fetchUser();
        } catch (authError) {
            console.warn('Failed to refresh user data:', authError);
        }
        
        console.log('Album data:', {
            title: releaseForm.value.title.trim(),
            artist: releaseForm.value.artist.trim(),
            genre: releaseForm.value.genre,
            release_date: releaseForm.value.releaseDate,
            cover_name: releaseForm.value.coverFile?.name,
            cover_size: releaseForm.value.coverFile?.size,
            cover_type: releaseForm.value.coverFile?.type
        });
        
        album = await adminAPI.createAlbum(albumFormData);
        console.log('Album created:', album);
        
        // 2. Upload tracks sequentially
        const totalTracks = tracks.value.length;
        let uploadedCount = 0;
        const uploadedTracks = [];
        
        for (const track of tracks.value) {
            console.log(`Uploading track ${uploadedCount + 1}/${totalTracks}: ${track.title}`);
            
            // Check token is still available before each track upload
            const currentToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
            if (!currentToken) {
                throw new Error("Токен авторизации потерян во время загрузки");
            }
            
            const trackFormData = new FormData();
            trackFormData.append('title', track.title.trim());
            trackFormData.append('audio', track.audioFile!);
            
            console.log('Track data:', {
                title: track.title.trim(),
                audio_name: track.audioFile?.name,
                audio_size: track.audioFile?.size,
                audio_type: track.audioFile?.type
            });
            
            // Try upload with retry on 401
            let uploadedTrack;
            try {
                uploadedTrack = await adminAPI.uploadTrackToAlbum(album!.id, trackFormData);
            } catch (trackError: any) {
                if (trackError.response?.status === 401) {
                    console.log('Got 401 for track upload, trying to refresh auth and retry...');
                    
                    // Try to refresh user data
                    try {
                        await authStore.fetchUser();
                        console.log('Auth refreshed, retrying track upload...');
                        uploadedTrack = await adminAPI.uploadTrackToAlbum(album!.id, trackFormData);
                    } catch (retryError) {
                        console.error('Retry failed:', retryError);
                        throw trackError; // Throw original error
                    }
                } else {
                    throw trackError;
                }
            }
            
            uploadedTracks.push(uploadedTrack);
            uploadedCount++;
            uploadProgress.value = Math.round((uploadedCount / totalTracks) * 100);
            
            console.log(`Track uploaded: ${uploadedTrack.title}`);
        }
        
        // 3. Success
        console.log('Release created successfully!', { album, tracks: uploadedTracks });
        uploadSuccess.value = true;
        resetForm();
        await fetchMyAlbums();
        
        setTimeout(() => {
            uploadSuccess.value = false;
        }, 3000);
        
    } catch (err: any) {
        console.error("Failed to create release:", err);
        
        // Check if album was created successfully before the error
        if (album && album.id) {
            console.log("Album was created successfully, error occurred during track upload");
            
            // Check if error is 401 - might be temporary auth issue
            if (err.response?.status === 401) {
                error.value = "Альбом создан, но возникла проблема с авторизацией при загрузке треков. Попробуйте обновить страницу.";
                
                // Try to refresh the albums list to show the created album
                setTimeout(async () => {
                    try {
                        await fetchMyAlbums();
                        if (uploadedTracks.length > 0) {
                            uploadSuccess.value = true;
                            resetForm();
                            setTimeout(() => {
                                uploadSuccess.value = false;
                            }, 3000);
                        }
                    } catch (refreshError) {
                        console.error("Failed to refresh albums list:", refreshError);
                    }
                }, 1000);
                
                return; // Don't proceed with normal error handling
            }
        }
        
        // Handle different error types
        if (err.response?.data?.error) {
            error.value = err.response.data.error;
        } else {
            switch (err.response?.status) {
                case 400:
                    error.value = "Некорректные данные. Проверьте все поля и форматы файлов.";
                    break;
                case 401:
                    error.value = "Ошибка авторизации. Попробуйте перезайти в аккаунт.";
                    break;
                case 403:
                    error.value = "Недостаточно прав доступа.";
                    break;
                case 413:
                    error.value = "Размер файлов слишком большой.";
                    break;
                case 422:
                    error.value = "Неподдерживаемый формат файлов.";
                    break;
                case 500:
                    error.value = "Ошибка сервера. Попробуйте позже.";
                    break;
                default:
                    error.value = err.message || "Ошибка при загрузке релиза";
            }
        }
        
        console.error("Detailed error:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
        });
    } finally {
        isUploading.value = false;
        uploadProgress.value = 0;
    }
};

// Reset form
const resetForm = () => {
    releaseForm.value = {
        title: '',
        artist: '',
        genre: 'pop',
        releaseDate: new Date().toISOString().split('T')[0],
        coverFile: null,
        coverPreview: null,
    };
    
    tracks.value = [
        { id: crypto.randomUUID(), title: '', audioFile: null, fileName: '' }
    ];
};

// Delete album
const deleteAlbum = async (album: Album) => {
    if (!confirm(`Вы уверены, что хотите удалить релиз "${album.title}"?`)) {
        return;
    }
    
    try {
        await adminAPI.deleteAlbum(album.id);
        albums.value = albums.value.filter(a => a.id !== album.id);
    } catch (err: any) {
        console.error("Failed to delete album:", err);
        error.value = err.response?.data?.error || "Не удалось удалить релиз";
    }
};

// Toggle album expansion
const toggleAlbum = (albumId: string) => {
    if (expandedAlbums.value.has(albumId)) {
        expandedAlbums.value.delete(albumId);
    } else {
        expandedAlbums.value.add(albumId);
    }
};

// Format date
const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
        return dateString;
    }
};

// Test admin function
const makeAdmin = () => {
    if (authStore.user) {
        authStore.user.role = 'admin';
        localStorage.setItem('user', JSON.stringify(authStore.user));
        console.log('Пользователь стал админом!');
    }
};
</script>

<template>
    <!-- Not authenticated -->
    <div v-if="!authStore.isAuthenticated || authStore.isGuest" class="min-h-screen bg-gradient-to-br from-kot-dark to-slate-900 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-8 text-center max-w-md w-full">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield class="w-8 h-8 text-red-600" />
            </div>
            <h2 class="text-2xl font-bold text-kot-dark mb-2">Требуется авторизация</h2>
            <p class="text-gray-600 mb-6">Для доступа к админ панели необходимо войти в аккаунт</p>
            <div class="space-y-3">
                <router-link to="/login" class="block w-full py-3 bg-kot-orange text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors">
                    Войти в аккаунт
                </router-link>
                <router-link to="/" class="block w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors">
                    На главную
                </router-link>
            </div>
        </div>
    </div>

    <!-- Not admin -->
    <div v-else-if="!authStore.isAdmin" class="min-h-screen bg-gradient-to-br from-kot-dark to-slate-900 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-8 text-center max-w-md w-full">
            <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield class="w-8 h-8 text-yellow-600" />
            </div>
            <h2 class="text-2xl font-bold text-kot-dark mb-2">Недостаточно прав</h2>
            <p class="text-gray-600 mb-6">У вас нет прав для доступа к админ панели</p>
            <p class="text-sm text-gray-500 mb-6">Текущая роль: {{ authStore.user?.role || 'неизвестно' }}</p>
            <div class="space-y-3">
                <button 
                    @click="makeAdmin" 
                    class="w-full py-3 bg-kot-orange text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors"
                >
                    Получить админ права (тест)
                </button>
                <router-link to="/" class="block w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors">
                    На главную
                </router-link>
            </div>
        </div>
    </div>

    <!-- Admin panel -->
    <div v-else class="min-h-screen bg-cream p-4 md:p-8">
        <div class="max-w-6xl mx-auto">
            <!-- Back Button -->
            <button
                @click="router.push('/')"
                class="mb-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl transition-all shadow-sm hover:shadow-md"
            >
                <ArrowLeft class="w-5 h-5" />
                На главную
            </button>

            <!-- Header -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Disc3 class="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 class="text-3xl md:text-4xl font-bold text-kot-dark">
                            Панель администратора
                        </h1>
                        <p class="text-gray-500 text-sm">Управление релизами</p>
                    </div>
                </div>

                <!-- Admin Badge -->
                <div class="flex items-center gap-2 bg-orange-100 text-kot-orange px-4 py-2 rounded-full">
                    <Shield class="w-5 h-5" />
                    <span class="font-semibold">Admin</span>
                </div>
            </div>

            <!-- Success Message -->
            <div
                v-if="uploadSuccess"
                class="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700"
            >
                <CheckCircle class="w-5 h-5 flex-shrink-0" />
                <span class="font-medium">Релиз успешно опубликован!</span>
            </div>

            <!-- Error Message -->
            <div
                v-if="error"
                class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700"
            >
                <AlertCircle class="w-5 h-5 flex-shrink-0" />
                <span class="font-medium">{{ error }}</span>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Upload Section -->
                <div class="order-2 lg:order-1">
                    <div class="bg-white rounded-3xl shadow-xl p-6">
                        <h2 class="text-2xl font-bold text-kot-dark mb-6 flex items-center gap-2">
                            <Upload class="w-6 h-6 text-kot-orange" />
                            Создание релиза
                        </h2>

                        <form @submit.prevent="submitRelease" class="space-y-6">
                            <!-- Release Data Section -->
                            <div class="space-y-4">
                                <h3 class="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                                    Данные релиза
                                </h3>

                                <!-- Title -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Название
                                    </label>
                                    <input
                                        v-model="releaseForm.title"
                                        type="text"
                                        required
                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kot-orange focus:ring-2 focus:ring-orange-100 transition-all"
                                        placeholder="Название альбома или сингла"
                                    />
                                </div>

                                <!-- Artist -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Исполнитель
                                    </label>
                                    <input
                                        v-model="releaseForm.artist"
                                        type="text"
                                        required
                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kot-orange focus:ring-2 focus:ring-orange-100 transition-all"
                                        placeholder="Имя исполнителя"
                                    />
                                </div>

                                <!-- Genre -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Жанр
                                    </label>
                                    <FormSelect
                                        v-model="releaseForm.genre"
                                        :options="GENRE_OPTIONS"
                                        placeholder="Выберите жанр"
                                        required
                                    />
                                </div>

                                <!-- Release Date -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Дата релиза
                                    </label>
                                    <input
                                        v-model="releaseForm.releaseDate"
                                        type="date"
                                        required
                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-kot-orange focus:ring-2 focus:ring-orange-100 transition-all"
                                    />
                                </div>

                                <!-- Cover Upload -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Обложка
                                    </label>
                                    <div class="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            @change="handleCoverSelect"
                                            class="hidden"
                                            ref="coverInputRef"
                                        />
                                        <div
                                            @click="coverInputRef?.click()"
                                            class="w-full aspect-square max-w-xs mx-auto border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-kot-orange transition-colors"
                                            :class="{ 'border-kot-orange bg-orange-50': releaseForm.coverPreview }"
                                        >
                                            <img
                                                v-if="releaseForm.coverPreview"
                                                :src="releaseForm.coverPreview"
                                                alt="Cover preview"
                                                class="w-full h-full object-cover rounded-xl"
                                            />
                                            <div v-else class="text-center text-gray-400">
                                                <Upload class="w-12 h-12 mx-auto mb-2" />
                                                <p class="font-medium">Выберите обложку</p>
                                                <p class="text-sm">JPG, PNG до 10MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tracklist Section -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                                    <h3 class="text-lg font-semibold text-gray-700">
                                        Список треков
                                    </h3>
                                    <button
                                        type="button"
                                        @click="addTrack"
                                        class="flex items-center gap-2 text-kot-orange hover:text-orange-600 transition-colors"
                                    >
                                        <Plus class="w-4 h-4" />
                                        Добавить трек
                                    </button>
                                </div>

                                <!-- Track List -->
                                <div class="space-y-3">
                                    <div
                                        v-for="(track, index) in tracks"
                                        :key="track.id"
                                        class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                                    >
                                        <!-- Track Number -->
                                        <div class="w-8 h-8 bg-kot-orange text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {{ index + 1 }}
                                        </div>

                                        <!-- Track Title -->
                                        <input
                                            v-model="track.title"
                                            type="text"
                                            required
                                            class="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-kot-orange focus:ring-1 focus:ring-orange-100"
                                            placeholder="Название трека"
                                        />

                                        <!-- File Upload -->
                                        <div class="flex-shrink-0">
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                @change="handleTrackFileSelect(track.id, $event)"
                                                class="hidden"
                                                :ref="(el) => { if (el) trackFileRefs[track.id] = el as HTMLInputElement }"
                                            />
                                            <button
                                                type="button"
                                                @click="trackFileRefs[track.id]?.click()"
                                                class="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-kot-orange hover:bg-orange-50 transition-all"
                                                :class="{ 'border-kot-orange bg-orange-50 text-kot-orange': track.fileName }"
                                            >
                                                <Paperclip class="w-4 h-4" />
                                                <span class="hidden sm:inline">
                                                    {{ track.fileName || 'Выбрать файл' }}
                                                </span>
                                            </button>
                                        </div>

                                        <!-- Remove Button -->
                                        <button
                                            v-if="tracks.length > 1"
                                            type="button"
                                            @click="removeTrack(track.id)"
                                            class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                                        >
                                            <Trash2 class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Progress Bar -->
                            <div v-if="isUploading" class="space-y-2">
                                <div class="flex justify-between text-sm text-gray-600">
                                    <span>Загрузка...</span>
                                    <span>{{ uploadProgress }}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        class="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${uploadProgress}%` }"
                                    ></div>
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <button
                                type="submit"
                                :disabled="!isFormValid || isUploading"
                                class="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-2xl hover:from-orange-500 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span v-if="isUploading" class="flex items-center justify-center gap-2">
                                    <Loader2 class="w-5 h-5 animate-spin" />
                                    Загрузка...
                                </span>
                                <span v-else>
                                    Опубликовать релиз
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Albums List Section -->
                <div class="order-1 lg:order-2">
                    <div class="bg-white rounded-3xl shadow-xl p-6">
                        <h2 class="text-2xl font-bold text-kot-dark mb-4 flex items-center gap-2">
                            <Disc3 class="w-6 h-6 text-kot-orange" />
                            Мои релизы
                            <span class="text-sm font-normal text-gray-400">({{ albumsCount }})</span>
                        </h2>

                        <!-- Loading State -->
                        <div v-if="loading" class="flex items-center justify-center py-12">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-kot-orange"></div>
                        </div>

                        <!-- Empty State -->
                        <div v-else-if="albumsCount === 0" class="text-center py-12 text-gray-400">
                            <Disc3 class="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p class="text-lg">Нет релизов</p>
                            <p class="text-sm mt-2">Создайте свой первый релиз</p>
                        </div>

                        <!-- Albums List -->
                        <div v-else class="space-y-3">
                            <div
                                v-for="album in albums"
                                :key="album.id"
                                class="rounded-2xl border border-gray-200 overflow-hidden"
                            >
                                <!-- Album Header -->
                                <div
                                    @click="toggleAlbum(album.id)"
                                    class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    <!-- Cover -->
                                    <img
                                        v-if="album.tracks?.[0]?.cover_url || album.cover_url"
                                        :src="buildMediaUrl(album.tracks?.[0]?.cover_url || album.cover_url)"
                                        :alt="album.title"
                                        class="w-16 h-16 rounded-xl object-cover shadow-sm"
                                    />
                                    <div v-else class="w-16 h-16 rounded-xl bg-kot-orange/20 flex items-center justify-center">
                                        <Music class="w-8 h-8 text-kot-orange" />
                                    </div>

                                    <!-- Album Info -->
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-semibold text-kot-dark truncate">{{ album.title }}</h3>
                                        <p class="text-sm text-gray-500 truncate">{{ album.artist }}</p>
                                        <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            <span class="flex items-center gap-1">
                                                <Calendar class="w-3 h-3" />
                                                {{ formatDate(album.release_date) }}
                                            </span>
                                            <span class="px-2 py-1 bg-gray-100 rounded-full">{{ album.genre }}</span>
                                        </div>
                                    </div>

                                    <!-- Expand Icon -->
                                    <ChevronRight
                                        v-if="!expandedAlbums.has(album.id)"
                                        class="w-5 h-5 text-gray-400"
                                    />
                                    <ChevronDown
                                        v-else
                                        class="w-5 h-5 text-gray-400"
                                    />

                                    <!-- Delete Button -->
                                    <button
                                        @click.stop="deleteAlbum(album)"
                                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Удалить релиз"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>

                                <!-- Album Tracks -->
                                <div
                                    v-if="expandedAlbums.has(album.id) && album.tracks"
                                    class="border-t border-gray-200 bg-gray-50"
                                >
                                    <div class="p-4 space-y-2">
                                        <h4 class="text-sm font-medium text-gray-700 mb-2">Треки:</h4>
                                        <div
                                            v-for="(track, index) in album.tracks"
                                            :key="track.id"
                                            class="flex items-center gap-3 text-sm"
                                        >
                                            <img
                                                :src="track.cover_url"
                                                :alt="track.title"
                                                class="w-8 h-8 rounded-lg object-cover shadow-sm"
                                                @error="(e) => { console.error('Failed to load cover:', track.cover_url, e); e.target.style.display = 'none' }"
                                            />
                                            <span class="w-6 h-6 bg-white text-kot-orange rounded-full flex items-center justify-center text-xs font-bold">
                                                {{ index + 1 }}
                                            </span>
                                            <span class="flex-1">{{ track.title }}</span>
                                            <span class="text-gray-400">{{ track.artist_name }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
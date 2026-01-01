<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <div v-for="i in 10" :key="i" class="animate-pulse">
        <div class="aspect-square bg-gray-200 rounded-xl mb-3"></div>
        <div class="h-4 bg-gray-200 rounded mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Albums Grid -->
    <div v-else-if="albums.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <div
        v-for="album in albums"
        :key="album.id"
        @click="goToAlbum(album.id)"
        class="group cursor-pointer"
      >
        <!-- Album Cover -->
        <div class="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
          <img
            :src="getAlbumCover(album)"
            :alt="album.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            @error="handleImageError"
          />
          
          <!-- Genre Badge -->
          <div v-if="album.genre" class="absolute top-2 right-2">
            <span class="bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {{ getGenreDisplayName(album.genre) }}
            </span>
          </div>

          <!-- Play Button Overlay -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              @click.stop="playAlbum(album)"
              class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <Play :size="20" class="text-gray-900 ml-0.5" />
            </button>
          </div>
        </div>

        <!-- Album Info -->
        <div class="space-y-1">
          <h3 class="font-semibold text-gray-900 group-hover:text-kot-orange transition-colors line-clamp-1">
            {{ album.title }}
          </h3>
          <p class="text-sm text-gray-600 line-clamp-1">
            {{ album.artist }}
          </p>
          <div class="flex items-center text-xs text-gray-500 space-x-2">
            <span>{{ album.year || getAlbumYear(album) }}</span>
            <span v-if="album.tracks?.length">•</span>
            <span v-if="album.tracks?.length">{{ album.tracks.length }} трек{{ getTrackWordEnding(album.tracks.length) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Cat :size="32" class="text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Альбомы не найдены</h3>
      <p class="text-gray-600">{{ genre ? `Нет альбомов в жанре "${getGenreDisplayName(genre)}"` : 'Попробуйте изменить фильтр жанра' }}</p>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore && !loading" class="text-center pt-6">
      <button
        @click="loadMore"
        :disabled="loadingMore"
        class="px-6 py-3 bg-kot-orange hover:bg-orange-600 text-white font-medium rounded-full transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
      >
        {{ loadingMore ? 'Загрузка...' : 'Загрузить ещё' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { tracksAPI } from '../api/client'
import { getGenreDisplayName } from '../constants/genres'
import { buildMediaUrl } from '../utils/media-urls'
import { Play, Cat } from 'lucide-vue-next'
import type { Album } from '../types'

interface Props {
  genre?: string
}

const props = defineProps<Props>()
const router = useRouter()
const playerStore = usePlayerStore()

// State
const albums = ref<Album[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)

// Helper functions
const getAlbumYear = (album: Album) => {
  if (album.year) return album.year
  if (album.release_date) {
    try {
      return new Date(album.release_date).getFullYear()
    } catch {
      return ''
    }
  }
  if (album.created_at) {
    try {
      return new Date(album.created_at).getFullYear()
    } catch {
      return ''
    }
  }
  return ''
}

const getTrackWordEnding = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) return ''
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'а'
  return 'ов'
}

const getAlbumCover = (album: Album): string => {
  const result = buildMediaUrl(album.cover_url) || '/default-cover.jpg'
  console.log('AlbumGrid: getAlbumCover for', album.title, {
    cover_url: album.cover_url,
    buildMediaUrl_result: buildMediaUrl(album.cover_url),
    final_result: result
  })
  return result
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.log('AlbumGrid: Image error for album, showing fallback icon instead of default-cover.jpg')
  // Не устанавливаем default-cover.jpg, оставляем fallback в виде иконки
  img.style.display = 'none'
}

// Actions
const loadAlbums = async (page: number = 1, append: boolean = false) => {
  try {
    if (page === 1) loading.value = true
    else loadingMore.value = true

    // Используем публичный API для получения альбомов
    const albumsData = await tracksAPI.getAlbums(page, 20, props.genre)

    if (append) {
      albums.value.push(...albumsData)
    } else {
      albums.value = albumsData
    }
    
    // Если получили меньше чем limit, значит это последняя страница
    if (albumsData.length < 20) {
      hasMore.value = false
    } else {
      hasMore.value = true
    }
    
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load albums:', error)
    albums.value = []
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (!hasMore.value || loadingMore.value) return
  loadAlbums(currentPage.value + 1, true)
}

const goToAlbum = (albumId: string) => {
  router.push(`/albums/${albumId}`)
}

const playAlbum = async (album: Album) => {
  try {
    console.log('Playing album:', album.title, 'tracks:', album.tracks?.length || 'none')
    
    // Если у альбома есть треки, воспроизводим их
    if (album.tracks && album.tracks.length > 0) {
      console.log('Setting queue with tracks:', album.tracks)
      playerStore.setQueue(album.tracks, album.tracks[0].id)
    } else {
      // Альбомы из списка не содержат треков, нужно загрузить детали альбома
      console.log('Loading album details to get tracks...')
      const albumDetails = await tracksAPI.getAlbumDetails(album.id)
      if (albumDetails.tracks && albumDetails.tracks.length > 0) {
        console.log('Got tracks from album details:', albumDetails.tracks)
        playerStore.setQueue(albumDetails.tracks, albumDetails.tracks[0].id)
      } else {
        console.log('No tracks found, navigating to album page')
        goToAlbum(album.id)
      }
    }
  } catch (error) {
    console.error('Failed to play album:', error)
    // В случае ошибки переходим на страницу альбома
    goToAlbum(album.id)
  }
}

// Watch for genre changes
watch(() => props.genre, () => {
  currentPage.value = 1
  hasMore.value = true
  albums.value = [] // Очищаем список при смене жанра
  loadAlbums(1)
}, { immediate: false })

// Load initial data
onMounted(() => {
  loadAlbums()
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
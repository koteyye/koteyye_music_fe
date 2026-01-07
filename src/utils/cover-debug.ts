// Утилиты для отладки обложек треков

import { tracksAPI } from '../api/client'

// Тест загрузки обложки в консоли браузера
export const testTrackCover = async (trackId: string) => {
  try {
    const coverUrl = tracksAPI.getCoverUrl(trackId)
    console.log('Testing cover URL:', coverUrl)
    
    const response = await fetch(coverUrl)
    console.log('Status:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))
    console.log('Cache-Control:', response.headers.get('cache-control'))
    
    if (response.ok) {
      const blob = await response.blob()
      console.log('Image size:', blob.size, 'bytes')
      console.log('Image type:', blob.type)
      
      // Создать ссылку для просмотра
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      return {
        success: true,
        size: blob.size,
        type: blob.type,
        url
      }
    } else {
      console.error('Failed to load cover, status:', response.status)
      return {
        success: false,
        status: response.status,
        statusText: response.statusText
      }
    }
  } catch (error) {
    console.error('Error loading cover:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Проверка существования обложки
export const checkCoverExists = async (trackId: string): Promise<boolean> => {
  try {
    const response = await fetch(tracksAPI.getCoverUrl(trackId), { 
      method: 'HEAD' 
    })
    return response.ok
  } catch {
    return false
  }
}

// Логирование ошибок загрузки обложек
export const logCoverError = (track: any, error: any) => {
  console.error('Failed to load cover for track:', {
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    hasImageKey: !!track.s3_image_key,
    imageKey: track.s3_image_key,
    coverUrl: tracksAPI.getCoverUrl(track.id),
    error: error instanceof Error ? error.message : error
  })
}

// Проверка всех обложек в списке треков
export const validateAllCovers = async (tracks: any[]) => {
  console.log(`Checking covers for ${tracks.length} tracks...`)
  
  const results = await Promise.allSettled(
    tracks.map(async (track) => {
      const exists = await checkCoverExists(track.id)
      return {
        trackId: track.id,
        title: track.title,
        hasImageKey: !!track.s3_image_key,
        coverExists: exists
      }
    })
  )
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  console.log(`Cover validation results:`)
  console.log(`- Successful: ${successful}`)
  console.log(`- Failed: ${failed}`)
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const data = result.value
      if (!data.coverExists && data.hasImageKey) {
        console.warn(`❌ Track "${data.title}" has image key but cover not accessible`)
      } else if (data.coverExists) {
        console.log(`✅ Track "${data.title}" cover OK`)
      }
    }
  })
  
  return results
}

// Добавляем функции в window для использования в консоли браузера
if (typeof window !== 'undefined') {
  // Создаем namespace для debug функций
  (window as any).coverDebug = {
    testTrackCover,
    checkCoverExists,
    validateAllCovers,
    logCoverError
  }
  
  console.log('Cover debug utilities available in window.coverDebug')
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Строит полный URL для медиа-ресурса
 * @param url - относительный URL от API (например: "/api/tracks/123/cover") или полный URL
 * @returns полный URL для использования в src атрибутах
 */
export function buildMediaUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') {
    return null;
  }
  
  console.log('buildMediaUrl called with:', url, 'API_BASE_URL:', API_BASE_URL);

  // Если URL уже полный (содержит протокол), возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('buildMediaUrl: URL is already full, returning as is');
    return url;
  }

  // Если URL начинается с /api/ - это уже полный путь от API, просто добавляем base URL
  if (url.startsWith('/api/')) {
    const result = `${API_BASE_URL}${url}`;
    console.log('buildMediaUrl: URL starts with /api/, result:', result);
    return result;
  }

  // Если URL начинается с /, добавляем base URL (который уже содержит /api)
  if (url.startsWith('/')) {
    const result = `${API_BASE_URL}${url}`;
    console.log('buildMediaUrl: URL starts with /, result:', result);
    return result;
  }

  // Иначе считаем это относительным путем и добавляем /
  const result = `${API_BASE_URL}/${url}`;
  console.log('buildMediaUrl: relative URL, result:', result);
  return result;
}

/**
 * Строит URL для обложки трека
 * @param trackId - ID трека
 * @returns URL для обложки трека
 */
export function getTrackCoverUrl(trackId: string): string {
  return `${API_BASE_URL}/tracks/${trackId}/cover`;
}

/**
 * Строит URL для стриминга трека
 * @param trackId - ID трека  
 * @returns URL для стриминга трека
 */
export function getTrackStreamUrl(trackId: string): string {
  return `${API_BASE_URL}/tracks/${trackId}/stream`;
}

/**
 * Строит URL для обложки альбома
 * @param albumId - ID альбома
 * @returns URL для обложки альбома
 */
export function getAlbumCoverUrl(albumId: string): string {
  return `${API_BASE_URL}/albums/${albumId}/cover`;
}
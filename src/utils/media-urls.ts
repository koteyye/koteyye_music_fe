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

  // Если URL уже полный (содержит протокол), возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Если URL начинается с /api/ - НЕ добавляем /api, так как он уже есть
  if (url.startsWith('/api/')) {
    // Убираем /api из URL и добавляем только base URL
    const cleanUrl = url.replace('/api/', '/');
    return `${API_BASE_URL}${cleanUrl}`;
  }

  // Если URL начинается с /, добавляем base URL + /api
  if (url.startsWith('/')) {
    return `${API_BASE_URL}/api${url}`;
  }

  // Иначе считаем это относительным путем и добавляем /api/
  return `${API_BASE_URL}/api/${url}`;
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
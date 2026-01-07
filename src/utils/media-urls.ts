import { API_BASE_URL } from '../config';

export const buildMediaUrl = (url?: string): string => {
  if (!url) return '';
  
  // URL starts with http - return as is
  if (url.startsWith('http')) {
    return url;
  }

  // API_BASE_URL is guaranteed to end with /api now
  const BASE_URL = API_BASE_URL.replace(/\/api$/, ''); // root domain
  
  // If url already starts with /api/, add domain only
  if (url.startsWith('/api/')) {
    return `${BASE_URL}${url}`;
  }
  
  // If url starts with /, it's from root
  if (url.startsWith('/')) {
    // Special handling for API routes that might be returned as root-relative
    if (url.startsWith('/tracks/') || url.startsWith('/albums/')) {
      return `${API_BASE_URL}${url}`;
    }
    return `${BASE_URL}${url}`;
  }
  
  // Otherwise append to API_BASE_URL
  return `${API_BASE_URL}/${url}`;
};

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
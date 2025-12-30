export const GENRE_MAP: Record<string, string> = {
  'pop': 'Поп',
  'rock': 'Рок',
  'hip-hop': 'Хип-хоп',
  'rap': 'Рэп',
  'indie': 'Инди',
  'electronic': 'Электроника',
  'house': 'Хаус',
  'techno': 'Техно',
  'jazz': 'Джаз',
  'blues': 'Блюз',
  'classical': 'Классика',
  'metal': 'Метал',
  'punk': 'Панк',
  'r-n-b': 'R&B',
  'soul': 'Соул',
  'folk': 'Фолк',
  'reggae': 'Регги',
  'country': 'Кантри',
  'latin': 'Латино',
  'k-pop': 'K-Pop',
  'soundtrack': 'Саундтрек',
  'lo-fi': 'Lo-Fi',
  'chanson': 'Шансон'
};

export const GENRE_OPTIONS = Object.entries(GENRE_MAP).map(([value, label]) => ({
  value,
  label
}));

export function getGenreDisplayName(genre: string): string {
  return GENRE_MAP[genre] || genre;
}
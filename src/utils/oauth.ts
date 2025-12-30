// Утилиты для обработки OAuth callback

export interface OAuthCallbackParams {
  token?: string;
  provider?: string;
  error?: string;
}

// Извлечь параметры OAuth из URL
export function extractOAuthParams(): OAuthCallbackParams {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    token: urlParams.get('token') || undefined,
    provider: urlParams.get('provider') || undefined,
    error: urlParams.get('error') || undefined,
  };
}

// Очистить URL от параметров OAuth
export function clearOAuthParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('token');
  url.searchParams.delete('provider');
  url.searchParams.delete('error');
  
  // Обновить URL без перезагрузки страницы
  window.history.replaceState({}, document.title, url.toString());
}

// Проверить, является ли текущий URL OAuth callback
export function isOAuthCallback(): boolean {
  const params = extractOAuthParams();
  return !!(params.token || params.error);
}
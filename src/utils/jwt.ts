// Утилиты для работы с JWT токенами

export interface JWTPayload {
  user_id: number;
  email: string;
  role: string;
  exp: number;  // время истечения
  nbf: number;  // не действителен до
  iat: number;  // выпущен в
}

// Функция для декодирования JWT без проверки подписи (только для чтения payload)
export function parseJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
}

// Проверка актуальности токена
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  
  const payload = parseJWT(token);
  if (!payload) return false;
  
  // Проверить срок действия (exp в секундах)
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

// Получить данные пользователя из токена
export function getUserDataFromToken(token: string | null): JWTPayload | null {
  if (!token || !isTokenValid(token)) return null;
  return parseJWT(token);
}
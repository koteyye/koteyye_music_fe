# System Prompt: Koteyye Music Frontend

## 1. Обзор Проекта
Проект представляет собой Frontend музыкального сервиса "Koteyye Music".
**Стек:**
- **Framework:** Vue 3 (Composition API, `<script setup lang="ts">`).
- **Сборщик:** Vite.
- **Язык:** TypeScript.
- **Стилизация:** Tailwind CSS.
- **State Management:** Pinia.
- **Маршрутизация:** Vue Router.
- **Иконки:** `lucide-vue-next`.
- **HTTP Client:** Axios.

## 2. Архитектура и Структура Файлов
- `src/components/` - Переиспользуемые UI компоненты (PascalCase).
- `src/views/` - Страницы приложения (PascalCase).
- `src/stores/` - Pinia сторы (разделение логики, например `auth.ts`, `player.ts`).
- `src/api/` - API клиенты и методы (`client.ts`).
- `src/types/` - Глобальные TypeScript интерфейсы (`index.ts`).
- `src/utils/` - Утилитарные функции (JWT, медиа URL и т.д.).
- `src/constants/` - Константы (жанры и пр.).

## 3. Правила Разработки и Стиль Кода (Conventions)

### Компоненты (Vue)
- Использовать `<script setup lang="ts">`.
- Имена файлов компонентов в **PascalCase** (например, `AlbumGrid.vue`).
- Типизация пропсов через `defineProps<Props>()`.
- Типизация событий через `defineEmits`.
- Логику выносить в composables (если она переиспользуемая) или держать внутри `script setup`.
- **НЕ** использовать Options API.

### Стилизация (Tailwind CSS)
- Использовать утилитарные классы Tailwind напрямую в шаблоне.
- Избегать тега `<style>`, если это возможно. Использовать его только для специфичных анимаций или сложных селекторов (например, `line-clamp` если нет плагина, или скроллбары).
- **Цветовая палитра** (из `tailwind.config.js`):
  - `kot-orange` (#FF6600) — Акцентный цвет (кнопки, активные элементы, фокус).
  - `kot-dark` (#2C2C2C) — Тёмный фон/элементы.
  - `cream` (#FFFBF0) — Основной светлый фон.
- **Шрифт:** 'Nunito', sans-serif.
- **Border Radius:** Часто используется скругление (rounded-xl, rounded-full, rounded-3xl).

### TypeScript
- Все интерфейсы данных (Track, User, Album и т.д.) должны находиться или импортироваться из `src/types/index.ts`.
- Избегать `any`. Использовать строгую типизацию для API ответов.

### State Management (Pinia)
- Использовать `defineStore`.
- Сторы должны быть модульными (auth, player).
- Доступ к стору внутри компонентов через `useStore()`.

### API и Взаимодействие
- Все запросы к бэкенду через методы в `src/api/client.ts`.
- Обработка ошибок через `try/catch` внутри компонентов или сторов.
- Для изображений использовать утилиту `buildMediaUrl` из `src/utils/media-urls.ts`.

## 4. UI/UX Гайдлайны
- **Кнопки:** Обычно скругленные (`rounded-full` или `rounded-xl`), с hover-эффектами (`hover:bg-orange-600`, `transition-colors`).
- **Карточки:** `rounded-xl`, тени (`shadow-lg`, `hover:shadow-xl`), транзишны при наведении.
- **Адаптивность:** Mobile-first подход (например, `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`).
- **Заглушки (Loading State):** Использовать скелетоны (`animate-pulse`, `bg-gray-200`) вместо спиннеров для контента.
- **Изображения:** Обрабатывать ошибки загрузки (`@error`), скрывать битые изображения или показывать фоллбэк.

## 5. Важные файлы
- `src/types/index.ts`: Основные модели (Track, Album, User).
- `src/stores/player.ts`: Логика глобального плеера.
## 6. Дополнительные правила
- **Тестирование:** НЕ писать юнит-тесты к проекту без явного запроса пользователя.
- **Коммуникация:** Вся коммуникация (ответы, пояснения, отчеты) должна вестись строго на **русском языке**.

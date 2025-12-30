# Koteyye Music Frontend

🐱 Уютный музыкальный стриминговый сервис с мягким и дружелюбным дизайном.

## О проекте

Koteyye Music — это современный фронтенд для музыкального стримингового сервиса, разработанный с использованием Vue 3, TypeScript и Tailwind CSS. Проект отличается мягким и уютным дизайном с кремовыми оттенками и оранжевыми акцентами.

### Особенности

- 🎵 **Стриминг аудио** — плавное воспроизведение треков с возможностью перемотки
- ❤️ **Оптимистичные лайки** — мгновенный отклик интерфейса при лайках
- 🔐 **Авторизация** — поддержка локальной авторизации и OAuth (Google, Yandex)
- 👨‍💼 **Админ-панель** — загрузка и управление треками для администраторов
- 📊 **Аналитика** — отслеживание прослушиваний с умной задержкой (30 сек)
- 🎨 **Уютный дизайн** — мягкие цвета, скругления и тени

## Технологический стек

- **Framework**: Vue 3 (Composition API + Script Setup)
- **Language**: TypeScript (Strict Mode)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide-vue-next
- **Routing**: Vue Router

## Требования

Перед началом работы убедитесь, что у вас установлены:

- Node.js (v18 или выше)
- npm (v9 или выше) или yarn/pnpm
- Git

## Установка

1. **Клонируйте репозиторий**

```bash
git clone <repository-url>
cd koteyye_music_fe
```

2. **Установите зависимости**

```bash
npm install
```

3. **Настройте переменные окружения**

Скопируйте файл `.env.example` и создайте `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` при необходимости:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Разработка

Запустите сервер разработки:

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

## Сборка для продакшена

Соберите оптимизированную версию приложения:

```bash
npm run build
```

Результат будет сохранён в папке `dist/`.

Предпросмотр продакшен-сборки:

```bash
npm run preview
```

## Структура проекта

```
koteyye_music_fe/
├── public/                 # Статические файлы
├── src/
│   ├── api/               # API клиент и эндпоинты
│   │   └── client.ts      # Axios инстанс с интерсепторами
│   ├── components/        # Vue компоненты
│   │   ├── AdminUpload.vue
│   │   ├── HeroPlayer.vue
│   │   └── TrackList.vue
│   ├── router/            # Конфигурация роутера
│   │   └── index.ts
│   ├── stores/            # Pinia сторы
│   │   ├── auth.ts        # Auth стор
│   │   └── player.ts      # Плеер стор
│   ├── types/             # TypeScript типы
│   │   └── index.ts       # Интерфейсы Track, User и т.д.
│   ├── views/             # Страницы приложения
│   │   ├── Admin.vue
│   │   ├── AuthCallback.vue
│   │   ├── Home.vue
│   │   ├── Login.vue
│   │   └── Register.vue
│   ├── App.vue            # Корневой компонент
│   └── main.ts            # Точка входа
├── index.html             # HTML шаблон
├── package.json           # Зависимости проекта
├── tailwind.config.js     # Конфигурация Tailwind
├── tsconfig.json          # Конфигурация TypeScript
└── vite.config.ts         # Конфигурация Vite
```

## API документация

API взаимодействует с бэкендом по адресу `http://localhost:8080/api`.

Основные эндпоинты:

- `POST /auth/login` — Авторизация
- `POST /auth/register` — Регистрация
- `GET /auth/{provider}/login` — OAuth вход (Google/Yandex)
- `GET /tracks` — Получение списка треков
- `GET /tracks/{id}/stream` — Стриминг аудио
- `POST /tracks/{id}/play` — Запись прослушивания
- `POST /tracks/{id}/like` — Лайк трека
- `POST /admin/tracks/upload` — Загрузка трека (admin)

Подробная документация доступна в файле [api_guide.md](./api_guide.md).

## Сторы (Pinia)

### Auth Store

Управляет состоянием авторизации пользователя:

- `user` — информация о текущем пользователе
- `token` — JWT токен
- `isAuthenticated` — флаг авторизации
- `isAdmin` — проверка роли администратора

### Player Store

Управляет воспроизведением музыки:

- `currentTrack` — текущий трек
- `isPlaying` — состояние воспроизведения
- `progress` — текущее время (сек)
- `duration` — длительность трека (сек)
- `playTrack(track)` — запустить трек
- `togglePlay()` — пауза/воспроизведение
- `seek(seconds)` — перемотка

## Компоненты

### HeroPlayer

Главный плеер с:
- Обложкой альбома
- Информацией о треке
- Слайдером прогресса
- Кнопками управления
- Статистикой (прослушивания, лайки)

### TrackList

Список треков с:
- Оптимистичными лайками
- Возможностью воспроизведения
- Информацией о длительности
- Визуальным выделением текущего трека

### AdminUpload

Форма загрузки треков для администраторов:
- Поля: Title, Artist, Album
- Загрузка обложки и аудио
- Валидация файлов

## Дизайн-система

### Цвета

- **Cream** (`#FFFBF0`) — Основной фон
- **Kot Orange** (`#FF6600`) — Основной акцентный цвет
- **Kot Dark** (`#2C2C2C`) — Текст

### Стиль

- Скругления: `rounded-3xl` для карточек
- Тени: `shadow-xl`, `shadow-orange-500/20`
- Фонт: Nunito (Google Fonts)

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск сервера разработки |
| `npm run build` | Сборка для продакшена |
| `npm run preview` | Предпросмотр продакшен-сборки |

## Разработка

### Добавление новых сторов

Создайте файл в `src/stores/` и используйте Composition API:

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMyStore = defineStore('myStore', () => {
  const state = ref(null);
  
  const action = () => {
    // логика
  };
  
  return { state, action };
});
```

### Добавление новых компонентов

Создайте компонент в `src/components/` с `<script setup lang="ts">`:

```vue
<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <div>{{ count }}</div>
</template>
```

## Траблшутинг

### Проблемы с CORS

Если вы сталкиваетесь с ошибками CORS, убедитесь, что бэкенд настроен на разрешение запросов с `http://localhost:3000`.

### Проблемы с TypeScript

При ошибках типов проверьте:
1. Установлены ли все зависимости: `npm install`
2. Правильность путей в `tsconfig.json`
3. Типы в `src/types/index.ts`

## Лицензия

MIT License — подробнее в файле LICENSE.

## Контакты

По вопросам и предложениям: [your-email@example.com]
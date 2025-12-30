# Multi-stage build для оптимизации размера итогового образа

# Stage 1: Build stage
FROM node:18-alpine AS build

# Установка рабочей директории
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение для продакшена
RUN npm run build

# Stage 2: Production stage
FROM nginx:alpine AS production

# Копируем собранное приложение из build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Экспонируем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
# Stage 1: сборка фронтенда
FROM node:20-alpine AS build
WORKDIR /app

# Прокидываем переменные окружения для сборки Vite (используются только при сборке)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_YANDEX_MAPS_API_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY

# Устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm ci

# Копируем исходники и собираем
COPY . ./
RUN npm run build

# Stage 2: минимальный образ с nginx для раздачи статики
FROM nginx:1.27-alpine AS runtime

# Удаляем дефолтный конфиг и копируем наш SPA-конфиг
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Копируем собранный фронтенд
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

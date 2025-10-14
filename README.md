# Полевая карта «Путник»

Современная система мониторинга и управления выездными сотрудниками. Проект объединяет веб-интерфейс диспетчера, Supabase в роли backend-платформы, edge-функции для интеграций и Telegram-бота для сотрудников в поле.

## Ключевые возможности

- **Карта в реальном времени.** Отображение сотрудников и активных заявок на карте Яндекса с расчетом маршрутов, расстояний и ETA.
- **Управление задачами.** Назначение заявок, контроль статусов, автоматическое геокодирование адресов и отчётность.
- **Интеграция с Telegram.** Сотрудники получают и обновляют задачи прямо в боте, отправляют комментарии, фотографии и геолокацию.
- **Ролевой доступ.** Авторизация через Supabase с разграничением операторов и сотрудников, автоматическое создание пользователей через edge-функции.

## Технологический стек

| Область              | Используемые технологии |
|----------------------|--------------------------|
| Фронтенд             | React 18, Vite, TypeScript, React Router, shadcn/ui, Tailwind CSS |
| Состояние и данные   | TanStack Query, Supabase Client |
| Карты и геокодирование | Yandex Maps API, Supabase Edge Functions |
| Интеграции           | Supabase Edge Functions (Telegram, геокодирование) |
| Инфраструктура       | Docker, Nginx (для прод-сборки)

## Быстрый старт (локальная разработка)

1. **Установите зависимости проекта.** Требуется Node.js 20+ и npm.
   ```bash
   npm ci
   ```
2. **Настройте переменные окружения.** Скопируйте `.env.example` в `.env` и заполните значения:
   ```bash
   cp .env.example .env
   ```
   - `VITE_SUPABASE_URL` – URL вашего проекта Supabase (`https://<ref>.supabase.co`).
   - `VITE_SUPABASE_PUBLISHABLE_KEY` – публичный anon key из Supabase → Project settings → API.
   - `VITE_YANDEX_MAPS_API_KEY` – ключ API для загрузки карт Яндекса (яндекс.карты → Кабинет разработчика).
3. **Запустите dev-сервер.**
   ```bash
   npm run dev
   ```
4. Откройте приложение по адресу `http://localhost:5173`.

> Supabase должен быть заранее настроен (см. раздел «Подготовка Supabase»). В дев-режиме можно использовать облачный Supabase или локальный инстанс через Supabase CLI.

## Подготовка Supabase

1. **Создайте проект** в Supabase или разверните self-hosted инстанс.
2. **Настройте CLI** и свяжите репозиторий:
   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   ```
3. **Примените миграции:**
   ```bash
   supabase db push
   ```
4. **Разверните edge-функции:**
   ```bash
   supabase functions deploy create-employee geocode-address geocode-existing-tasks telegram-webhook telegram-setup
   ```
5. **Установите секреты функций:**

   | Переменная                         | Где используется                                     | Назначение |
   |------------------------------------|------------------------------------------------------|------------|
   | `YANDEX_GEOCODING_API_KEY`         | `geocode-address`, `geocode-existing-tasks`          | API ключ для серверного геокодера |
   | `SUPABASE_SERVICE_ROLE_KEY`        | Все функции, требующие административного доступа     | Service role key проекта |
   | `TELEGRAM_BOT_TOKEN`               | `telegram-webhook`, `telegram-setup`                 | Токен бота из BotFather |
   | `SUPABASE_URL`                     | Telegram-функции, geocode-existing-tasks             | Базовый URL проекта |

   ```bash
   cp supabase/.env.example supabase/.env
   supabase secrets set --env-file supabase/.env
   ```
   Создайте файл `supabase/.env` с нужными секретами и используйте команду выше.

6. **Настройте Telegram-бота.** Следуйте пошаговой инструкции в [`TELEGRAM_BOT_SETUP.md`](./TELEGRAM_BOT_SETUP.md).

## Структура проекта

```
.
├── src/                  # Фронтенд-исходники React/TypeScript
│   ├── components/       # UI-компоненты и виджеты панели
│   ├── hooks/            # Хуки для работы с Supabase и состоянием
│   ├── integrations/     # Клиенты Supabase и типы
│   └── pages/            # Маршруты приложения (Index, Dashboard и т.д.)
├── supabase/             # Миграции, конфигурация и edge-функции
├── docker/               # Конфигурация Nginx для прод-сборки
├── Dockerfile            # Многоступенчатая сборка (Node → Nginx)
├── .env.example          # Шаблон переменных окружения для Vite
└── TELEGRAM_BOT_SETUP.md # Инструкция по настройке бота
```

## Доступные npm-скрипты

| Скрипт          | Назначение |
|-----------------|------------|
| `npm run dev`   | Запуск Vite dev-сервера с HMR |
| `npm run build` | Продакшен-сборка (используется в Docker) |
| `npm run build:dev` | Сборка в режиме development |
| `npm run preview` | Локальный предпросмотр прод-сборки |
| `npm run lint`  | Проверка кода ESLint |

## Продакшен-сборка и развертывание

### 1. Сборка без Docker

```bash
cp .env.example .env.production    # создайте отдельный файл для прод-значений
npm run build                      # результат в каталоге dist/
```

Полученный каталог `dist/` можно раздавать любым SPA-сервером (Nginx, Caddy, Vercel и т.п.). Не забудьте прокинуть переменные окружения до сборки.

### Предпросмотр итоговой сборки

Перед выкладкой можно локально проверить готовую прод-версию:

```bash
npm run build     # собрать проект в режиме production
npm run preview   # запустить локальный сервер для каталога dist/
```

По умолчанию Vite поднимет сервер на `http://localhost:4173`. Это позволяет убедиться, что готовая сборка корректно работает в условиях, максимально близких к продакшену.

### 2. Сборка с Docker

1. Создайте файл `.env.production` (или прокиньте переменные через `--build-arg`) с теми же `VITE_*` переменными.
2. Соберите образ:
   ```bash
   docker build -t polya-kartograf-putnik --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=... --build-arg VITE_YANDEX_MAPS_API_KEY=... .
   ```
   Либо временно добавьте `.env.production` в проект и запустите `docker build -t polya-kartograf-putnik .` — Vite автоматически прочитает переменные.
3. Запустите контейнер:
   ```bash
   docker run -d --name kartograf -p 80:80 polya-kartograf-putnik
   ```

Контейнер использует Nginx с конфигурацией `try_files` для корректной работы SPA. Кэш статики включен для каталога `/assets`.

## Дальнейшая доработка

- Добавляйте новые страницы, регистрируя маршруты в `src/App.tsx`.
- Расширяйте базу данных через миграции Supabase (`supabase/migrations`). Каждая миграция версионируется и может быть применена через CLI.
- Для новых интеграций создавайте edge-функции в `supabase/functions`, устанавливайте секреты и деплойте через `supabase functions deploy`.
- Поддерживайте соответствие типов с помощью `supabase gen types typescript --linked` и обновляйте `src/integrations/supabase/types.ts` (если требуется).

## Полезные ссылки

- [Документация Supabase](https://supabase.com/docs)
- [Yandex Maps API](https://developer.tech.yandex.ru/services/)
- [TanStack Query](https://tanstack.com/query/v5/docs/overview)
- [shadcn/ui](https://ui.shadcn.com/)

Готово! Теперь проект адаптирован для локальной разработки, расширений и развёртывания на собственном сервере.

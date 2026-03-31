# Fluxgram

Веб-мессенджер в духе Telegram Lite: Fastify + Socket.io + MongoDB + Redis, фронтенд на React и Tailwind.

## Требования

- Node.js 20+
- Docker (опционально, для MongoDB и Redis)

## Быстрый старт

### 1. Инфраструктура

```bash
docker compose up -d
```

Или поднимите MongoDB и Redis локально на портах `27017` и `6379`.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Сервер: `http://localhost:3001` (HTTP + WebSocket `/socket.io`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте `http://localhost:5173`. Vite проксирует `/api`, `/uploads` и WebSocket на backend.

## Тесты

Убедитесь, что MongoDB доступна (например `docker compose up -d`), затем:

```bash
cd backend
npm test
```

Фронтенд (Vitest):

```bash
cd frontend
npm install
npm test
```

Интеграционные тесты API в `backend/tests/auth.integration.test.js` при недоступной MongoDB автоматически пропускаются; без БД всё равно выполняются проверки `/health` и валидации регистрации/логина.

## Демо «всё в одном месте» (VPS + Docker)

Один сервер, один URL: MongoDB, Redis, API и фронт (Nginx отдаёт SPA и проксирует `/api`, `/socket.io`, `/uploads`).

1. Арендуйте VPS (Ubuntu), откройте порт **80** (и **443**, если позже повесите HTTPS).
2. Установите [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) и плагин Compose.
3. Склонируйте репозиторий на сервер.
4. В **корне репозитория** создайте файл `.env` по образцу `prod.env.example`:
   - `JWT_SECRET` — длинная случайная строка.
   - `CORS_ORIGIN` — как заказчик открывает сайт, например `http://203.0.113.10` или `https://demo.example.com` (без слэша в конце).
   - `HTTP_PORT` — обычно `80`.
5. Запуск:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   Сервис **web** стартует только после готовности Mongo, Redis и ответа `/health` у backend (меньше 502 при первом открытии).
6. Проверка: в браузере `http://ВАШ_IP/health` → `{"ok":true}`, затем откройте `http://ВАШ_IP/` и зарегистрируйтесь.

Фронт собирается с пустым `VITE_API_URL`, запросы идут на тот же хост — отдельный домен для API не нужен.

## Переменные окружения

**backend `.env`**

| Переменная     | Описание                          |
|----------------|-----------------------------------|
| `PORT`         | Порт API (по умолчанию 3001)      |
| `MONGODB_URI`  | Строка подключения MongoDB        |
| `REDIS_URL`    | Строка подключения Redis          |
| `JWT_SECRET`   | Секрет подписи JWT (обязательно в prod) |
| `CORS_ORIGIN`  | Origin фронтенда (например `http://localhost:5173`) |
| `UPLOAD_DIR`   | Каталог для загрузок (относительно `cwd`) |

**frontend** — для production задайте `VITE_API_URL` на публичный URL API, если фронт и API на разных доменах.

## API (кратко)

| Метод | Путь | Описание |
|--------|------|----------|
| POST | `/api/auth/register` | Регистрация `{ email, username, password }` |
| POST | `/api/auth/login` | Вход `{ email, password }` |
| GET | `/api/auth/me` | Текущий пользователь (Bearer JWT) |
| POST | `/api/auth/avatar` | Загрузка аватара (multipart `file`) |
| GET | `/api/chats` | Список чатов |
| POST | `/api/chats/direct` | Открыть/создать личный чат `{ userId }` |
| POST | `/api/chats/group` | Группа `{ name?, participantIds[] }` |
| GET | `/api/chats/:chatId/messages?before=&limit=` | История (курсор `before` = id сообщения) |
| GET | `/api/chats/:chatId/search?q=` | Поиск по тексту в чате |
| GET | `/api/users/search?q=` | Поиск пользователей |
| POST | `/api/upload` | Загрузка файла (изображение) |

WebSocket: подключение с `auth: { token: "<JWT>" }`. События: `chat:join`, `chat:leave`, `typing:start` / `typing:stop`, `message:send`. С сервера: `message:new`, `typing`, `presence`, `chat:preview`.

## Архитектура backend

- **Auth** — `modules/auth/` (routes → controller → service → repository), JWT через `@fastify/jwt`.
- **Chat** — `modules/chat/` — чаты, сообщения, поиск.
- **WebSocket** — `modules/websocket/socket.gateway.js` — Socket.io; при доступном Redis используется `@socket.io/redis-adapter` для горизонтального масштабирования.
- **Upload** — `modules/upload/upload.routes.js`, статика `/uploads/*`.

## Сборка frontend для production

```bash
cd frontend
npm run build
```

Раздавайте `dist/` через CDN или nginx; настройте прокси на тот же хост, что и API, либо укажите `VITE_API_URL`.

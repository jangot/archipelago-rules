# Archipelago Rules - Векторная база знаний

Этот проект содержит правилами игры "Архипелаг" (2d20).
- [Читать](rules/README.md) - Введение в мир Архипелага

## 🚀 Быстрый старт

### Предварительные требования

1. **Node.js** (версия 16 или выше)
2. **Qdrant** сервер (локальный или удалённый)
3. **OpenAI API ключ**

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd archipelago-rules
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` в корне проекта:
```env
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_URL=http://localhost:6333
VECTOR_DB_NAME=archipelago-rules
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
KINGS=user1,user2,user3
USERS_DB_PATH=/your/custom/path/users.json  # (необязательно) путь к базе пользователей
```

### Настройка Qdrant

#### Локальный запуск (Docker)
```bash
docker run -p 6333:6333 qdrant/qdrant
```

#### Или используйте удалённый сервер
Измените `QDRANT_URL` в файле `.env` на адрес вашего сервера.

### Запуск

1. **Тестирование парсинга файлов** (без Qdrant):
```bash
npm run build
node dist/test.js
```

2. **Проверка подключения к Qdrant**:
```bash
npm run check-qdrant
```

3. **Полный импорт в векторную базу**:
```bash
npm run upload-db
```

4. **Запуск Telegram бота**:
```bash
npm run start:bot
```

## 📁 Структура проекта

```
archipelago-rules/
├── src/
│   ├── upload-db.ts      # Основной скрипт импорта
│   ├── test.ts           # Тестовый скрипт
│   ├── telegram-bot.ts   # Telegram бот
│   ├── configuration.ts  # Конфигурация
│   ├── qdrant.ts         # Работа с Qdrant
│   ├── openai-api.ts     # Работа с OpenAI API
│   └── read-md.ts        # Парсинг markdown файлов
├── rules/                # Markdown файлы с правилами
├── dist/                 # Скомпилированные файлы
├── data/                 # (по умолчанию) База пользователей
└── .env                  # Переменные окружения
```

## 🔧 Функциональность

### Парсинг Markdown файлов
- Автоматическое извлечение заголовков и структуры
- Разбиение на логические чанки
- Сохранение иерархии разделов и глав

### Векторизация
- Использование OpenAI Embeddings API
- Модель: `text-embedding-3-small` (1536 измерений)
- Косинусное расстояние для поиска

### Поиск и ответы
- Семантический поиск по векторной базе
- Генерация ответов с помощью GPT-3.5-turbo
- Контекстные ответы на основе найденных фрагментов
- Telegram бот для удобного доступа к правилам

## 👥 Управление пользователями

- Все пользователи и их права доступа хранятся в отдельном JSON-файле (по умолчанию `data/users.json`).
- Путь к базе можно задать через переменную окружения `USERS_DB_PATH` (например, `/your/custom/path/users.json`).
- Для миграции пользователей из `.env` используйте:
  ```bash
  npm run migrate-users
  ```
- Управление пользователями через Telegram-бота (только для админов) и через CLI:
  ```bash
  npm run manage-users list
  npm run manage-users add <username>
  npm run manage-users add-id <id>
  npm run manage-users remove <username>
  npm run manage-users activate <username>
  npm run manage-users delete <username>
  npm run manage-users stats
  ```
- Только пользователи с флагом `isAdmin` могут добавлять, удалять и назначать других админов.

## 📊 Формат данных

Каждый чанк содержит:
- `text` - текст фрагмента
- `headers` - иерархия заголовков
- `section` - раздел (например, "СОЗДАНИЕ ПЕРСОНАЖА")
- `chapter` - глава (например, "01. Предисловие")
- `file` - имя исходного файла
- `index` - индекс чанка в файле
- `globalIndex` - глобальный индекс

## 🛠️ Разработка

### Компиляция TypeScript
```bash
npm run build
```

### Запуск в режиме разработки
```bash
npm run start
```

### Тестирование
```bash
npm run test
```

## 🔍 Использование API

### Поиск релевантных фрагментов
```typescript
import { searchRelevantChunks } from './src/qdrant';

const results = await searchRelevantChunks("Как создать персонажа?", 10);
```

### Получение ответа от AI
```typescript
import { getAIResponse } from './src/openai-api';

const answer = await getAIResponse("Вопрос", searchResults);
```

## ⚠️ Важные замечания

1. **Размер векторов**: Убедитесь, что размер векторов в Qdrant (1536) соответствует модели OpenAI
2. **API лимиты**: Следите за лимитами OpenAI API при обработке больших файлов
3. **Память**: При обработке больших файлов может потребоваться больше памяти
4. **Сеть**: Убедитесь в стабильном интернет-соединении для работы с OpenAI API

## 🐛 Устранение неполадок

### Qdrant недоступен
- Проверьте, что сервер запущен
- Убедитесь в правильности URL в `.env`
- Проверьте сетевое подключение

### OpenAI API ошибки
- Проверьте API ключ
- Убедитесь в наличии средств на счету
- Проверьте лимиты API

### Ошибки парсинга
- Проверьте формат markdown файлов
- Убедитесь в корректности кодировки (UTF-8)
- Проверьте синтаксис заголовков

## 📝 Лицензия

ISC License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

При возникновении проблем создайте Issue в репозитории или обратитесь к разработчику.

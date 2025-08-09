# Примеры использования команд синхронизации

## 🚀 Быстрый старт

### 1. Первая синхронизация
```bash
npm install
npm run sync:public
```

### 2. Полная синхронизация с резервной копией
```bash
npm run sync:all
```

## 📥 Рабочие процессы

### Ежедневная синхронизация
```bash
# Создаем резервную копию и синхронизируем
npm run sync:all
```

### Экспериментальная синхронизация
```bash
# Создаем резервную копию
npm run sync:backup

# Тестируем синхронизацию
npm run test:sync

# Если что-то пошло не так - восстанавливаем
npm run sync:restore
```

### Синхронизация из браузера
```bash
# 1. Откройте Google Docs в браузере
# 2. Скопируйте HTML (Ctrl+A, Ctrl+C)
# 3. Запустите синхронизацию из буфера
npm run sync:html
```

### Синхронизация из файла
```bash
# 1. Сохраните HTML в файл temp-doc.html
# 2. Запустите синхронизацию
npm run sync:file
```

## 🔍 Мониторинг изменений

### Проверка статуса
```bash
# Последние изменения
npm run sync:status

# Текущие различия
npm run sync:diff
```

### История изменений
```bash
# Последние 20 изменений
git log --oneline -20 -- files/parts/

# Изменения за последний день
git log --oneline --since="1 day ago" -- files/parts/
```

## 🛠️ Управление резервными копиями

### Создание резервной копии
```bash
npm run sync:backup
# Создает: files/parts-backup-20241201-143022/
```

### Восстановление
```bash
npm run sync:restore
# Восстанавливает последнюю резервную копию
```

### Очистка
```bash
npm run sync:clean
# Удаляет все резервные копии
```

## 🔧 Продвинутые сценарии

### Синхронизация с проверкой
```bash
# Создаем резервную копию
npm run sync:backup

# Синхронизируем
npm run sync:public

# Проверяем изменения
npm run sync:diff

# Если изменения корректны - коммитим
git add files/parts/
git commit -m "🔄 Синхронизация правил"

# Если что-то не так - восстанавливаем
npm run sync:restore
```

### Автоматическая синхронизация (cron)
```bash
# Добавьте в crontab для ежедневной синхронизации в 9:00
0 9 * * * cd /path/to/archipelago-rules && npm run sync:all
```

### Синхронизация с уведомлениями
```bash
# Создаем скрипт sync-with-notify.sh
#!/bin/bash
npm run sync:all
if [ $? -eq 0 ]; then
    echo "✅ Синхронизация завершена успешно"
else
    echo "❌ Ошибка синхронизации"
fi
```

## 🐛 Отладка

### Проверка структуры файлов
```bash
# Список всех файлов правил
ls -la files/parts/

# Размер файлов
du -h files/parts/
```

### Проверка маппинга
```bash
# Просмотр маппинга в скрипте
grep "SECTION_MAPPING" scripts/sync-rules.js
```

### Тестирование парсера
```bash
# Запуск теста
npm run test:sync

# Проверка результата
ls -la files/parts/
```

## 📋 Чек-лист для новой синхронизации

- [ ] `npm run sync:backup` - создаем резервную копию
- [ ] `npm run sync:public` - синхронизируем
- [ ] `npm run sync:diff` - проверяем изменения
- [ ] `npm run sync:status` - смотрим историю
- [ ] Проверяем файлы в браузере
- [ ] Если все хорошо - коммитим изменения
- [ ] Если проблемы - `npm run sync:restore`
#!/bin/bash

echo "🚀 Запуск загрузчика локальных файлов в векторную базу"
echo "📁 Обработка файлов из папки downloads"
echo ""

# Проверяем наличие файлов в папке downloads
if [ ! -d "./downloads" ]; then
    echo "❌ Папка downloads не найдена"
    exit 1
fi

if [ ! "$(ls -A ./downloads/*.txt 2>/dev/null)" ]; then
    echo "❌ Не найдено .txt файлов в папке downloads"
    exit 1
fi

echo "📋 Найденные файлы:"
ls -la ./downloads/*.txt

echo ""
echo "🔧 Запуск с параметрами по умолчанию:"
echo "   - Размер чанка: 1000 символов"
echo "   - Пересечение: 10%"
echo "   - Размер батча: 5"
echo "   - Максимум одновременных запросов: 1"
echo ""

# Запускаем скрипт
npx ts-node src/upload-local-file.ts

echo ""
echo "✅ Загрузка завершена"

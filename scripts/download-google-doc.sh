#!/bin/bash

# Скрипт для скачивания файла из Google Docs по ID
# Использование: ./download-google-doc.sh <GOOGLE_DOC_ID> [output_filename]

# Получаем абсолютный путь к папке скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOWNLOADS_DIR="$PROJECT_ROOT/downloads"

# Проверяем, что передан ID файла
if [ $# -eq 0 ]; then
    echo "❌ Ошибка: не указан ID файла Google Docs"
    echo "Использование: $0 <GOOGLE_DOC_ID> [output_filename]"
    echo "Пример: $0 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
    exit 1
fi

DOC_ID="$1"
OUTPUT_FILE="${2:-${DOC_ID}.txt}"

# Создаем папку downloads если её нет
mkdir -p "$DOWNLOADS_DIR"

# Полный путь к файлу в папке downloads
FULL_PATH="$DOWNLOADS_DIR/$OUTPUT_FILE"

echo "🚀 Скачиваю файл из Google Docs..."
echo "📄 ID файла: $DOC_ID"
echo "💾 Сохраняю как: $FULL_PATH"

# URL для экспорта Google Docs в текстовом формате
DOWNLOAD_URL="https://docs.google.com/document/d/${DOC_ID}/export?format=txt"

# Скачиваем файл
if curl -L -o "$FULL_PATH" "$DOWNLOAD_URL"; then
    echo "✅ Файл успешно скачан: $FULL_PATH"
    echo "📏 Размер файла: $(du -h "$FULL_PATH" | cut -f1)"
else
    echo "❌ Ошибка при скачивании файла"
    exit 1
fi

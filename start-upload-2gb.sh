#!/bin/bash

# Скрипт для запуска upload-file.ts на серверах с 2GB памяти
# Автоматически настраивает оптимальные параметры

echo "🚀 Запуск upload-file.ts для сервера с 2GB памяти"
echo "=================================================="

# Проверяем доступную память
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 Общая память сервера: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 1800 ]; then
    echo "⚠️  ВНИМАНИЕ: Мало памяти! Рекомендуется минимум 2GB"
    echo "   Используются максимально консервативные настройки"
    HEAP_SIZE=1024
    BATCH_SIZE=10
    MAX_CONCURRENT=1
    CHUNK_SIZE=800
elif [ "$TOTAL_MEM" -lt 2200 ]; then
    echo "🔧 Настройки для 2GB сервера"
    HEAP_SIZE=1536
    BATCH_SIZE=15
    MAX_CONCURRENT=2
    CHUNK_SIZE=1000
else
    echo "✅ Достаточно памяти, используем стандартные настройки"
    HEAP_SIZE=2048
    BATCH_SIZE=25
    MAX_CONCURRENT=3
    CHUNK_SIZE=1500
fi

echo ""
echo "📋 Параметры запуска:"
echo "   Heap size: ${HEAP_SIZE}MB"
echo "   Batch size: ${BATCH_SIZE}"
echo "   Max concurrent: ${MAX_CONCURRENT}"
echo "   Chunk size: ${CHUNK_SIZE}"
echo ""

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo "❌ Ошибка: Укажите путь к файлу или ID Google Drive"
    echo ""
    echo "Использование:"
    echo "  ./start-upload-2gb.sh --path /path/to/file.txt"
    echo "  ./start-upload-2gb.sh --drive 1ulanNBqKru7RYQ-_dLAhQuT8U7SDCWsxQtAx39wv6lM"
    echo ""
    echo "Дополнительные параметры:"
    echo "  --chunkSize <размер>     Размер чанка (по умолчанию: ${CHUNK_SIZE})"
    echo "  --overlap <процент>      Перекрытие чанков (по умолчанию: 5)"
    echo "  --batchSize <размер>     Размер батча (по умолчанию: ${BATCH_SIZE})"
    echo "  --maxConcurrent <число>  Максимум запросов (по умолчанию: ${MAX_CONCURRENT})"
    exit 1
fi

# Собираем команду
CMD="NODE_OPTIONS=\"--max-old-space-size=${HEAP_SIZE}\" npx ts-node src/upload-file.ts"

# Добавляем базовые параметры, если они не указаны
HAS_CHUNK_SIZE=false
HAS_BATCH_SIZE=false
HAS_MAX_CONCURRENT=false

for arg in "$@"; do
    if [[ "$arg" == "--chunkSize" ]]; then
        HAS_CHUNK_SIZE=true
    elif [[ "$arg" == "--batchSize" ]]; then
        HAS_BATCH_SIZE=true
    elif [[ "$arg" == "--maxConcurrent" ]]; then
        HAS_MAX_CONCURRENT=true
    fi
done

# Добавляем параметры по умолчанию, если они не указаны
if [ "$HAS_CHUNK_SIZE" = false ]; then
    CMD="$CMD --chunkSize $CHUNK_SIZE"
fi

if [ "$HAS_BATCH_SIZE" = false ]; then
    CMD="$CMD --batchSize $BATCH_SIZE"
fi

if [ "$HAS_MAX_CONCURRENT" = false ]; then
    CMD="$CMD --maxConcurrent $MAX_CONCURRENT"
fi

# Добавляем все переданные аргументы
CMD="$CMD $@"

echo "🔧 Выполняю команду:"
echo "$ $CMD"
echo ""

# Запускаем команду
eval $CMD

# Проверяем результат
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Загрузка завершена успешно!"
else
    echo ""
    echo "❌ Ошибка при загрузке!"
    echo ""
    echo "💡 Рекомендации для устранения проблем:"
    echo "   1. Уменьшите размер файла"
    echo "   2. Уменьшите --batchSize до 5-10"
    echo "   3. Уменьшите --maxConcurrent до 1"
    echo "   4. Уменьшите --chunkSize до 500-800"
    echo "   5. Увеличьте swap файл на сервере"
fi

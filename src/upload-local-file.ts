#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createReadStream } from 'fs';

import { configuration } from './configuration';
import { qdrant } from './qdrant';
import { VectorCacheManager } from './vector-cache';

type ChunkData = { text: string; index: number };

// Константы для оптимизации памяти
const CHUNK_SIZE = 1000; // Размер чанка в символах
const OVERLAP_PERCENT = 10; // Пересечение между чанками (10%)
const BATCH_SIZE = 5; // Размер батча для загрузки в Qdrant (очень маленький для экономии памяти)
const MAX_CONCURRENT_REQUESTS = 1; // Только один запрос одновременно для экономии памяти
const MEMORY_THRESHOLD_MB = 200; // Порог памяти для предупреждений
const DOWNLOADS_DIR = './downloads'; // Папка с загруженными файлами

function parseArgs(argv: string[]) {
  const args: Record<string, string | number | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args as {
    file?: string;
    chunkSize?: string | number;
    overlap?: string | number;
    batchSize?: string | number;
    maxConcurrent?: string | number;
  };
}

// Мониторинг памяти
function getMemoryUsage(): { used: number; total: number; percentage: number } {
  const usage = process.memoryUsage();
  const used = Math.round(usage.heapUsed / 1024 / 1024);
  const total = Math.round(usage.heapTotal / 1024 / 1024);
  const percentage = Math.round((used / total) * 100);
  return { used, total, percentage };
}

function logMemoryUsage(context: string) {
  const { used, total, percentage } = getMemoryUsage();
  console.log(`💾 Память [${context}]: ${used}MB/${total}MB (${percentage}%)`);

  if (used > MEMORY_THRESHOLD_MB) {
    console.warn(`⚠️  Высокое потребление памяти: ${used}MB`);
  }

  if (used > 500) {
    console.error(`🚨 КРИТИЧНО: Потребление памяти ${used}MB может привести к краху!`);
  }
}

// Проверка размера файла
function checkFileSize(filePath: string): void {
  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / 1024 / 1024;
  console.log(`📏 Размер файла: ${sizeMB.toFixed(1)}MB`);
}

// Потоковое чтение файла с фильтрацией пустых строк
async function readFileStream(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    let buffer = '';

    stream.on('data', (chunk: Buffer | string) => {
      buffer += chunk.toString();

      // Разбиваем на строки и фильтруем пустые
      const newLines = buffer.split('\n');
      buffer = newLines.pop() || ''; // Последняя строка может быть неполной

      for (const line of newLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          lines.push(trimmedLine);
        }
      }
    });

    stream.on('end', () => {
      // Обрабатываем последнюю строку
      if (buffer.trim().length > 0) {
        lines.push(buffer.trim());
      }
      resolve(lines);
    });

    stream.on('error', reject);
  });
}

// Генератор чанков с пересечением
function* createChunksFromLines(lines: string[], chunkSize: number, overlapPercent: number): Generator<ChunkData> {
  if (chunkSize <= 0) throw new Error('chunkSize должен быть > 0');
  if (overlapPercent < 0 || overlapPercent >= 100) throw new Error('overlap должен быть в диапазоне [0, 100)');

  const overlapSize = Math.floor((chunkSize * overlapPercent) / 100);
  const step = Math.max(1, chunkSize - overlapSize);

  let index = 0;
  let currentChunk = '';
  let currentLength = 0;

  for (const line of lines) {
    // Если добавление строки превысит размер чанка
    if (currentLength + line.length + 1 > chunkSize && currentChunk.length > 0) {
      // Сохраняем текущий чанк
      yield { text: currentChunk.trim(), index: index++ };

      // Создаем новый чанк с пересечением
      const words = currentChunk.split(' ');
      const overlapWords = Math.floor((words.length * overlapPercent) / 100);
      const overlapText = words.slice(-overlapWords).join(' ');

      currentChunk = overlapText + ' ' + line;
      currentLength = overlapText.length + 1 + line.length;
    } else {
      // Добавляем строку к текущему чанку
      if (currentChunk.length > 0) {
        currentChunk += ' ' + line;
        currentLength += 1 + line.length;
      } else {
        currentChunk = line;
        currentLength = line.length;
      }
    }
  }

  // Добавляем последний чанк
  if (currentChunk.trim().length > 0) {
    yield { text: currentChunk.trim(), index: index++ };
  }
}

// Ограниченная очередь для обработки запросов
class LimitedQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;

    try {
      await task();
    } finally {
      this.running--;
      this.process();
    }
  }
}

// Удаление существующей коллекции
async function deleteCollectionIfExists(collectionName: string): Promise<void> {
  try {
    await qdrant.getCollection(collectionName);
    console.log(`🗑️  Удаляю существующую коллекцию "${collectionName}"...`);
    await qdrant.deleteCollection(collectionName);
    console.log(`✅ Коллекция "${collectionName}" удалена`);
  } catch {
    console.log(`ℹ️  Коллекция "${collectionName}" не найдена — пропускаю удаление`);
  }
}

// Создание новой коллекции
async function createCollection(collectionName: string): Promise<void> {
  console.log(`📚 Создаю коллекцию "${collectionName}"...`);
  await qdrant.createCollection(collectionName, {
    vectors: { size: 1536, distance: 'Cosine' },
  });
  console.log(`✅ Коллекция "${collectionName}" создана`);
}

// Обработка батча чанков
async function processBatch(
  chunks: ChunkData[],
  fileName: string,
  queue: LimitedQueue,
  vectorCache: VectorCacheManager
): Promise<number> {
  const promises = chunks.map(chunk =>
    queue.add(async () => {
      try {
        const vector = await vectorCache.getVector(chunk.text);
        await qdrant.upsert(configuration.vectorDBName, {
          points: [
            {
              id: uuidv4(),
              vector,
              payload: {
                text: chunk.text,
                headers: [fileName],
                section: 'IMPORT',
                chapter: fileName,
                file: fileName,
                index: chunk.index,
              },
            },
          ],
        });
        return true;
      } catch (e) {
        console.error(`   ❌ Ошибка при загрузке чанка ${chunk.index + 1}:`, e);
        return false;
      }
    })
  );

  const results = await Promise.all(promises);
  return results.filter(Boolean).length;
}

// Получение списка файлов из папки downloads
function getDownloadFiles(): string[] {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.error(`❌ Папка ${DOWNLOADS_DIR} не найдена`);
    return [];
  }

  const files = fs.readdirSync(DOWNLOADS_DIR)
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(DOWNLOADS_DIR, file));

  return files;
}

async function main() {
  const args = parseArgs(process.argv);
  const fileName = (args.file as string) || '';
  const chunkSize = Number(args.chunkSize || CHUNK_SIZE);
  const overlap = Number(args.overlap || OVERLAP_PERCENT);
  const batchSize = Number(args.batchSize || BATCH_SIZE);
  const maxConcurrent = Number(args.maxConcurrent || MAX_CONCURRENT_REQUESTS);

  console.log(`
📁 Загрузка файла из папки downloads в векторную базу
🔧 Оптимизировано для низкого потребления памяти

Использование:
  npx ts-node src/upload-local-file.ts [--file filename.txt] [--chunkSize 1000] [--overlap 10] [--batchSize 5] [--maxConcurrent 1]

Параметры:
  --file: конкретный файл из папки downloads (если не указан, обрабатывает все .txt файлы)
  --chunkSize: размер чанка в символах (по умолчанию: ${CHUNK_SIZE})
  --overlap: пересечение между чанками в % (по умолчанию: ${OVERLAP_PERCENT}%)
  --batchSize: размер батча для загрузки (по умолчанию: ${BATCH_SIZE})
  --maxConcurrent: максимальное количество одновременных запросов (по умолчанию: ${MAX_CONCURRENT_REQUESTS})
`);

  console.log('🔍 Проверяю доступность Qdrant...');
  await qdrant.getCollections();
  console.log('✅ Qdrant доступен');

  logMemoryUsage('начало');

  // Получаем список файлов для обработки
  const downloadFiles = getDownloadFiles();
  if (downloadFiles.length === 0) {
    console.error('❌ Не найдено .txt файлов в папке downloads');
    process.exit(1);
  }

  const filesToProcess = fileName
    ? downloadFiles.filter(f => path.basename(f) === fileName)
    : downloadFiles;

  if (filesToProcess.length === 0) {
    console.error(`❌ Файл ${fileName} не найден в папке downloads`);
    process.exit(1);
  }

  console.log(`📁 Найдено файлов для обработки: ${filesToProcess.length}`);

  // Полное обнуление базы (коллекции)
  await deleteCollectionIfExists(configuration.vectorDBName);
  await createCollection(configuration.vectorDBName);

  // Создаем очередь для ограничения конкурентности и кэш векторов
  const queue = new LimitedQueue(maxConcurrent);
  const vectorCache = new VectorCacheManager();

  let totalUploaded = 0;
  let totalProcessed = 0;

  // Обрабатываем каждый файл
  for (const filePath of filesToProcess) {
    const fileName = path.basename(filePath);
    console.log(`\n📖 Обрабатываю файл: ${fileName}`);

    checkFileSize(filePath);

    // Читаем файл потоково
    console.log('📖 Читаю файл потоково...');
    const lines = await readFileStream(filePath);
    console.log(`📝 Прочитано строк: ${lines.length}`);

    // Создаем чанки
    console.log(`✂️  Создаю чанки: размер=${chunkSize}, пересечение=${overlap}%`);
    const chunkGenerator = createChunksFromLines(lines, chunkSize, overlap);

    let batch: ChunkData[] = [];
    let fileProcessed = 0;
    let fileUploaded = 0;

    // Обрабатываем чанки батчами
    for (const chunk of chunkGenerator) {
      batch.push(chunk);
      fileProcessed++;
      totalProcessed++;

      // Когда батч заполнен, обрабатываем его
      if (batch.length >= batchSize) {
        const uploaded = await processBatch(batch, fileName, queue, vectorCache);
        fileUploaded += uploaded;
        totalUploaded += uploaded;

        console.log(`   📦 Файл ${fileName}: обработано ${fileProcessed}, загружено ${fileUploaded}`);
        logMemoryUsage(`файл ${fileName}, батч ${Math.floor(fileProcessed / batchSize)}`);

        // Очищаем батч для освобождения памяти
        batch = [];

        // Небольшая пауза для снижения нагрузки
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Обрабатываем оставшиеся чанки
    if (batch.length > 0) {
      const uploaded = await processBatch(batch, fileName, queue, vectorCache);
      fileUploaded += uploaded;
      totalUploaded += uploaded;
      console.log(`   📦 Файл ${fileName}: обработано ${fileProcessed}, загружено ${fileUploaded}`);
    }

    console.log(`✅ Файл ${fileName} завершен: ${fileUploaded}/${fileProcessed} чанков загружено`);
  }

  logMemoryUsage('конец');

  // Статистика кэша
  const cacheStats = vectorCache.getCacheStats();
  console.log(`💾 Кэш векторов: ${cacheStats.total} записей, ${(cacheStats.size / 1024 / 1024).toFixed(2)}MB`);

  console.log('\n✅ Импорт завершён');
  console.log(`📊 Всего обработано чанков: ${totalProcessed}`);
  console.log(`📊 Всего загружено чанков: ${totalUploaded}`);
  console.log(`📊 Эффективность: ${((totalUploaded / totalProcessed) * 100).toFixed(1)}%`);
}

main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

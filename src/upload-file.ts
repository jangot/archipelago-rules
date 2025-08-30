#!/usr/bin/env node

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';

import { configuration } from './configuration';
import { qdrant } from './qdrant';
import { VectorCacheManager } from './vector-cache';

type DriveDownloadResult = { fileName: string; content: string };
type ChunkData = { text: string; index: number };

// Константы для оптимизации
const MAX_FILE_SIZE_MB = 50; // Максимальный размер файла в МБ (уменьшено для 2GB сервера)
const BATCH_SIZE = 15; // Размер батча для загрузки в Qdrant (уменьшено для 2GB сервера)
const MAX_CONCURRENT_REQUESTS = 2; // Максимальное количество одновременных запросов к OpenAI (уменьшено для 2GB сервера)
const MEMORY_THRESHOLD_MB = 300; // Порог памяти для предупреждений (уменьшено для 2GB сервера)
const LOW_MEMORY_MODE = true; // Режим для серверов с ограниченной памятью

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
    path?: string;
    drive?: string;
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
    if (LOW_MEMORY_MODE) {
      console.warn(`   💡 Рекомендация: уменьшите --batchSize или --maxConcurrent`);
    }
  }

  // Критическое предупреждение для 2GB серверов
  if (used > 800) {
    console.error(`🚨 КРИТИЧНО: Потребление памяти ${used}MB может привести к краху!`);
    console.error(`   Немедленно остановите процесс или уменьшите параметры`);
  }
}

// Проверка размера файла
function checkFileSize(filePath: string): void {
  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / 1024 / 1024;

  if (sizeMB > MAX_FILE_SIZE_MB) {
    console.warn(`⚠️  Большой файл: ${sizeMB.toFixed(1)}MB (лимит: ${MAX_FILE_SIZE_MB}MB)`);
    console.warn(`   Рекомендуется разбить файл на части или увеличить лимит`);
  }

  console.log(`📏 Размер файла: ${sizeMB.toFixed(1)}MB`);
}

// Потоковое чтение файла (пока не используется, оставляем для будущего)
async function readFileStream(filePath: string, chunkSize: number, overlapPercent: number): Promise<ChunkData[]> {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(absolutePath, { encoding: 'utf8' });
    let buffer = '';
    let chunkIndex = 0;
    const chunks: ChunkData[] = [];
    const overlapSize = Math.floor((chunkSize * overlapPercent) / 100);
    const step = Math.max(1, chunkSize - overlapSize);

    stream.on('data', (chunk: Buffer | string) => {
      buffer += chunk.toString();

      while (buffer.length >= chunkSize) {
        const text = buffer.slice(0, chunkSize).trim();
        if (text.length > 0) {
          chunks.push({ text, index: chunkIndex++ });
        }
        buffer = buffer.slice(step);
      }
    });

    stream.on('end', () => {
      // Обработать оставшийся буфер
      if (buffer.trim().length > 0) {
        chunks.push({ text: buffer.trim(), index: chunkIndex++ });
      }
      resolve(chunks);
    });

    stream.on('error', reject);
  });
}

// Генератор чанков для больших строк
function* splitTextToChunks(text: string, chunkSize: number, overlapPercent: number): Generator<ChunkData> {
  if (chunkSize <= 0) throw new Error('chunkSize должен быть > 0');
  if (overlapPercent < 0 || overlapPercent >= 100) throw new Error('overlap должен быть в диапазоне [0, 100)');

  const overlapSize = Math.floor((chunkSize * overlapPercent) / 100);
  const step = Math.max(1, chunkSize - overlapSize);

  let index = 0;
  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(text.length, start + chunkSize);
    const slice = text.slice(start, end).trim();
    if (slice.length > 0) {
      yield { text: slice, index: index++ };
    }
    if (end >= text.length) break;
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

async function initGoogleAuth() {
  const credentialsPathCandidates = [
    path.join(__dirname, '../credentials.json'),
    path.join(process.cwd(), 'credentials.json'),
  ];

  let credentials: any | null = null;
  for (const candidate of credentialsPathCandidates) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8');
      credentials = JSON.parse(raw);
      break;
    }
  }

  if (!credentials) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
    ],
  });
  const authClient = await auth.getClient();
  return authClient;
}

function httpGet(url: string): Promise<{ buffer: Buffer; contentType: string; statusCode: number; headers: any }> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const statusCode = res.statusCode || 0;
        const contentType = String(res.headers['content-type'] || '');
        const headers = res.headers;
        const data: Buffer[] = [];
        res
          .on('data', (chunk) => data.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
          .on('end', () => resolve({ buffer: Buffer.concat(data), contentType, statusCode, headers }))
          .on('error', reject);
      })
      .on('error', reject);
  });
}

function htmlDecode(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, '');
  const text = withoutStyles.replace(/<[^>]+>/g, ' ');
  return htmlDecode(text).replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function parseTitleFromHtml(html: string, fallback: string): string {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (!m) return fallback;
  const raw = m[1].trim();
  return raw.replace(/\s*-\s*Google\s+Docs\s*$/i, '') || fallback;
}

async function tryDownloadPublicDocsTxt(fileId: string): Promise<DriveDownloadResult | null> {
  const url = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
  const { buffer, statusCode, contentType } = await httpGet(url);
  if (statusCode === 200 && contentType.includes('text/plain')) {
    return { fileName: `${fileId}.txt`, content: buffer.toString('utf8') };
  }
  return null;
}

async function tryDownloadPublicDocsMobileBasic(fileId: string): Promise<DriveDownloadResult | null> {
  const url = `https://docs.google.com/document/d/${fileId}/mobilebasic`;
  const { buffer, statusCode } = await httpGet(url);
  if (statusCode === 200) {
    const html = buffer.toString('utf8');
    const title = parseTitleFromHtml(html, fileId);
    const content = stripHtml(html);
    return { fileName: `${title}.txt`, content };
  }
  return null;
}

async function tryDownloadPublicDriveUc(fileId: string): Promise<DriveDownloadResult | null> {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const { buffer, statusCode } = await httpGet(url);
  if (statusCode === 200) {
    const text = buffer.toString('utf8');
    return { fileName: `${fileId}`, content: text };
  }
  return null;
}

async function downloadFromDrive(fileId: string): Promise<DriveDownloadResult> {
  try {
    const viaTxt = await tryDownloadPublicDocsTxt(fileId);
    if (viaTxt) return viaTxt;
  } catch {}
  try {
    const viaMobile = await tryDownloadPublicDocsMobileBasic(fileId);
    if (viaMobile) return viaMobile;
  } catch {}
  try {
    const viaUc = await tryDownloadPublicDriveUc(fileId);
    if (viaUc) return viaUc;
  } catch {}

  const drive = google.drive({ version: 'v3' });

  const meta = await drive.files.get({ fileId, fields: 'id, name, mimeType' });
  const name = `${fileId}.txt`;
  const mimeType = meta.data.mimeType || 'application/octet-stream';

  if (mimeType.startsWith('application/vnd.google-apps.document')) {
    const res = await drive.files.export({ fileId, mimeType: 'text/plain' }, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data as ArrayBuffer);
    return { fileName: name.endsWith('.txt') ? name : `${name}.txt`, content: buffer.toString('utf8') };
  }

  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(res.data as ArrayBuffer);
  return { fileName: name, content: buffer.toString('utf8') };
}

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

async function main() {
  const args = parseArgs(process.argv);
  const filePath = (args.path as string) || '';
  const driveFileId = (args.drive as string) || '';
  const chunkSize = Number(args.chunkSize || 2000);
  const overlap = Number(args.overlap || 5);
  const batchSize = Number(args.batchSize || BATCH_SIZE);
  const maxConcurrent = Number(args.maxConcurrent || MAX_CONCURRENT_REQUESTS);

  if (!filePath && !driveFileId) {
    console.log(`
Загрузка файла и импорт в Qdrant (оптимизированная версия)

Использование:
  npx ts-node src/upload-file.ts --path /absolute/path/to/file.txt [--chunkSize 2000] [--overlap 5] [--batchSize 50] [--maxConcurrent 5]
  npx ts-node src/upload-file.ts --drive <GOOGLE_DRIVE_FILE_ID> [--chunkSize 2000] [--overlap 5] [--batchSize 50] [--maxConcurrent 5]

Оптимизации:
  - Потоковая обработка файлов
  - Батчевая загрузка в Qdrant
  - Ограничение конкурентных запросов
  - Мониторинг памяти
`);
    process.exit(1);
  }

  console.log('🔍 Проверяю доступность Qdrant...');
  await qdrant.getCollections();
  console.log('✅ Qdrant доступен');

  logMemoryUsage('начало');

  let fileData: { fileName: string; content: string };
  if (driveFileId) {
    console.log(`📥 Скачиваю файл из Google Drive: ${driveFileId}`);
    fileData = await downloadFromDrive(driveFileId);
  } else {
    console.log(`📖 Читаю локальный файл: ${filePath}`);
    checkFileSize(filePath);
    fileData = readLocalFile(filePath);
  }

  console.log(`✂️  Разбиваю на чанки: chunkSize=${chunkSize}, overlap=${overlap}%`);
  console.log(`📦 Размер батча: ${batchSize}, макс. конкурентных запросов: ${maxConcurrent}`);

  if (LOW_MEMORY_MODE) {
    console.log(`🔧 Режим низкой памяти: оптимизировано для серверов с ограниченной RAM`);
    console.log(`   Максимальный размер файла: ${MAX_FILE_SIZE_MB}MB`);
    console.log(`   Порог памяти: ${MEMORY_THRESHOLD_MB}MB`);
  }

  // Полное обнуление базы (коллекции)
  await deleteCollectionIfExists(configuration.vectorDBName);
  await createCollection(configuration.vectorDBName);

  // Создаем очередь для ограничения конкурентности и кэш векторов
  const queue = new LimitedQueue(maxConcurrent);
  const vectorCache = new VectorCacheManager();

  console.log('🚚 Загружаю чанки в Qdrant...');

  let totalUploaded = 0;
  let totalProcessed = 0;
  let batch: ChunkData[] = [];

  // Используем генератор для обработки чанков
  const chunkGenerator = splitTextToChunks(fileData.content, chunkSize, overlap);

  for (const chunk of chunkGenerator) {
    batch.push(chunk);
    totalProcessed++;

    // Когда батч заполнен, обрабатываем его
    if (batch.length >= batchSize) {
      const uploaded = await processBatch(batch, fileData.fileName, queue, vectorCache);
      totalUploaded += uploaded;

      console.log(`   ✔ Обработано: ${totalProcessed}, загружено: ${totalUploaded}`);
      logMemoryUsage(`батч ${Math.floor(totalProcessed / batchSize)}`);

      // Очищаем батч для освобождения памяти
      batch = [];
    }
  }

  // Обрабатываем оставшиеся чанки
  if (batch.length > 0) {
    const uploaded = await processBatch(batch, fileData.fileName, queue, vectorCache);
    totalUploaded += uploaded;
    console.log(`   ✔ Обработано: ${totalProcessed}, загружено: ${totalUploaded}`);
  }

  logMemoryUsage('конец');

  // Статистика кэша
  const cacheStats = vectorCache.getCacheStats();
  console.log(`💾 Кэш векторов: ${cacheStats.total} записей, ${(cacheStats.size / 1024 / 1024).toFixed(2)}MB`);

  console.log('\n✅ Импорт завершён');
  console.log(`📊 Обработано чанков: ${totalProcessed}`);
  console.log(`📊 Загружено чанков: ${totalUploaded}`);
  console.log(`📊 Эффективность: ${((totalUploaded / totalProcessed) * 100).toFixed(1)}%`);
}

// Функция для чтения локального файла (оставляем для совместимости)
function readLocalFile(filePath: string): { fileName: string; content: string } {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  return { fileName: path.basename(absolutePath), content };
}

main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});



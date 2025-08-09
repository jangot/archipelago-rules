#!/usr/bin/env node

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';

import { configuration } from './configuration';
import { qdrant } from './qdrant';
import { getEmbedding } from './openai-api';

type DriveDownloadResult = { fileName: string; content: string };

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
    overlap?: string | number; // percent
  };
}

function readLocalFile(filePath: string): { fileName: string; content: string } {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  return { fileName: path.basename(absolutePath), content };
}

async function initGoogleAuth() {
  // credentials.json располагается в корне проекта (как в google-docs-sync.js)
  // При запуске через ts-node __dirname указывает на src/, поэтому поднимаемся на уровень выше
  const credentialsPathCandidates = [
    path.join(__dirname, '../credentials.json'), // запуск через ts-node
    path.join(process.cwd(), 'credentials.json'), // запуск из корня
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
    // Нет credentials — вернём null, чтобы можно было использовать публичные эндпоинты
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
  // Обычно в title есть " - Google Docs"
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
    // Может вернуть HTML для подтверждения. Оставим как есть — пользователь может дать другой источник.
    const text = buffer.toString('utf8');
    return { fileName: `${fileId}`, content: text };
  }
  return null;
}

async function downloadFromDrive(fileId: string): Promise<DriveDownloadResult> {
  // Сначала пробуем публичные эндпоинты без аутентификации
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

  // Публичные не сработали — пробуем через API, если есть credentials
  // const auth = await initGoogleAuth();
  // if (!auth) {
  //   throw new Error('Не удалось скачать публично. Убедитесь, что файл доступен по ссылке без авторизации, или добавьте credentials.json.');
  // }
  const drive = google.drive({ version: 'v3' });

  // Узнаём mimeType и имя файла
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
function splitTextToOverlappingChunks(text: string, chunkSize: number, overlapPercent: number): string[] {
  if (chunkSize <= 0) throw new Error('chunkSize должен быть > 0');
  if (overlapPercent < 0 || overlapPercent >= 100) throw new Error('overlap должен быть в диапазоне [0, 100)');

  const overlapSize = Math.floor((chunkSize * overlapPercent) / 100);
  const step = Math.max(1, chunkSize - overlapSize);

  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(text.length, start + chunkSize);
    const slice = text.slice(start, end).trim();
    if (slice.length > 0) {
      chunks.push(slice);
    }
    if (end >= text.length) break;
  }
  return chunks;
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

async function main() {
  const args = parseArgs(process.argv);
  const filePath = (args.path as string) || '';
  const driveFileId = (args.drive as string) || '';
  const chunkSize = Number(args.chunkSize || 2000);
  const overlap = Number(args.overlap || 5);

  if (!filePath && !driveFileId) {
    console.log(`
Загрузка файла и импорт в Qdrant

Использование:
  npx ts-node src/upload-file.ts --path /absolute/path/to/file.txt [--chunkSize 2000] [--overlap 5]
  npx ts-node src/upload-file.ts --drive <GOOGLE_DRIVE_FILE_ID> [--chunkSize 2000] [--overlap 5]
`);
    process.exit(1);
  }

  console.log('🔍 Проверяю доступность Qdrant...');
  await qdrant.getCollections();
  console.log('✅ Qdrant доступен');

  let fileData: { fileName: string; content: string };
  if (driveFileId) {
    console.log(`📥 Скачиваю файл из Google Drive: ${driveFileId}`);
    fileData = await downloadFromDrive(driveFileId);
  } else {
    console.log(`📖 Читаю локальный файл: ${filePath}`);
    fileData = readLocalFile(filePath);
  }

  console.log(`✂️  Разбиваю на чанки: chunkSize=${chunkSize}, overlap=${overlap}%`);
  const chunks = splitTextToOverlappingChunks(fileData.content, chunkSize, overlap);
  console.log(`🧩 Получено чанков: ${chunks.length}`);

  // Полное обнуление базы (коллекции)
  await deleteCollectionIfExists(configuration.vectorDBName);
  await createCollection(configuration.vectorDBName);

  console.log('🚚 Загружаю чанки в Qdrant...');
  let uploaded = 0;
  for (let i = 0; i < chunks.length; i++) {
    const body = chunks[i];
    try {
      const vector = await getEmbedding(body);
      await qdrant.upsert(configuration.vectorDBName, {
        points: [
          {
            id: uuidv4(),
            vector,
            payload: {
              text: body,
              headers: [fileData.fileName],
              section: 'IMPORT',
              chapter: fileData.fileName,
              file: fileData.fileName,
              index: i,
            },
          },
        ],
      });
      uploaded++;
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        console.log(`   ✔ Загружено: ${i + 1}/${chunks.length}`);
      }
    } catch (e) {
      console.error(`   ❌ Ошибка при загрузке чанка ${i + 1}:`, e);
    }
  }

  console.log('\n✅ Импорт завершён');
  console.log(`📊 Загружено чанков: ${uploaded}/${chunks.length}`);
}

main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});



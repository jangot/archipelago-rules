import * as fs from 'fs';
import * as path from 'path';
import { getEmbedding } from './openai-api';

interface CachedVector {
  text: string;
  vector: number[];
  timestamp: number;
}

interface VectorCache {
  vectors: Record<string, CachedVector>;
  metadata: {
    version: string;
    created: number;
    lastUpdated: number;
  };
}

export class VectorCacheManager {
  private cacheFile: string;
  private cache: VectorCache;
  private maxCacheSize: number;
  private cacheExpiryDays: number;

  constructor(cacheDir: string = './cache', maxCacheSize: number = 10000, cacheExpiryDays: number = 30) {
    this.cacheFile = path.join(cacheDir, 'vector-cache.json');
    this.maxCacheSize = maxCacheSize;
    this.cacheExpiryDays = cacheExpiryDays;
    this.cache = this.loadCache();
  }

  private loadCache(): VectorCache {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const cache = JSON.parse(data) as VectorCache;

        // Проверяем срок действия кэша
        const now = Date.now();
        const expiryTime = this.cacheExpiryDays * 24 * 60 * 60 * 1000;

        if (now - cache.metadata.lastUpdated > expiryTime) {
          console.log('🗑️  Кэш векторов устарел, очищаю...');
          return this.createNewCache();
        }

        return cache;
      }
    } catch (error) {
      console.warn('⚠️  Ошибка загрузки кэша векторов:', error);
    }

    return this.createNewCache();
  }

  private createNewCache(): VectorCache {
    return {
      vectors: {},
      metadata: {
        version: '1.0',
        created: Date.now(),
        lastUpdated: Date.now(),
      },
    };
  }

  private saveCache(): void {
    try {
      const cacheDir = path.dirname(this.cacheFile);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      this.cache.metadata.lastUpdated = Date.now();
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.warn('⚠️  Ошибка сохранения кэша векторов:', error);
    }
  }

  private getTextHash(text: string): string {
    // Простой хеш для текста
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Преобразуем в 32-битное целое
    }
    return hash.toString(36);
  }

  private cleanupCache(): void {
    const entries = Object.entries(this.cache.vectors);
    if (entries.length > this.maxCacheSize) {
      // Удаляем самые старые записи
      const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sortedEntries.slice(0, entries.length - this.maxCacheSize);

      toRemove.forEach(([key]) => {
        delete this.cache.vectors[key];
      });

      console.log(`🧹 Очистил кэш: удалено ${toRemove.length} старых записей`);
    }
  }

  async getVector(text: string): Promise<number[]> {
    const hash = this.getTextHash(text);

    // Проверяем кэш
    if (this.cache.vectors[hash] && this.cache.vectors[hash].text === text) {
      console.log(`💾 Вектор найден в кэше для текста длиной ${text.length}`);
      return this.cache.vectors[hash].vector;
    }

    // Получаем новый вектор
    console.log(`🔄 Получаю новый вектор для текста длиной ${text.length}`);
    const vector = await getEmbedding(text);

    // Сохраняем в кэш
    this.cache.vectors[hash] = {
      text,
      vector,
      timestamp: Date.now(),
    };

    this.cleanupCache();
    this.saveCache();

    return vector;
  }

  getCacheStats(): { total: number; size: number } {
    const total = Object.keys(this.cache.vectors).length;
    const size = fs.existsSync(this.cacheFile) ? fs.statSync(this.cacheFile).size : 0;
    return { total, size };
  }

  clearCache(): void {
    this.cache = this.createNewCache();
    this.saveCache();
    console.log('🗑️  Кэш векторов очищен');
  }
}

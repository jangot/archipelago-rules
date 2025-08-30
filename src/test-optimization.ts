#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { VectorCacheManager } from './vector-cache';
import { PerformanceMonitor } from './performance-monitor';

interface TestResult {
  testName: string;
  duration: number;
  memoryPeak: number;
  memoryAverage: number;
  success: boolean;
  error?: string;
}

class OptimizationTester {
  private testResults: TestResult[] = [];
  private testData: string;

  constructor() {
    this.testData = this.generateTestData();
  }

  private generateTestData(): string {
    // Генерируем тестовые данные разного размера
    const paragraphs = [
      "Это тестовый параграф для проверки оптимизации скрипта загрузки файлов. " +
      "Он содержит достаточно текста для создания реалистичных чанков и тестирования " +
      "производительности системы кэширования векторов.",

      "Второй параграф демонстрирует различные аспекты обработки текста, включая " +
      "разбивку на чанки, вычисление эмбеддингов и загрузку в векторную базу данных. " +
      "Это помогает оценить эффективность оптимизаций.",

      "Третий параграф содержит техническую информацию о реализации батчевой обработки, " +
      "ограничениях конкурентности и мониторинге памяти. Эти функции критически важны " +
      "для стабильной работы с большими файлами."
    ];

    // Создаем большой текст, повторяя параграфы
    let result = '';
    for (let i = 0; i < 1000; i++) {
      result += paragraphs[i % paragraphs.length] + '\n\n';
    }

    return result;
  }

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024);
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
    console.log(`🧪 Запуск теста: ${testName}`);

    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();
    const memoryReadings: number[] = [startMemory];

    // Мониторинг памяти каждые 100мс
    const memoryInterval = setInterval(() => {
      memoryReadings.push(this.getMemoryUsage());
    }, 100);

    try {
      await testFn();

      clearInterval(memoryInterval);

      const duration = Date.now() - startTime;
      const memoryPeak = Math.max(...memoryReadings);
      const memoryAverage = Math.round(memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length);

      const result: TestResult = {
        testName,
        duration,
        memoryPeak,
        memoryAverage,
        success: true
      };

      console.log(`✅ Тест завершен: ${duration}мс, память: ${memoryPeak}MB (пик), ${memoryAverage}MB (среднее)`);
      return result;

    } catch (error) {
      clearInterval(memoryInterval);

      const result: TestResult = {
        testName,
        duration: Date.now() - startTime,
        memoryPeak: Math.max(...memoryReadings),
        memoryAverage: Math.round(memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      console.log(`❌ Тест провален: ${result.error}`);
      return result;
    }
  }

  async testVectorCache(): Promise<void> {
    const cache = new VectorCacheManager('./test-cache');

    // Тестируем кэширование
    const text1 = "Тестовый текст для кэширования";
    const text2 = "Другой тестовый текст";

    // Первый запрос - должен создать кэш
    await cache.getVector(text1);

    // Второй запрос - должен использовать кэш
    await cache.getVector(text1);

    // Новый текст - должен создать новую запись
    await cache.getVector(text2);

    const stats = cache.getCacheStats();
    console.log(`📊 Кэш содержит ${stats.total} записей`);

    // Очищаем тестовый кэш
    cache.clearCache();
  }

  async testPerformanceMonitor(): Promise<void> {
    const monitor = new PerformanceMonitor('./test-metrics');

    // Симулируем обработку батчей
    for (let i = 0; i < 5; i++) {
      monitor.startBatch(50, 5);

      // Симулируем время обработки
      await new Promise(resolve => setTimeout(resolve, 100));

      monitor.endBatch(50, 48); // 2 ошибки
    }

    const report = monitor.getPerformanceReport();
    console.log(`📈 Отчет производительности: ${report.averageSpeed} чанков/с, ${report.averageMemory}MB памяти`);
  }

  async testMemoryEfficiency(): Promise<void> {
    // Тестируем эффективность использования памяти
    const largeText = this.testData;
    const chunks: string[] = [];

    // Разбиваем на чанки (имитируем оригинальный подход)
    const chunkSize = 2000;
    const overlap = 5;
    const overlapSize = Math.floor((chunkSize * overlap) / 100);
    const step = Math.max(1, chunkSize - overlapSize);

    for (let start = 0; start < largeText.length; start += step) {
      const end = Math.min(largeText.length, start + chunkSize);
      const slice = largeText.slice(start, end).trim();
      if (slice.length > 0) {
        chunks.push(slice);
      }
      if (end >= largeText.length) break;
    }

    console.log(`📝 Создано ${chunks.length} чанков из текста размером ${(largeText.length / 1024 / 1024).toFixed(2)}MB`);

    // Симулируем обработку батчами
    const batchSize = 50;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Симулируем обработку батча
      await new Promise(resolve => setTimeout(resolve, 50));

      if (i % (batchSize * 10) === 0) {
        console.log(`   Обработано ${Math.min(i + batchSize, chunks.length)}/${chunks.length} чанков`);
      }
    }
  }

  async testConcurrentLimiting(): Promise<void> {
    // Тестируем ограничение конкурентности
    const maxConcurrent = 3;
    const totalTasks = 10;
    let running = 0;
    let completed = 0;

    const tasks = Array.from({ length: totalTasks }, (_, i) => async () => {
      running++;
      console.log(`   Задача ${i + 1} запущена (активных: ${running})`);

      // Симулируем работу
      await new Promise(resolve => setTimeout(resolve, 200));

      running--;
      completed++;
      console.log(`   Задача ${i + 1} завершена (активных: ${running}, завершено: ${completed})`);
    });

    // Ограниченная очередь
    const queue = tasks.slice();
    const workers: Promise<void>[] = [];

    for (let i = 0; i < maxConcurrent; i++) {
      workers.push(this.worker(queue));
    }

    await Promise.all(workers);
    console.log(`✅ Все ${totalTasks} задач завершены`);
  }

  private async worker(queue: (() => Promise<void>)[]): Promise<void> {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) {
        await task();
      }
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Запуск тестов оптимизации...\n');

    this.testResults = [
      await this.runTest('Кэширование векторов', () => this.testVectorCache()),
      await this.runTest('Мониторинг производительности', () => this.testPerformanceMonitor()),
      await this.runTest('Эффективность памяти', () => this.testMemoryEfficiency()),
      await this.runTest('Ограничение конкурентности', () => this.testConcurrentLimiting()),
    ];

    this.printResults();
    this.cleanup();
  }

  private printResults(): void {
    console.log('\n📊 Результаты тестов:');
    console.log('='.repeat(80));

    const successful = this.testResults.filter(r => r.success);
    const failed = this.testResults.filter(r => !r.success);

    console.log(`✅ Успешных тестов: ${successful.length}`);
    console.log(`❌ Проваленных тестов: ${failed.length}\n`);

    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.testName}`);
      console.log(`   Время: ${result.duration}мс`);
      console.log(`   Память: ${result.memoryPeak}MB (пик), ${result.memoryAverage}MB (среднее)`);
      if (result.error) {
        console.log(`   Ошибка: ${result.error}`);
      }
      console.log('');
    });

    if (successful.length > 0) {
      const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
      const avgMemory = successful.reduce((sum, r) => sum + r.memoryAverage, 0) / successful.length;

      console.log(`📈 Средние показатели успешных тестов:`);
      console.log(`   Время: ${Math.round(avgDuration)}мс`);
      console.log(`   Память: ${Math.round(avgMemory)}MB`);
    }
  }

  private cleanup(): void {
    // Удаляем тестовые файлы
    const testDirs = ['./test-cache', './test-metrics'];

    testDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🧹 Удален тестовый каталог: ${dir}`);
      }
    });
  }
}

// Запуск тестов
async function main() {
  const tester = new OptimizationTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Ошибка при запуске тестов:', error);
    process.exit(1);
  });
}

import * as fs from 'fs';
import * as path from 'path';

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  processingSpeed: number; // чанков в секунду
  batchSize: number;
  maxConcurrent: number;
  fileSize: number;
  totalChunks: number;
  successRate: number;
}

export class PerformanceMonitor {
  private metricsFile: string;
  private startTime: number;
  private metrics: PerformanceMetrics[] = [];
  private currentBatchStart: number;
  private processedChunks: number = 0;

  constructor(metricsDir: string = './metrics') {
    this.metricsFile = path.join(metricsDir, 'performance-metrics.json');
    this.startTime = Date.now();
    this.currentBatchStart = this.startTime;
    this.loadMetrics();
  }

  private loadMetrics(): void {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        this.metrics = JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️  Ошибка загрузки метрик производительности:', error);
    }
  }

  private saveMetrics(): void {
    try {
      const metricsDir = path.dirname(this.metricsFile);
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.warn('⚠️  Ошибка сохранения метрик производительности:', error);
    }
  }

  startBatch(batchSize: number, maxConcurrent: number): void {
    this.currentBatchStart = Date.now();
  }

  endBatch(processed: number, successful: number): void {
    const batchTime = (Date.now() - this.currentBatchStart) / 1000; // секунды
    const processingSpeed = processed / batchTime;
    const successRate = (successful / processed) * 100;

    this.processedChunks += processed;

    const memoryUsage = this.getMemoryUsage();

    this.metrics.push({
      timestamp: Date.now(),
      memoryUsage,
      processingSpeed,
      batchSize: processed,
      maxConcurrent: 0, // будет заполнено позже
      fileSize: 0, // будет заполнено позже
      totalChunks: this.processedChunks,
      successRate,
    });

    this.saveMetrics();
  }

  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    const usage = process.memoryUsage();
    const used = Math.round(usage.heapUsed / 1024 / 1024);
    const total = Math.round(usage.heapTotal / 1024 / 1024);
    const percentage = Math.round((used / total) * 100);
    return { used, total, percentage };
  }

  getOptimalParameters(fileSize: number, totalChunks: number): {
    batchSize: number;
    maxConcurrent: number;
    chunkSize: number;
  } {
    // Анализируем исторические данные для оптимизации
    const recentMetrics = this.metrics
      .filter(m => m.timestamp > Date.now() - 24 * 60 * 60 * 1000) // последние 24 часа
      .sort((a, b) => b.processingSpeed - a.processingSpeed);

    if (recentMetrics.length === 0) {
      // Нет данных - используем консервативные значения
      return {
        batchSize: Math.min(50, Math.ceil(totalChunks / 10)),
        maxConcurrent: 3,
        chunkSize: 2000,
      };
    }

    // Находим лучшие параметры по скорости обработки
    const bestMetrics = recentMetrics[0];

    // Адаптируем под размер файла
    let optimalBatchSize = bestMetrics.batchSize;
    let optimalConcurrent = 5;

    if (fileSize > 50 * 1024 * 1024) { // > 50MB
      optimalBatchSize = Math.min(optimalBatchSize, 30);
      optimalConcurrent = 3;
    } else if (fileSize > 10 * 1024 * 1024) { // > 10MB
      optimalBatchSize = Math.min(optimalBatchSize, 40);
      optimalConcurrent = 4;
    }

    return {
      batchSize: optimalBatchSize,
      maxConcurrent: optimalConcurrent,
      chunkSize: 2000,
    };
  }

  getPerformanceReport(): {
    averageSpeed: number;
    averageMemory: number;
    totalRuns: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageSpeed: 0,
        averageMemory: 0,
        totalRuns: 0,
        recommendations: ['Нет данных для анализа'],
      };
    }

    const averageSpeed = this.metrics.reduce((sum, m) => sum + m.processingSpeed, 0) / this.metrics.length;
    const averageMemory = this.metrics.reduce((sum, m) => sum + m.memoryUsage.used, 0) / this.metrics.length;
    const totalRuns = this.metrics.length;

    const recommendations: string[] = [];

    if (averageMemory > 500) {
      recommendations.push('Высокое потребление памяти - рассмотрите уменьшение размера батча');
    }

    if (averageSpeed < 5) {
      recommendations.push('Низкая скорость обработки - увеличьте количество конкурентных запросов');
    }

    const recentFailures = this.metrics
      .filter(m => m.timestamp > Date.now() - 60 * 60 * 1000) // последний час
      .filter(m => m.successRate < 95);

    if (recentFailures.length > 0) {
      recommendations.push('Обнаружены ошибки обработки - проверьте стабильность сети');
    }

    return {
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      averageMemory: Math.round(averageMemory),
      totalRuns,
      recommendations,
    };
  }

  logCurrentStatus(): void {
    const memoryUsage = this.getMemoryUsage();
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = this.processedChunks / elapsed;

    console.log(`📊 Статус: ${this.processedChunks} чанков за ${elapsed.toFixed(1)}с (${speed.toFixed(1)}/с)`);
    console.log(`💾 Память: ${memoryUsage.used}MB/${memoryUsage.total}MB (${memoryUsage.percentage}%)`);
  }
}

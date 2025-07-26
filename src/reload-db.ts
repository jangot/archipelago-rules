#!/usr/bin/env node

import { spawn } from 'child_process';
import { configuration } from './configuration';

console.log('🔄 Запуск перезагрузки данных в векторной базе...');
console.log(`📚 База данных: ${configuration.vectorDBName}`);
console.log(`🔗 Qdrant URL: ${configuration.qdrantUrl}`);

// Устанавливаем переменную окружения для принудительной перезагрузки
process.env.FORCE_RELOAD = 'true';

// Запускаем основной скрипт загрузки
const child = spawn('npx', ['ts-node', 'src/upload-db.ts'], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Перезагрузка данных завершена успешно!');
    } else {
        console.error(`\n❌ Перезагрузка данных завершена с ошибкой (код: ${code})`);
        process.exit(code || 1);
    }
});

child.on('error', (error) => {
    console.error('❌ Ошибка при запуске скрипта:', error);
    process.exit(1);
});
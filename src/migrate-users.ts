import { configuration } from './configuration';
import { userAccessManager } from './user-access';

async function migrateUsersFromEnv() {
    console.log('🔄 Миграция пользователей из .env в базу данных...');

    const kingsFromEnv = configuration.kings;
    console.log(`📋 Найдено ${kingsFromEnv.length} пользователей в .env:`, kingsFromEnv);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const [i, king] of kingsFromEnv.entries()) {
        if (!king.trim()) continue;

        // Определяем, это ID или username
        const isNumeric = /^\d+$/.test(king.trim());
        const isAdmin = i === 0; // Первый — админ

        if (isNumeric) {
            // Это ID пользователя
            const success = userAccessManager.addUser({
                id: king.trim(),
                addedBy: 'system-migration'
            }, 'system-migration', isAdmin);

            if (success) {
                migratedCount++;
                console.log(`✅ Добавлен пользователь с ID: ${king.trim()}${isAdmin ? ' (админ)' : ''}`);
            } else {
                skippedCount++;
                console.log(`⚠️  Пользователь с ID ${king.trim()} уже существует`);
            }
        } else {
            // Это username
            const success = userAccessManager.addUser({
                id: '', // ID будет пустым, будем искать по username
                username: king.trim(),
                addedBy: 'system-migration'
            }, 'system-migration', isAdmin);

            if (success) {
                migratedCount++;
                console.log(`✅ Добавлен пользователь с username: ${king.trim()}${isAdmin ? ' (админ)' : ''}`);
            } else {
                skippedCount++;
                console.log(`⚠️  Пользователь с username ${king.trim()} уже существует`);
            }
        }
    }

    const stats = userAccessManager.getStats();

    console.log('\n📊 Результаты миграции:');
    console.log(`   - Успешно мигрировано: ${migratedCount}`);
    console.log(`   - Пропущено (уже существуют): ${skippedCount}`);
    console.log(`   - Всего в базе: ${stats.total}`);
    console.log(`   - Активных: ${stats.active}`);
    console.log(`   - Неактивных: ${stats.inactive}`);

    console.log('\n📁 База данных сохранена в: data/users.json');
    console.log('✅ Миграция завершена!');
}

// Запускаем миграцию
migrateUsersFromEnv().catch((error) => {
    console.error('❌ Ошибка при миграции:', error);
    process.exit(1);
});
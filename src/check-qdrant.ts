import { qdrant } from './qdrant';
import { configuration } from './configuration';

async function checkQdrantConnection() {
    console.log('🔍 Проверка подключения к Qdrant...');
    console.log(`📍 URL: ${configuration.qdrantUrl}`);

    try {
                // Проверяем доступность сервера
        const collectionsResponse = await qdrant.getCollections();
        console.log('✅ Qdrant сервер доступен');
        console.log(`📚 Найдено коллекций: ${collectionsResponse.collections.length}`);

        if (collectionsResponse.collections.length > 0) {
            console.log('\n📋 Список коллекций:');
            collectionsResponse.collections.forEach((collection: any) => {
                console.log(`   - ${collection.name} (${collection.vectors_count || 0} векторов)`);
            });
        }

        // Проверяем целевую коллекцию
        try {
            const targetCollection = await qdrant.getCollection(configuration.vectorDBName);
            console.log(`\n✅ Целевая коллекция "${configuration.vectorDBName}" существует`);
            console.log(`   Векторов: ${targetCollection.vectors_count || 0}`);
            if (targetCollection.config?.params?.vectors) {
                console.log(`   Размер векторов: ${targetCollection.config.params.vectors.size}`);
                console.log(`   Метрика расстояния: ${targetCollection.config.params.vectors.distance}`);
            }
        } catch (error) {
            console.log(`\n⚠️  Целевая коллекция "${configuration.vectorDBName}" не найдена`);
            console.log('   Это нормально, если вы ещё не запускали импорт');
        }

    } catch (error) {
        console.error('❌ Ошибка подключения к Qdrant:', error);
        console.log('\n🔧 Возможные решения:');
        console.log('   1. Убедитесь, что Qdrant сервер запущен');
        console.log('   2. Проверьте URL в файле .env');
        console.log('   3. Проверьте сетевое подключение');
        console.log('   4. Для локального запуска используйте: docker run -p 6333:6333 qdrant/qdrant');
    }
}

checkQdrantConnection().catch((error) => {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
});
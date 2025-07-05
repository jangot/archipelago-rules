import { v4 as uuidv4 } from 'uuid';

import { qdrant } from './qdrant';
import { configuration } from './configuration';
import { getAllMarkdownFiles, splitMarkdownToChunks, Chunk } from './read-md';
import { getEmbedding } from './openai-api'

async function checkServices() {
    console.log('🔍 Проверяю доступность сервисов...');

    // Проверяем Qdrant
    try {
        await qdrant.getCollections();
        console.log('✅ Qdrant доступен');
    } catch (error) {
        console.error('❌ Qdrant недоступен:', error);
        throw new Error('Qdrant сервер недоступен. Убедитесь, что сервер запущен и доступен по адресу: ' + configuration.qdrantUrl);
    }

    // Проверяем OpenAI API
    try {
        await getEmbedding('test');
        console.log('✅ OpenAI API доступен');
    } catch (error) {
        console.error('❌ OpenAI API недоступен:', error);
        throw new Error('OpenAI API недоступен. Проверьте API ключ и подключение к интернету.');
    }
}

async function main() {
    console.log('🚀 Запуск импорта markdown файлов в векторную базу данных...');

    // Проверяем доступность сервисов
    await checkServices();

    // Получаем все MD файлы из папки rules
    const mdFiles = getAllMarkdownFiles('./rules');
    console.log(`📁 Найдено ${mdFiles.length} MD файлов`);

    if (mdFiles.length === 0) {
        console.error('❌ Не найдено ни одного markdown файла в папке ./rules');
        return;
    }

    try {
        // Проверяем существование коллекции
        try {
            await qdrant.getCollection(configuration.vectorDBName);
            console.log('📚 Коллекция уже существует');

            // Спрашиваем пользователя, хочет ли он перезаписать коллекцию
            console.log('⚠️  Коллекция уже существует. Для перезаписи удалите её вручную или измените VECTOR_DB_NAME в .env');
            return;
        } catch {
            // Коллекция не существует, создаём новую
            await qdrant.createCollection(configuration.vectorDBName, {
                vectors: {
                    size: 1536,
                    distance: 'Cosine',
                },
            });
            console.log('📚 Создана новая коллекция');
        }

        // Обрабатываем каждый файл
        let totalChunks = 0;
        let processedFiles = 0;
        let errorFiles = 0;

        for (const [fileIndex, filePath] of mdFiles.entries()) {
            console.log(`\n📄 Обрабатываю файл ${fileIndex + 1}/${mdFiles.length}: ${filePath}`);

            try {
                const chunks = splitMarkdownToChunks(filePath);
                console.log(`   📝 Найдено ${chunks.length} чанков`);

                if (chunks.length === 0) {
                    console.log(`   ⚠️  Файл не содержит чанков для обработки`);
                    continue;
                }

                // Векторизуем и загружаем чанки из текущего файла
                for (const [chunkIndex, chunk] of chunks.entries()) {
                    try {
                        const vector = await getEmbedding(chunk.body);

                        await qdrant.upsert(configuration.vectorDBName, {
                            points: [
                                {
                                    id: uuidv4(),
                                    vector,
                                    payload: {
                                        text: chunk.body,
                                        headers: chunk.headers,
                                        section: chunk.section,
                                        chapter: chunk.chapter,
                                        file: chunk.file,
                                        index: chunk.index,
                                        globalIndex: totalChunks + chunkIndex,
                                    },
                                },
                            ],
                        });

                        console.log(`   ✔ Загружен чанк ${chunkIndex + 1}/${chunks.length} (${chunk.headers.join(' > ')})`);
                    } catch (chunkError) {
                        console.error(`   ❌ Ошибка при обработке чанка ${chunkIndex + 1}:`, chunkError);
                        // Продолжаем обработку других чанков
                    }
                }

                totalChunks += chunks.length;
                processedFiles++;
            } catch (error) {
                console.error(`❌ Ошибка при обработке файла ${filePath}:`, error);
                errorFiles++;
            }
        }

        console.log(`\n✅ Импорт завершён!`);
        console.log(`📊 Статистика:`);
        console.log(`   - Обработано файлов: ${processedFiles}/${mdFiles.length}`);
        console.log(`   - Файлов с ошибками: ${errorFiles}`);
        console.log(`   - Всего загружено чанков: ${totalChunks}`);

        if (errorFiles > 0) {
            console.log(`⚠️  Некоторые файлы не были обработаны из-за ошибок`);
        }

    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
});

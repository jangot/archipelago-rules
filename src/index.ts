import { v4 as uuidv4 } from 'uuid';

import { qdrant } from './qdrant';
import { configuration } from './configuration';
import { getAllMarkdownFiles, splitMarkdownToChunks, Chunk } from './read-md';
import { getEmbedding } from './openai-api'

async function main() {
    // Получаем все MD файлы из папки sections
    const mdFiles = getAllMarkdownFiles('./sections');
    console.log(`📁 Найдено ${mdFiles.length} MD файлов`);

    try {
        await qdrant.getCollection(configuration.vectorDBName);
        console.log('📚 Коллекция уже существует');
    } catch {
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
    for (const [fileIndex, filePath] of mdFiles.entries()) {
        console.log(`\n📄 Обрабатываю файл ${fileIndex + 1}/${mdFiles.length}: ${filePath}`);

        try {
            const chunks = splitMarkdownToChunks(filePath);
            console.log(`   📝 Найдено ${chunks.length} чанков`);

            // Векторизуем и загружаем чанки из текущего файла
            for (const [chunkIndex, chunk] of chunks.entries()) {
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
            }

            totalChunks += chunks.length;
        } catch (error) {
            console.error(`❌ Ошибка при обработке файла ${filePath}:`, error);
        }
    }

    console.log(`\n✅ Импорт завершён! Всего загружено ${totalChunks} чанков из ${mdFiles.length} файлов`);
}

main().catch(console.error);

import { getAllMarkdownFiles, splitMarkdownToChunks } from './read-md';

async function testMarkdownParsing() {
    console.log('🧪 Тестирование парсинга markdown файлов...');

    // Получаем все MD файлы из папки rules
    const mdFiles = getAllMarkdownFiles('./rules');
    console.log(`📁 Найдено ${mdFiles.length} MD файлов`);

    if (mdFiles.length === 0) {
        console.error('❌ Не найдено ни одного markdown файла в папке ./rules');
        return;
    }

    let totalChunks = 0;
    let processedFiles = 0;
    let errorFiles = 0;

    // Обрабатываем первые 3 файла для тестирования
    const testFiles = mdFiles.slice(0, 3);

    for (const [fileIndex, filePath] of testFiles.entries()) {
        console.log(`\n📄 Тестирую файл ${fileIndex + 1}/${testFiles.length}: ${filePath}`);

        try {
            const chunks = splitMarkdownToChunks(filePath);
            console.log(`   📝 Найдено ${chunks.length} чанков`);

            if (chunks.length === 0) {
                console.log(`   ⚠️  Файл не содержит чанков для обработки`);
                continue;
            }

            // Показываем первые 2 чанка для демонстрации
            for (const [chunkIndex, chunk] of chunks.slice(0, 2).entries()) {
                console.log(`   📄 Чанк ${chunkIndex + 1}:`);
                console.log(`      Заголовки: ${chunk.headers.join(' > ')}`);
                console.log(`      Раздел: ${chunk.section}`);
                console.log(`      Глава: ${chunk.chapter}`);
                console.log(`      Размер текста: ${chunk.body.length} символов`);
                console.log(`      Начало текста: ${chunk.body.substring(0, 100)}...`);
                console.log('');
            }

            totalChunks += chunks.length;
            processedFiles++;
        } catch (error) {
            console.error(`❌ Ошибка при обработке файла ${filePath}:`, error);
            errorFiles++;
        }
    }

    console.log(`\n✅ Тестирование завершено!`);
    console.log(`📊 Статистика:`);
    console.log(`   - Обработано файлов: ${processedFiles}/${testFiles.length}`);
    console.log(`   - Файлов с ошибками: ${errorFiles}`);
    console.log(`   - Всего чанков: ${totalChunks}`);

    if (errorFiles === 0) {
        console.log(`🎉 Все тесты прошли успешно! Код готов к работе с Qdrant.`);
    } else {
        console.log(`⚠️  Обнаружены ошибки в парсинге файлов.`);
    }
}

testMarkdownParsing().catch((error) => {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
});

#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');
const RulesSync = require('./sync-rules');

class PublicDocsSync {
    constructor() {
        this.documentId = '1ulanNBqKru7RYQ-_dLAhQuT8U7SDCWsxQtAx39wv6lM';
        this.baseUrl = 'https://docs.google.com/document/d/';
    }

    // Получение HTML страницы документа
    async fetchDocumentHTML() {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${this.documentId}/mobilebasic`;

            https.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    // Парсинг HTML и извлечение контента
    parseDocumentContent(html) {
        // Простой парсинг без внешних зависимостей
        const sections = [];
        let currentSection = null;
        let currentContent = [];

        // Разбиваем HTML на строки для обработки
        const lines = html.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Ищем заголовки (упрощенный поиск)
            if (trimmedLine.includes('<h1>') || trimmedLine.includes('<h2>') || trimmedLine.includes('<h3>')) {
                // Сохраняем предыдущую секцию
                if (currentSection && currentContent.length > 0) {
                    sections.push({
                        title: currentSection,
                        content: currentContent.join('\n').trim()
                    });
                }

                // Извлекаем текст заголовка
                const titleMatch = trimmedLine.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/);
                if (titleMatch) {
                    currentSection = titleMatch[1].trim();
                    currentContent = [];
                }
            } else if (trimmedLine.includes('<p>') || trimmedLine.includes('<div>')) {
                // Извлекаем текст параграфа
                const textMatch = trimmedLine.match(/<[^>]*>(.*?)<\/[^>]*>/);
                if (textMatch && currentSection) {
                    const text = textMatch[1].trim();
                    if (text && text.length > 10) { // Фильтруем короткие фрагменты
                        currentContent.push(text);
                    }
                }
            }
        }

        // Добавляем последнюю секцию
        if (currentSection && currentContent.length > 0) {
            sections.push({
                title: currentSection,
                content: currentContent.join('\n').trim()
            });
        }

        return sections;
    }

    // Альтернативный метод через экспорт в HTML
    async getDocumentAsHTML() {
        const exportUrl = `https://docs.google.com/document/d/${this.documentId}/export?format=html`;

        return new Promise((resolve, reject) => {
            https.get(exportUrl, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    // Основная функция синхронизации
    async syncFromPublicDocs() {
        console.log('🔄 Начинаем синхронизацию из публичного Google Docs...');

        try {
            // Пробуем получить через экспорт HTML (более надежно)
            let htmlContent;
            try {
                console.log('📥 Получаем документ через HTML экспорт...');
                htmlContent = await this.getDocumentAsHTML();
            } catch (error) {
                console.log('⚠️ HTML экспорт не удался, пробуем через веб-страницу...');
                const pageHTML = await this.fetchDocumentHTML();
                const sections = this.parseDocumentContent(pageHTML);

                // Конвертируем секции обратно в HTML
                htmlContent = '<html><body>';
                for (const section of sections) {
                    htmlContent += `<h1>${section.title}</h1>`;
                    htmlContent += `<p>${section.content}</p>`;
                }
                htmlContent += '</body></html>';
            }

            const rulesSync = new RulesSync();
            await rulesSync.syncRules(htmlContent);

            console.log('✅ Синхронизация из публичного Google Docs завершена!');
        } catch (error) {
            console.error('❌ Ошибка синхронизации:', error.message);
            process.exit(1);
        }
    }
}

// Экспорт для использования
module.exports = PublicDocsSync;

// Если скрипт запущен напрямую
if (require.main === module) {
    const sync = new PublicDocsSync();
    sync.syncFromPublicDocs();
}
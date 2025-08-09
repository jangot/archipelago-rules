#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const RulesSync = require('./sync-rules');

class GoogleDocsSync {
    constructor() {
        this.docs = google.docs({ version: 'v1' });
        this.documentId = '1ulanNBqKru7RYQ-_dLAhQuT8U7SDCWsxQtAx39wv6lM';
    }

    // Инициализация Google API
    async initialize() {
        try {
            // Читаем credentials из файла (нужно создать)
            const credentialsPath = path.join(__dirname, '../credentials.json');
            const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/documents.readonly']
            });

            this.auth = await auth.getClient();
            console.log('✅ Google API инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации Google API:', error.message);
            throw error;
        }
    }

    // Получение содержимого документа
    async getDocumentContent() {
        try {
            const response = await this.docs.documents.get({
                auth: this.auth,
                documentId: this.documentId
            });

            return this.convertToHTML(response.data);
        } catch (error) {
            console.error('❌ Ошибка получения документа:', error.message);
            throw error;
        }
    }

    // Конвертация Google Docs в HTML
    convertToHTML(document) {
        let html = '<html><body>';

        for (const element of document.body.content) {
            if (element.paragraph) {
                const paragraph = element.paragraph;
                const text = this.extractText(paragraph.elements);

                if (paragraph.paragraphStyle && paragraph.paragraphStyle.namedStyleType) {
                    const style = paragraph.paragraphStyle.namedStyleType;

                    switch (style) {
                        case 'HEADING_1':
                            html += `<h1>${text}</h1>`;
                            break;
                        case 'HEADING_2':
                            html += `<h2>${text}</h2>`;
                            break;
                        case 'HEADING_3':
                            html += `<h3>${text}</h3>`;
                            break;
                        default:
                            html += `<p>${text}</p>`;
                    }
                } else {
                    html += `<p>${text}</p>`;
                }
            }
        }

        html += '</body></html>';
        return html;
    }

    // Извлечение текста из элементов
    extractText(elements) {
        if (!elements) return '';

        return elements.map(element => {
            if (element.textRun) {
                return element.textRun.content;
            }
            return '';
        }).join('');
    }

    // Основная функция синхронизации
    async syncFromGoogleDocs() {
        console.log('🔄 Начинаем синхронизацию из Google Docs...');

        try {
            await this.initialize();
            const htmlContent = await this.getDocumentContent();

            const rulesSync = new RulesSync();
            await rulesSync.syncRules(htmlContent);

            console.log('✅ Синхронизация из Google Docs завершена!');
        } catch (error) {
            console.error('❌ Ошибка синхронизации:', error);
            process.exit(1);
        }
    }
}

// Экспорт для использования
module.exports = GoogleDocsSync;

// Если скрипт запущен напрямую
if (require.main === module) {
    const sync = new GoogleDocsSync();
    sync.syncFromGoogleDocs();
}
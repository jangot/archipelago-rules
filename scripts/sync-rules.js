#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

// Маппинг разделов Google Docs на файлы Markdown
const SECTION_MAPPING = {
    "Предисловие": "01-predislovie.md",
    "Создание Персонажа": "02-sozdanie-personazha.md",
    "Шаг Первый: Природа персонажа": "03-shag-1-priroda.md",
    "Шаг Второй: Родина": "04-shag-2-rodina.md",
    "Шаг Третий: Атрибуты": "05-shag-3-atributy.md",
    "Шаг Четвёртый: Навыки": "06-shag-4-navyki.md",
    "Архетипы": "07-arhetipy.md",
    "Традиционный Боец": "08-tradicionnyj-boez.md",
    "Солдат": "09-soldat.md",
    "Моряк": "10-moryak.md",
    "Пройдоха": "11-projdocha.md",
    "Повеса": "12-povesa.md",
    "Навигатор": "13-navigator.md",
    "Музыкант": "14-muzykant.md",
    "Божий Человек": "15-bozhij-chelovek.md",
    "Исследователь": "16-issledovatel.md",
    "Изобретатель": "17-izobretatel.md",
    "Навыки": "18-navyki-obshchee.md",
    "Компетентность: Традиционные Виды Боя": "19-tradicionnye-vidy-boya.md",
    "Компетентность: Выносливость": "21-vynoslivost.md",
    "Компетентность: Огнестрельное": "22-ognestrelnoe.md",
    "Компетентность: Мореплавание": "23-moreplavanie.md",
    "Компетентность: Защита": "24-zashchita.md",
    "Компетентность: Ремесло": "25-remeslo.md",
    "Компетентность: Знания": "26-znaniya.md",
    "Компетентность: Социальные Интеракции": "27-socialnye-interakcii.md",
    "Компетентность: Присутствие": "28-prisutstvie.md",
    "Компетентность: Чувства": "29-chuvstva.md",
    "Компетентность: Дисциплина": "30-distsiplina.md"
};

// Эмодзи для разных типов контента
const EMOJI_MAPPING = {
    "Предисловие": "🌊",
    "Создание Персонажа": "👤",
    "Шаг Первый": "🎭",
    "Шаг Второй": "🏠",
    "Шаг Третий": "⚡",
    "Шаг Четвёртый": "🎯",
    "Архетипы": "🎭",
    "Традиционный Боец": "⚔️",
    "Солдат": "🎖️",
    "Моряк": "⚓",
    "Пройдоха": "🎭",
    "Повеса": "🎩",
    "Навигатор": "🧭",
    "Музыкант": "🎵",
    "Божий Человек": "⛪",
    "Исследователь": "🔍",
    "Изобретатель": "🔧",
    "Навыки": "📚",
    "Компетентность": "🎯"
};

class RulesSync {
    constructor() {
        this.partsDir = path.join(__dirname, '../files/parts');
        this.changes = [];
    }

    // Получение эмодзи для раздела
    getEmoji(sectionName) {
        for (const [key, emoji] of Object.entries(EMOJI_MAPPING)) {
            if (sectionName.includes(key)) {
                return emoji;
            }
        }
        return "📄";
    }

    // Парсинг HTML из Google Docs
    async parseGoogleDocsHTML(htmlContent) {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        const sections = [];
        let currentSection = null;
        let currentContent = [];

        // Находим все заголовки и параграфы
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, li');

        for (const element of elements) {
            const tagName = element.tagName.toLowerCase();

            if (tagName.startsWith('h')) {
                // Сохраняем предыдущую секцию
                if (currentSection && currentContent.length > 0) {
                    sections.push({
                        title: currentSection,
                        content: currentContent.join('\n').trim()
                    });
                }

                // Начинаем новую секцию
                currentSection = element.textContent.trim();
                currentContent = [];
            } else {
                // Добавляем контент к текущей секции
                if (currentSection) {
                    const text = element.textContent.trim();
                    if (text) {
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

    // Чтение существующего Markdown файла
    async readMarkdownFile(filename) {
        try {
            const filePath = path.join(this.partsDir, filename);
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            console.log(`Файл ${filename} не найден, будет создан новый`);
            return null;
        }
    }

    // Сравнение содержимого
    compareContent(oldContent, newContent) {
        if (!oldContent) return { changed: true, diff: newContent };

        // Простое сравнение по тексту (можно улучшить)
        const oldText = oldContent.replace(/[^\w\s]/g, '').toLowerCase();
        const newText = newContent.replace(/[^\w\s]/g, '').toLowerCase();

        return {
            changed: oldText !== newText,
            diff: newContent
        };
    }

    // Форматирование Markdown с сохранением структуры
    formatMarkdown(sectionName, content) {
        const emoji = this.getEmoji(sectionName);
        const title = sectionName.replace(/^#+\s*/, ''); // Убираем существующие заголовки

        return `# ${title}

${content}

---
`;
    }

    // Обновление файла
    async updateFile(filename, newContent) {
        const filePath = path.join(this.partsDir, filename);
        await fs.writeFile(filePath, newContent, 'utf8');
        this.changes.push(`Обновлен: ${filename}`);
    }

    // Создание нового файла
    async createFile(filename, content) {
        const filePath = path.join(this.partsDir, filename);
        await fs.writeFile(filePath, content, 'utf8');
        this.changes.push(`Создан: ${filename}`);
    }

    // Основная функция синхронизации
    async syncRules(googleDocsHTML) {
        console.log('🔄 Начинаем синхронизацию правил...');

        // Парсим Google Docs
        const sections = await this.parseGoogleDocsHTML(googleDocsHTML);

        for (const section of sections) {
            const filename = SECTION_MAPPING[section.title];

            if (filename) {
                // Читаем существующий файл
                const existingContent = await this.readMarkdownFile(filename);

                // Форматируем новое содержимое
                const formattedContent = this.formatMarkdown(section.title, section.content);

                // Сравниваем и обновляем
                const comparison = this.compareContent(existingContent, formattedContent);

                if (comparison.changed) {
                    if (existingContent) {
                        await this.updateFile(filename, formattedContent);
                    } else {
                        await this.createFile(filename, formattedContent);
                    }
                } else {
                    console.log(`✓ ${filename} - без изменений`);
                }
            } else {
                console.log(`⚠️ Неизвестный раздел: ${section.title}`);
            }
        }

        // Обновляем README
        await this.updateREADME(sections);

        console.log('✅ Синхронизация завершена!');
        console.log('📝 Изменения:', this.changes);
    }

    // Обновление README.md
    async updateREADME(sections) {
        const readmePath = path.join(__dirname, '../files/README.md');

        let readmeContent = `# Архипелаг - Правила игры

> Настольная ролевая игра в сеттинге загадочного архипелага, окруженного туманом

## 📚 Содержание

### 🎯 Основные разделы
`;

        // Добавляем ссылки на разделы
        for (const section of sections) {
            const filename = SECTION_MAPPING[section.title];
            if (filename) {
                const emoji = this.getEmoji(section.title);
                const linkName = filename.replace('.md', '');
                readmeContent += `- [${section.title}](${linkName}) - ${emoji}\n`;
            }
        }

        readmeContent += `

## 🎲 Система игры
**Архипелаг** использует систему **2d20** - два двадцатигранных кубика для основных проверок. Персонажи - выдающиеся личности в мире, полном тайн и опасностей.

## 🌊 Сеттинг
Мир Архипелага - это множество островов, окруженных бескрайним океаном и густым туманом. Здесь нет звезд в ночном небе, а солнце встает из черных вод. Каждое путешествие может стать последним.
`;

        await fs.writeFile(readmePath, readmeContent, 'utf8');
        this.changes.push('Обновлен: README.md');
    }
}

// Экспорт для использования
module.exports = RulesSync;

// Если скрипт запущен напрямую
if (require.main === module) {
    const sync = new RulesSync();

    // Пример использования
    console.log('📖 Скрипт синхронизации правил Архипелага');
    console.log('Использование: node sync-rules.js <google-docs-html>');

    if (process.argv.length < 3) {
        console.log('❌ Необходимо указать HTML-контент Google Docs');
        process.exit(1);
    }

    const htmlContent = process.argv[2];
    sync.syncRules(htmlContent).catch(console.error);
}
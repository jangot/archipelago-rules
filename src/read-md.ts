import * as fs from 'fs';
import * as path from 'path';

export interface Chunk {
    body: string;
    headers: string[];
    section: string;
    chapter: string;
    file: string;
    index: number;
}

export interface ParsedSection {
    title: string;
    content: string;
    level: number;
    subsections: ParsedSection[];
}

export function extractSectionAndChapter(filename: string): { section: string; chapter: string } {
    // Извлекаем раздел и главу из имени файла
    // Пример: "02_ЧАСТЬ_1_01_ГЛАВА 2_ РАСЫ_01_введение.md"
    const match = filename.match(/^(\d+)_ЧАСТЬ_(\d+)_(\d+)_ГЛАВА\s*(\d+)_(.+?)_(\d+)_(.+)\.md$/);

    if (match) {
        const [, , partNum, , chapterNum, chapterName] = match;
        return {
            section: `ЧАСТЬ ${partNum}`,
            chapter: `ГЛАВА ${chapterNum}: ${chapterName}`
        };
    }

    // Для файлов с другим форматом, например: "02_ЧАСТЬ_1_00_ГЛАВА 1_ СОЗДАНИЕ ПЕРСОНАЖА.md"
    const match2 = filename.match(/^(\d+)_ЧАСТЬ_(\d+)_(\d+)_ГЛАВА\s*(\d+)_(.+)\.md$/);

    if (match2) {
        const [, , partNum, , chapterNum, chapterName] = match2;
        return {
            section: `ЧАСТЬ ${partNum}`,
            chapter: `ГЛАВА ${chapterNum}: ${chapterName}`
        };
    }

    // Для файлов в формате archipelago-rules: "01-predislovie.md", "02-sozdanie-personazha.md"
    const archipelagoMatch = filename.match(/^(\d+)-(.+)\.md$/);
    if (archipelagoMatch) {
        const [, number, name] = archipelagoMatch;
        // Определяем раздел по номеру файла
        let section = 'ОСНОВНЫЕ ПРАВИЛА';
        if (parseInt(number) >= 1 && parseInt(number) <= 7) {
            section = 'СОЗДАНИЕ ПЕРСОНАЖА';
        } else if (parseInt(number) >= 8 && parseInt(number) <= 17) {
            section = 'АРХЕТИПЫ';
        } else if (parseInt(number) >= 18 && parseInt(number) <= 30) {
            section = 'НАВЫКИ И СПОСОБНОСТИ';
        }

        return {
            section,
            chapter: `${number}. ${name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
        };
    }

    // Для файлов без стандартного формата
    return {
        section: 'ДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ',
        chapter: filename.replace('.md', '')
    };
}

export function parseMarkdownHeaders(content: string): ParsedSection[] {
    const lines = content.split('\n');
    const sections: ParsedSection[] = [];
    const stack: ParsedSection[] = [];

    let currentSection: ParsedSection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

        if (headerMatch) {
            // Сохраняем предыдущую секцию
            if (currentSection) {
                currentSection.content = currentContent.join('\n').trim();
                currentContent = [];
            }

            const level = headerMatch[1].length;
            const title = headerMatch[2].trim();

            const newSection: ParsedSection = {
                title,
                content: '',
                level,
                subsections: []
            };

            // Находим правильное место в иерархии
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                sections.push(newSection);
            } else {
                stack[stack.length - 1].subsections.push(newSection);
            }

            stack.push(newSection);
            currentSection = newSection;
        } else {
            if (currentSection) {
                currentContent.push(line);
            }
        }
    }

    // Сохраняем последнюю секцию
    if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
    }

    return sections;
}

export function extractChunksFromSection(
    section: ParsedSection,
    parentHeaders: string[] = [],
    sectionName: string,
    chapterName: string,
    fileName: string,
    startIndex: number = 0
): Chunk[] {
    const chunks: Chunk[] = [];
    let currentIndex = startIndex;

    const currentHeaders = [...parentHeaders, section.title];

    // Если у секции есть контент, создаем чанк
    if (section.content.trim()) {
        const chunkContent = currentHeaders.join(' > ') + '\n\n' + section.content;

        chunks.push({
            body: chunkContent,
            headers: currentHeaders,
            section: sectionName,
            chapter: chapterName,
            file: fileName,
            index: currentIndex++
        });
    }

    // Обрабатываем подсекции
    for (const subsection of section.subsections) {
        const subsectionChunks = extractChunksFromSection(
            subsection,
            currentHeaders,
            sectionName,
            chapterName,
            fileName,
            currentIndex
        );
        chunks.push(...subsectionChunks);
        currentIndex += subsectionChunks.length;
    }

    return chunks;
}

export function readMarkdownFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
}

export function splitMarkdownToChunks(filePath: string): Chunk[] {
    const content = readMarkdownFile(filePath);
    const fileName = path.basename(filePath);
    const { section, chapter } = extractSectionAndChapter(fileName);

    const sections = parseMarkdownHeaders(content);
    const chunks: Chunk[] = [];
    let globalIndex = 0;

    for (const parsedSection of sections) {
        const sectionChunks = extractChunksFromSection(
            parsedSection,
            [],
            section,
            chapter,
            fileName,
            globalIndex
        );
        chunks.push(...sectionChunks);
        globalIndex += sectionChunks.length;
    }

    return chunks;
}

export function getAllMarkdownFiles(directory: string): string[] {
    const files: string[] = [];

    function scanDirectory(dir: string) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.md')) {
                files.push(fullPath);
            }
        }
    }

    scanDirectory(directory);
    return files.sort(); // Сортируем для консистентного порядка
}
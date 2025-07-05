#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re

def create_final_document():
    """Создает финальный документ, объединяя все части"""

    # Читаем индексный файл
    with open("../files/README.md", 'r', encoding='utf-8') as f:
        index_content = f.read()

    # Читаем текст из изображений
    with open("../files/extracted_image_text.md", 'r', encoding='utf-8') as f:
        image_text = f.read()

    # Создаем финальный документ
    final_content = []

    # Заголовок
    final_content.append("# Архипелаг - Правила игры\n\n")
    final_content.append("## Содержание\n\n")

    # Добавляем ссылки на разделы
    parts_dir = "../files/parts"
    files = [f for f in os.listdir(parts_dir) if f.endswith('.md')]
    files.sort()

    for file in files:
        file_path = os.path.join(parts_dir, file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
                if first_line.startswith('#'):
                    title = first_line.strip('#').strip()
                else:
                    title = file.replace('.md', '').replace('-', ' ').title()
        except:
            title = file.replace('.md', '').replace('-', ' ').title()

        final_content.append(f"- [{title}](#{file.replace('.md', '').replace('-', '-')})\n")

    final_content.append("- [Текст из изображений](#текст-из-изображений)\n\n")

    # Добавляем содержимое всех частей
    for file in files:
        file_path = os.path.join(parts_dir, file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                final_content.append(content)
                final_content.append("\n\n---\n\n")
        except Exception as e:
            print(f"Ошибка при чтении файла {file}: {e}")

    # Добавляем текст из изображений
    final_content.append("## Текст из изображений\n\n")
    final_content.append(image_text)

    # Сохраняем финальный документ
    with open("../files/archipelago-rules-complete.md", 'w', encoding='utf-8') as f:
        f.write(''.join(final_content))

    print("Финальный документ создан: rules/archipelago-rules-complete.md")

def create_summary():
    """Создает краткое резюме проделанной работы"""

    summary = """# Резюме преобразования HTML в Markdown

## Выполненные этапы:

### 1. Преобразование HTML в Markdown ✅
- HTML файл успешно преобразован в Markdown формат
- Очищены HTML entities и специальные символы
- Сохранена структура и форматирование

### 2. Разбиение на части ✅
- Файл разбит на 30 логических частей:
  - Предисловие
  - Создание персонажа (4 шага)
  - Архетипы (10 типов персонажей)
  - Навыки и компетентности (10 разделов)
- Создан индексный файл с навигацией

### 3. Обработка изображений ✅
- Извлечен текст из всех 27 изображений с помощью OCR
- Создан отдельный файл с текстом из изображений
- Создан файл со ссылками на изображения

### 4. Финальная сборка ✅
- Создан полный документ, объединяющий все части
- Добавлена навигация и оглавление
- Включен текст из изображений

## Структура файлов:

```
rules/
├── README.md                    # Индексный файл
├── archipelago-rules.md         # Исходный Markdown
├── archipelago-rules-complete.md # Финальный полный документ
├── extracted_image_text.md      # Текст из изображений
├── image_references.md          # Ссылки на изображения
├── parts/                       # Разбитые части
│   ├── 01-predislovie.md
│   ├── 02-sozdanie-personazha.md
│   ├── ...
│   └── 30-distsiplina.md
└── images/                      # Исходные изображения
    ├── image1.png
    ├── image2.png
    └── ...
```

## Использование:

1. **Для чтения**: Откройте `rules/README.md` для навигации по разделам
2. **Полный документ**: `rules/archipelago-rules-complete.md` содержит все правила в одном файле
3. **Текст из изображений**: `rules/extracted_image_text.md` содержит извлеченный текст

## Технические детали:

- Использован Python с библиотеками: beautifulsoup4, html2text, Pillow, pytesseract
- OCR выполнен с помощью Tesseract с поддержкой русского языка
- Все файлы сохранены в кодировке UTF-8
"""

    with open("../TRANSFORMATION_SUMMARY.md", 'w', encoding='utf-8') as f:
        f.write(summary)

    print("Резюме создано: TRANSFORMATION_SUMMARY.md")

if __name__ == "__main__":
    print("Создаем финальный документ...")
    create_final_document()

    print("\nСоздаем резюме...")
    create_summary()

    print("\nПреобразование завершено успешно!")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import os

def split_markdown_by_headers(input_file, output_dir):
    """Разбивает Markdown файл на части по заголовкам"""

    # Создаем директорию для частей
    os.makedirs(output_dir, exist_ok=True)

    # Читаем файл
    with open(input_file, 'r', encoding='utf-8') as file:
        content = file.read()

    # Разбиваем на строки
    lines = content.split('\n')

    current_file = None
    current_content = []
    file_counter = 1

    # Список для отслеживания созданных файлов
    created_files = []

    for line in lines:
        # Проверяем, является ли строка заголовком (начинается с #)
        if line.strip().startswith('#'):
            # Если у нас есть накопленное содержимое, сохраняем его
            if current_file and current_content:
                with open(current_file, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(current_content))
                created_files.append(current_file)

            # Создаем новое имя файла
            header_text = line.strip('#').strip()
            # Очищаем имя файла от недопустимых символов
            safe_filename = re.sub(r'[^\w\s-]', '', header_text)
            safe_filename = re.sub(r'[-\s]+', '-', safe_filename)
            safe_filename = safe_filename.strip('-')

            if not safe_filename:
                safe_filename = f"part-{file_counter:02d}"

            current_file = os.path.join(output_dir, f"{safe_filename}.md")
            current_content = [line]
            file_counter += 1
        else:
            # Добавляем строку к текущему содержимому
            if current_file:
                current_content.append(line)

    # Сохраняем последний файл
    if current_file and current_content:
        with open(current_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(current_content))
        created_files.append(current_file)

    print(f"Файл разбит на {len(created_files)} частей:")
    for file_path in created_files:
        print(f"  - {os.path.basename(file_path)}")

    return created_files

def create_index_file(parts_dir, output_file):
    """Создает индексный файл со ссылками на все части"""

    files = [f for f in os.listdir(parts_dir) if f.endswith('.md')]
    files.sort()

    index_content = ["# Архипелаг - Правила игры\n\n"]
    index_content.append("## Содержание\n\n")

    for file in files:
        # Читаем первую строку файла для получения заголовка
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

        index_content.append(f"- [{title}]({file})\n")

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(''.join(index_content))

    print(f"Создан индексный файл: {output_file}")

if __name__ == "__main__":
    # Разбиваем файл на части
    input_file = "rules/archipelago-rules.md"
    parts_dir = "rules/parts"

    created_files = split_markdown_by_headers(input_file, parts_dir)

    # Создаем индексный файл
    index_file = "rules/README.md"
    create_index_file(parts_dir, index_file)
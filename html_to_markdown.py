#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import html
from bs4 import BeautifulSoup
import html2text

def clean_html_entities(text):
    """Очищает HTML entities и преобразует их в читаемый текст"""
    # Декодируем HTML entities
    text = html.unescape(text)
    # Убираем лишние пробелы
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def convert_html_to_markdown(html_file_path, output_file_path):
    """Преобразует HTML файл в Markdown"""

    # Читаем HTML файл
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()

    # Настраиваем html2text
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = False
    h.body_width = 0  # Отключаем перенос строк
    h.unicode_snob = True
    h.escape_snob = True

    # Преобразуем в Markdown
    markdown_content = h.handle(html_content)

    # Очищаем HTML entities
    markdown_content = clean_html_entities(markdown_content)

    # Убираем лишние пустые строки
    markdown_content = re.sub(r'\n\s*\n\s*\n', '\n\n', markdown_content)

    # Сохраняем результат
    with open(output_file_path, 'w', encoding='utf-8') as file:
        file.write(markdown_content)

    print(f"HTML файл успешно преобразован в Markdown: {output_file_path}")
    return markdown_content

if __name__ == "__main__":
    # Преобразуем HTML в Markdown
    html_file = "rules/index.html"
    markdown_file = "rules/archipelago-rules.md"

    content = convert_html_to_markdown(html_file, markdown_file)

    # Показываем первые 500 символов для проверки
    print("\nПервые 500 символов результата:")
    print("-" * 50)
    print(content[:500])
    print("-" * 50)
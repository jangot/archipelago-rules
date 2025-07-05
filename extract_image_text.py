#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import pytesseract
from PIL import Image
import re

def extract_text_from_images(images_dir, output_file):
    """Извлекает текст из всех изображений в директории"""

    # Проверяем наличие tesseract
    try:
        pytesseract.get_tesseract_version()
    except Exception as e:
        print("Ошибка: Tesseract не установлен или не найден в PATH")
        print("Установите Tesseract: https://github.com/tesseract-ocr/tesseract")
        return

    # Получаем список всех изображений
    image_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']
    images = []

    for file in os.listdir(images_dir):
        if any(file.lower().endswith(ext) for ext in image_extensions):
            images.append(file)

    images.sort()  # Сортируем по имени файла

    print(f"Найдено {len(images)} изображений для обработки")

    extracted_texts = []

    for i, image_file in enumerate(images, 1):
        image_path = os.path.join(images_dir, image_file)

        try:
            # Открываем изображение
            image = Image.open(image_path)

            # Извлекаем текст с помощью OCR
            # Используем русский язык для лучшего распознавания
            text = pytesseract.image_to_string(image, lang='rus+eng')

            # Очищаем текст
            text = text.strip()
            text = re.sub(r'\n\s*\n', '\n\n', text)  # Убираем лишние пустые строки

            if text:
                extracted_texts.append(f"## Изображение {image_file}\n\n{text}\n")
                print(f"[{i}/{len(images)}] Обработано: {image_file}")
            else:
                print(f"[{i}/{len(images)}] Текст не найден: {image_file}")

        except Exception as e:
            print(f"[{i}/{len(images)}] Ошибка при обработке {image_file}: {e}")

    # Сохраняем результаты
    if extracted_texts:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Текст из изображений правил игры Архипелаг\n\n")
            f.write("".join(extracted_texts))

        print(f"\nРезультат сохранен в файл: {output_file}")
        print(f"Обработано изображений: {len(extracted_texts)}")
    else:
        print("Текст не был извлечен ни из одного изображения")

def create_image_references(images_dir, output_file):
    """Создает файл со ссылками на изображения и их описаниями"""

    image_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']
    images = []

    for file in os.listdir(images_dir):
        if any(file.lower().endswith(ext) for ext in image_extensions):
            images.append(file)

    images.sort()

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Изображения в правилах игры Архипелаг\n\n")
        f.write("## Список изображений\n\n")

        for i, image_file in enumerate(images, 1):
            f.write(f"{i}. ![Изображение {i}](images/{image_file})\n")
            f.write(f"   - Файл: `{image_file}`\n\n")

if __name__ == "__main__":
    images_dir = "rules/images"
    output_file = "rules/extracted_image_text.md"
    references_file = "rules/image_references.md"

    # Извлекаем текст из изображений
    print("Начинаем извлечение текста из изображений...")
    extract_text_from_images(images_dir, output_file)

    # Создаем файл со ссылками на изображения
    print("\nСоздаем файл со ссылками на изображения...")
    create_image_references(images_dir, references_file)

    print(f"Файл со ссылками создан: {references_file}")
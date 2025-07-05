#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import os

def split_markdown_smart(input_file, output_dir):
    """Умное разбиение Markdown файла на логические части"""

    # Создаем директорию для частей
    os.makedirs(output_dir, exist_ok=True)

    # Читаем файл
    with open(input_file, 'r', encoding='utf-8') as file:
        content = file.read()

    # Определяем основные разделы по ключевым словам
    sections = [
        ("Предисловие", r"Предисловие.*?(?=Создание Персонажа|$)", "01-predislovie.md"),
        ("Создание Персонажа", r"Создание Персонажа.*?(?=Шаг Первый|$)", "02-sozdanie-personazha.md"),
        ("Шаг Первый: Природа персонажа", r"Шаг Первый.*?(?=Шаг Второй|$)", "03-shag-1-priroda.md"),
        ("Шаг Второй: Родина", r"Шаг Второй.*?(?=Шаг Третий|$)", "04-shag-2-rodina.md"),
        ("Шаг Третий: Атрибуты", r"Шаг Третий.*?(?=Шаг Четвёртый|$)", "05-shag-3-atributy.md"),
        ("Шаг Четвёртый: Навыки", r"Шаг Четвёртый.*?(?=Архетипы|$)", "06-shag-4-navyki.md"),
        ("Архетипы", r"Архетипы.*?(?=Традиционный Боец|$)", "07-arhetipy.md"),
        ("Традиционный Боец", r"Традиционный Боец.*?(?=Солдат|$)", "08-tradicionnyj-boez.md"),
        ("Солдат", r"Солдат.*?(?=Моряк|$)", "09-soldat.md"),
        ("Моряк", r"Моряк.*?(?=Пройдоха|$)", "10-moryak.md"),
        ("Пройдоха", r"Пройдоха.*?(?=Повеса|$)", "11-projdocha.md"),
        ("Повеса", r"Повеса.*?(?=Навигатор|$)", "12-povesa.md"),
        ("Навигатор", r"Навигатор.*?(?=Музыкант|$)", "13-navigator.md"),
        ("Музыкант", r"Музыкант.*?(?=Божий Человек|$)", "14-muzykant.md"),
        ("Божий Человек", r"Божий Человек.*?(?=Исследователь|$)", "15-bozhij-chelovek.md"),
        ("Исследователь", r"Исследователь.*?(?=Изобретатель|$)", "16-issledovatel.md"),
        ("Изобретатель", r"Изобретатель.*?(?=Навыки:|$)", "17-izobretatel.md"),
        ("Навыки", r"Навыки:.*?(?=Компетентность:|$)", "18-navyki-obshchee.md"),
        ("Компетентность: Традиционные Виды Боя", r"Компетентность: Традиционные Виды Боя.*?(?=Компетентность: Подвижность|$)", "19-tradicionnye-vidy-boya.md"),
        ("Компетентность: Подвижность", r"Компетентность: Подвижность.*?(?=Компетентность: Выносливость|$)", "20-podvizhnost.md"),
        ("Компетентность: Выносливость", r"Компетентность: Выносливость.*?(?=Компетентность: Огнестрельное|$)", "21-vynoslivost.md"),
        ("Компетентность: Огнестрельное", r"Компетентность: Огнестрельное.*?(?=Компетентность: Мореплавание|$)", "22-ognestrelnoe.md"),
        ("Компетентность: Мореплавание", r"Компетентность: Мореплавание.*?(?=Компетентность: Защита|$)", "23-moreplavanie.md"),
        ("Компетентность: Защита", r"Компетентность: Защита.*?(?=Компетентность: Ремесло|$)", "24-zashchita.md"),
        ("Компетентность: Ремесло", r"Компетентность: Ремесло.*?(?=Компетентность: Знания|$)", "25-remeslo.md"),
        ("Компетентность: Знания", r"Компетентность: Знания.*?(?=Компетентность: Социальные Интеракции|$)", "26-znaniya.md"),
        ("Компетентность: Социальные Интеракции", r"Компетентность: Социальные Интеракции.*?(?=Компетентность: Присутствие|$)", "27-socialnye-interakcii.md"),
        ("Компетентность: Присутствие", r"Компетентность: Присутствие.*?(?=Компетентность: Чувства|$)", "28-prisutstvie.md"),
        ("Компетентность: Чувства", r"Компетентность: Чувства.*?(?=Компетентность: Дисциплина|$)", "29-chuvstva.md"),
        ("Компетентность: Дисциплина", r"Компетентность: Дисциплина.*?(?=$)", "30-distsiplina.md"),
    ]

    created_files = []

    for title, pattern, filename in sections:
        match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
        if match:
            section_content = match.group(0).strip()

            # Очищаем контент от лишних пробелов
            section_content = re.sub(r'\s+', ' ', section_content)
            section_content = re.sub(r'\n\s*\n', '\n\n', section_content)

            # Добавляем заголовок
            formatted_content = f"# {title}\n\n{section_content}\n"

            file_path = os.path.join(output_dir, filename)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(formatted_content)

            created_files.append((filename, title))
            print(f"Создан файл: {filename} - {title}")
        else:
            print(f"Не найден раздел: {title}")

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

        index_content.append(f"- [{title}](parts/{file})\n")

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(''.join(index_content))

    print(f"Создан индексный файл: {output_file}")

if __name__ == "__main__":
    # Разбиваем файл на части
    input_file = "../files/archipelago-rules.md"
    parts_dir = "../files/parts"

    created_files = split_markdown_smart(input_file, parts_dir)

    # Создаем индексный файл
    index_file = "../files/README.md"
    create_index_file(parts_dir, index_file)

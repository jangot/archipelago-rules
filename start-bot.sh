#!/bin/bash

# Скрипт для запуска Архипелаг Rules Bot в pm2
# Использование: ./start-bot.sh [start|stop|restart|status|logs]

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Название приложения в pm2
APP_NAME="archipelago-rules-bot"

# Функция для вывода сообщений
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверяем, установлен ли pm2
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_error "pm2 не установлен. Установите его командой: npm install -g pm2"
        exit 1
    fi
}

# Проверяем наличие .env файла
check_env() {
    if [ ! -f ".env" ]; then
        print_error "Файл .env не найден. Создайте его с необходимыми переменными окружения."
        exit 1
    fi
}

# Проверяем, что проект собран
check_build() {
    if [ ! -d "dist" ] || [ ! -f "dist/telegram-bot.js" ]; then
        print_warning "Проект не собран. Собираю..."
        npm run build
        if [ $? -ne 0 ]; then
            print_error "Ошибка при сборке проекта"
            exit 1
        fi
    fi
}

# Функция запуска
start_bot() {
    print_message "Запускаю Архипелаг Rules Bot..."

    # Проверяем, не запущен ли уже бот
    if pm2 list | grep -q "$APP_NAME"; then
        print_warning "Бот уже запущен. Используйте 'restart' для перезапуска."
        return
    fi

    # Запускаем бота в pm2
    pm2 start dist/telegram-bot.js \
        --name "$APP_NAME" \
        --interpreter node \
        --max-memory-restart 512M \
        --restart-delay 3000 \
        --max-restarts 10 \
        --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
        --env production

    if [ $? -eq 0 ]; then
        print_message "Бот успешно запущен!"
        print_message "Для просмотра логов: pm2 logs $APP_NAME"
        print_message "Для остановки: pm2 stop $APP_NAME"
    else
        print_error "Ошибка при запуске бота"
        exit 1
    fi
}

# Функция остановки
stop_bot() {
    print_message "Останавливаю Архипелаг Rules Bot..."

    if pm2 list | grep -q "$APP_NAME"; then
        pm2 stop "$APP_NAME"
        print_message "Бот остановлен"
    else
        print_warning "Бот не был запущен"
    fi
}

# Функция перезапуска
restart_bot() {
    print_message "Перезапускаю Архипелаг Rules Bot..."

    # Собираем проект перед перезапуском
    check_build

    if pm2 list | grep -q "$APP_NAME"; then
        pm2 restart "$APP_NAME"
        print_message "Бот перезапущен"
    else
        print_warning "Бот не был запущен. Запускаю..."
        start_bot
    fi
}

# Функция показа статуса
show_status() {
    print_message "Статус Архипелаг Rules Bot:"
    pm2 list | grep "$APP_NAME" || print_warning "Бот не запущен"
}

# Функция показа логов
show_logs() {
    print_message "Логи Архипелаг Rules Bot:"
    pm2 logs "$APP_NAME" --lines 50
}

# Функция удаления из pm2
delete_bot() {
    print_message "Удаляю Архипелаг Rules Bot из pm2..."

    if pm2 list | grep -q "$APP_NAME"; then
        pm2 delete "$APP_NAME"
        print_message "Бот удален из pm2"
    else
        print_warning "Бот не найден в pm2"
    fi
}

# Функция показа справки
show_help() {
    echo -e "${BLUE}Архипелаг Rules Bot - PM2 Manager${NC}"
    echo ""
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  start     - Запустить бота"
    echo "  stop      - Остановить бота"
    echo "  restart   - Перезапустить бота"
    echo "  status    - Показать статус"
    echo "  logs      - Показать логи"
    echo "  delete    - Удалить бота из pm2"
    echo "  help      - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 start"
    echo "  $0 restart"
    echo "  $0 logs"
}

# Основная логика
main() {
    # Проверяем зависимости
    check_pm2
    check_env

    case "${1:-help}" in
        "start")
            check_build
            start_bot
            ;;
        "stop")
            stop_bot
            ;;
        "restart")
            restart_bot
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "delete")
            delete_bot
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Запускаем основную функцию
main "$@"
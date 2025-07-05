module.exports = {
  apps: [{
    name: 'archipelago-rules-bot',
    script: 'dist/telegram-bot.js',
    interpreter: 'node',

    // Настройки перезапуска
    max_memory_restart: '512M',
    restart_delay: 3000,
    max_restarts: 10,

    // Настройки логов
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_file: './logs/combined.log',

    // Настройки окружения
    env: {
      NODE_ENV: 'production'
    },

    // Настройки мониторинга
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],

    // Настройки производительности
    instances: 1,
    exec_mode: 'fork',

    // Автозапуск при перезагрузке системы
    autorestart: true,

    // Настройки времени
    min_uptime: '10s',
    max_restarts: 10,

    // Дополнительные настройки
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Переменные окружения (можно переопределить)
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
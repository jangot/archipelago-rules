import TelegramBot from 'node-telegram-bot-api';
import { configuration } from './configuration';
import { searchRelevantChunks } from './qdrant';
import { getAIResponse } from './openai-api';
import { userAccessManager } from './user-access';

// Создаем экземпляр бота
const bot = new TelegramBot(configuration.telegramToken, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🌊 Добро пожаловать в Архипелаг Rules Bot!

Я помогу вам найти ответы на вопросы по правилам игры "Архипелаг" (2d20). Просто задайте мне любой вопрос о правилах, и я найду релевантную информацию в официальных источниках.

Примеры вопросов:
• Как работает создание персонажа?
• Какие архетипы доступны?
• Как работают навыки?
• Какие атрибуты важны?

Просто напишите ваш вопрос! ⚔️
    `;

    await bot.sendMessage(chatId, welcomeMessage);
});

// Обработчик команды /help
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 Справка по использованию бота:

🔍 Как задать вопрос:
Просто напишите ваш вопрос о правилах игры "Архипелаг" (2d20) в чат.

📖 Что я умею:
• Отвечать на вопросы по правилам игры "Архипелаг"
• Искать информацию в официальных источниках
• Объяснять механики игры
• Помогать с созданием персонажей

💡 Примеры вопросов:
• "Как работает создание персонажа?"
• "Какие архетипы доступны?"
• "Как работают навыки?"
• "Что такое атрибуты?"

🎯 Команды:
/start - Начать работу с ботом
/help - Показать эту справку
/users - Управление пользователями (только для админов)

Удачной игры! ⚔️
    `;

    await bot.sendMessage(chatId, helpMessage);
});

// Обработчик команды /users для управления пользователями
bot.onText(/\/users/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || '');
    const userName = msg.from?.username || '';

    // Только админ может видеть список
    if (!userAccessManager.isAdmin(userId, userName)) {
        await bot.sendMessage(chatId, '❌ Только администратор может использовать эту команду.');
        return;
    }

    const stats = userAccessManager.getStats();
    const activeUsers = userAccessManager.getActiveUsers();

    let userList = '';
    if (activeUsers.length > 0) {
        userList = activeUsers.map(user =>
            `• ${user.username || 'Без username'} (ID: ${user.id}) - добавлен ${new Date(user.addedAt).toLocaleDateString()}`
        ).join('\n');
    } else {
        userList = 'Нет активных пользователей';
    }

    const adminMessage = `
👥 **Управление пользователями**

📊 Статистика:
• Всего пользователей: ${stats.total}
• Активных: ${stats.active}
• Неактивных: ${stats.inactive}
• Последнее обновление: ${new Date(stats.lastUpdated).toLocaleString()}

👤 **Активные пользователи:**
${userList}

💡 **Команды управления:**
/adduser @username - Добавить пользователя
/removeuser @username - Деактивировать пользователя
/activateuser @username - Активировать пользователя
/deleteuser @username - Полностью удалить пользователя
    `;

    await bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
});

// Обработчик команды /adduser
bot.onText(/\/adduser (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || '');
    const userName = msg.from?.username || '';
    if (!userAccessManager.isAdmin(userId, userName)) {
        await bot.sendMessage(chatId, '❌ Только администратор может добавлять пользователей.');
        return;
    }

    if (!match) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /adduser @username');
        return;
    }

    const newUsername = match[1].replace('@', '').trim();

    if (!newUsername) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /adduser @username');
        return;
    }

    const success = userAccessManager.addUser({
        id: '', // ID будет пустым, будем искать по username
        username: newUsername,
        addedBy: userName || userId
    }, userName || userId);

    if (success) {
        await bot.sendMessage(chatId, `✅ Пользователь @${newUsername} добавлен!`);
    } else {
        await bot.sendMessage(chatId, `❌ Пользователь @${newUsername} уже существует или произошла ошибка.`);
    }
});

// Обработчик команды /removeuser
bot.onText(/\/removeuser (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || '');
    const userName = msg.from?.username || '';
    if (!userAccessManager.isAdmin(userId, userName)) {
        await bot.sendMessage(chatId, '❌ Только администратор может деактивировать пользователей.');
        return;
    }

    if (!match) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /removeuser @username');
        return;
    }

    const targetUsername = match[1].replace('@', '').trim();

    if (!targetUsername) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /removeuser @username');
        return;
    }

    const success = userAccessManager.removeUser('', targetUsername);

    if (success) {
        await bot.sendMessage(chatId, `✅ Пользователь @${targetUsername} деактивирован!`);
    } else {
        await bot.sendMessage(chatId, `❌ Пользователь @${targetUsername} не найден или произошла ошибка.`);
    }
});

// Обработчик команды /activateuser
bot.onText(/\/activateuser (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || '');
    const userName = msg.from?.username || '';
    if (!userAccessManager.isAdmin(userId, userName)) {
        await bot.sendMessage(chatId, '❌ Только администратор может активировать пользователей.');
        return;
    }

    if (!match) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /activateuser @username');
        return;
    }

    const targetUsername = match[1].replace('@', '').trim();

    if (!targetUsername) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /activateuser @username');
        return;
    }

    const success = userAccessManager.activateUser('', targetUsername);

    if (success) {
        await bot.sendMessage(chatId, `✅ Пользователь @${targetUsername} активирован!`);
    } else {
        await bot.sendMessage(chatId, `❌ Пользователь @${targetUsername} не найден или произошла ошибка.`);
    }
});

// Обработчик команды /deleteuser
bot.onText(/\/deleteuser (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || '');
    const userName = msg.from?.username || '';
    if (!userAccessManager.isAdmin(userId, userName)) {
        await bot.sendMessage(chatId, '❌ Только администратор может удалять пользователей.');
        return;
    }

    if (!match) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /deleteuser @username');
        return;
    }

    const targetUsername = match[1].replace('@', '').trim();

    if (!targetUsername) {
        await bot.sendMessage(chatId, '❌ Укажите username пользователя: /deleteuser @username');
        return;
    }

    const success = userAccessManager.deleteUser('', targetUsername);

    if (success) {
        await bot.sendMessage(chatId, `✅ Пользователь @${targetUsername} полностью удалён!`);
    } else {
        await bot.sendMessage(chatId, `❌ Пользователь @${targetUsername} не найден или произошла ошибка.`);
    }
});

// Обработчик команды /setadmin
bot.onText(/\/setadmin (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || '');
    const userName = msg.from?.username || '';
    if (!userAccessManager.isAdmin(userId, userName)) {
        await bot.sendMessage(chatId, '❌ Только администратор может назначать других админов.');
        return;
    }
    if (!match) {
        await bot.sendMessage(chatId, '❌ Укажите username: /setadmin @username');
        return;
    }
    const targetUsername = match[1].replace('@', '').trim();
    const success = userAccessManager.setAdmin('', targetUsername, true);
    if (success) {
        await bot.sendMessage(chatId, `✅ Пользователь @${targetUsername} теперь администратор!`);
    } else {
        await bot.sendMessage(chatId, `❌ Пользователь @${targetUsername} не найден.`);
    }
});

// Обработчик команды /unsetadmin
bot.onText(/\/unsetadmin (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || '');
    const userName = msg.from?.username || '';
    if (!userAccessManager.isAdmin(userId, userName)) {
        await bot.sendMessage(chatId, '❌ Только администратор может снимать права администратора.');
        return;
    }
    if (!match) {
        await bot.sendMessage(chatId, '❌ Укажите username: /unsetadmin @username');
        return;
    }
    const targetUsername = match[1].replace('@', '').trim();
    const success = userAccessManager.setAdmin('', targetUsername, false);
    if (success) {
        await bot.sendMessage(chatId, `✅ Пользователь @${targetUsername} больше не администратор!`);
    } else {
        await bot.sendMessage(chatId, `❌ Пользователь @${targetUsername} не найден.`);
    }
});

// Обработчик всех текстовых сообщений
bot.on('message', async (msg) => {
    // Пропускаем команды
    if (msg.text?.startsWith('/')) {
        return;
    }

    const chatId = msg.chat.id;
    const question = msg.text;

    if (!question) {
        await bot.sendMessage(chatId, 'Пожалуйста, задайте вопрос о правилах игры "Архипелаг" (2d20).');
        return;
    }

    console.log(msg.from)
    const userName = msg.from?.username || '';
    const userId = String(msg.from?.id || '');
    try {
        // Проверяем доступ через новую систему
        if (!userAccessManager.hasAccess(userId, userName)) {
            console.log(`No access: ${userName} | ${userId}`)
            await bot.sendMessage(chatId, '😿 Извините, ваш аккаунт не может быть обслужен. Пожалуйста свяжитесь с администратором @jangot для получения доступа.');
            return;
        }
        // Отправляем сообщение о том, что бот думает
        const thinkingMessage = await bot.sendMessage(chatId, '🤔 Ищу ответ в правилах Архипелага...');

        console.log(`🔍 Поиск по вопросу от пользователя ${userName || msg.from?.first_name}: "${question}"`);

        // Ищем релевантные фрагменты
        const searchResults = await searchRelevantChunks(question);

        if (searchResults.length === 0) {
            await bot.editMessageText('❌ К сожалению, я не нашел релевантной информации по вашему вопросу в правилах игры "Архипелаг". Попробуйте переформулировать вопрос.', {
                chat_id: chatId,
                message_id: thinkingMessage.message_id
            });
            return;
        }

        // Получаем ответ от AI
        await bot.editMessageText('🧠 Анализирую найденную информацию...', {
            chat_id: chatId,
            message_id: thinkingMessage.message_id
        });

        const aiResponse = await getAIResponse(question, searchResults);

        // Форматируем ответ
        const formattedResponse = `
📖 **Ответ на ваш вопрос:**

${aiResponse}

---
💡 *Источники: найдено ${searchResults.length} релевантных фрагментов из правил игры "Архипелаг"*
        `;

        await bot.editMessageText(formattedResponse, {
            chat_id: chatId,
            message_id: thinkingMessage.message_id,
            parse_mode: 'Markdown'
        });

        console.log(`✅ Ответ отправлен пользователю ${msg.from?.username || msg.from?.first_name}`);

    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);

        const errorMessage = '❌ Произошла ошибка при поиске ответа. Пожалуйста, попробуйте еще раз позже.';

        if (msg.message_id) {
            await bot.editMessageText(errorMessage, {
                chat_id: chatId,
                message_id: msg.message_id
            });
        } else {
            await bot.sendMessage(chatId, errorMessage);
        }
    }
});

// Обработчик ошибок
bot.on('error', (error) => {
    console.error('Ошибка Telegram бота:', error);
});

bot.on('polling_error', (error) => {
    console.error('Ошибка polling Telegram бота:', error);
});

// Запуск бота
console.log('🤖 Архипелаг Rules Bot запущен...');
console.log('📱 Бот готов отвечать на вопросы!');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал SIGINT, останавливаю бота...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал SIGTERM, останавливаю бота...');
    bot.stopPolling();
    process.exit(0);
});

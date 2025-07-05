import TelegramBot from 'node-telegram-bot-api';
import { configuration } from './configuration';
import { searchRelevantChunks } from './qdrant';
import { getAIResponse } from './openai-api';

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

Удачной игры! ⚔️
    `;

    await bot.sendMessage(chatId, helpMessage);
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
        if (!configuration.kings.includes(userName) && !configuration.kings.includes(userId) ) {
            console.log(`No access${userName} | ${userId}`)
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

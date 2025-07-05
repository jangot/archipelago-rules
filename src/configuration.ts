import dotenv from 'dotenv';

dotenv.config();

export const configuration = {
    qdrantUrl: String(process.env.QDRANT_URL),
    openAiKey: String(process.env.OPENAI_API_KEY),
    rulesPath: String(process.env.RULES_FILE),
    vectorDBName: String(process.env.VECTOR_DB_NAME),
    telegramToken: String(process.env.TELEGRAM_BOT_TOKEN),
    kings: String(process.env.KINGS).split(','),
    usersDbPath: process.env.USERS_DB_PATH || '',
}

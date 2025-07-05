import OpenAI from 'openai';
import { configuration } from './configuration';

export const openai = new OpenAI({
    apiKey: configuration.openAiKey
});
export async function getEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

export async function getAIResponse(question: string, searchResults: Array<{text: string, score: number, index: number}>) {
    const context = searchResults.map((result, index) =>
        `[Источник ${index + 1}, релевантность: ${result.score.toFixed(4)}]\n${result.text}`
    ).join('\n\n');

    const prompt = `Вопрос: ${question}

Контекст из базы знаний:
${context}

Пожалуйста, ответьте на вопрос, основываясь на предоставленном контексте. Если в контексте недостаточно информации для полного ответа, укажите это. Ответ должен быть точным и соответствовать правилам игры "Архипелаг" (2d20).`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Ты эксперт по правилам игры "Архипелаг" (2d20). Отвечай на вопросы игроков, основываясь на предоставленном контексте из официальных правил.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Ошибка при обращении к OpenAI:', error);
        return 'Произошла ошибка при получении ответа от AI.';
    }
}

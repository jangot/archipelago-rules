import { QdrantClient } from '@qdrant/js-client-rest';
import { configuration } from './configuration';
import { getEmbedding } from './openai-api'
//PDF_PATH = './files/players-handbook.pdf'
export const qdrant = new QdrantClient({
    url: configuration.qdrantUrl
});

interface Response {
    text: string;
    score: number;
    index: number;
}

export async function searchRelevantChunks(question: string, topK = 25): Promise<Response[]> {
    const vector = await getEmbedding(question);

    const response = await qdrant.search(configuration.vectorDBName, {
        vector,
        limit: topK,
        with_payload: true,
    });

    return response.map(hit => {
        const score: number = hit.score;
        const index: number = hit.payload ? Number(hit.payload.index) : -1;
        const text: string = hit.payload ? String(hit.payload.text) : '';

        return { score, text, index };
    });
}

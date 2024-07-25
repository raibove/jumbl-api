export interface Env {
	AI: Ai;
}
interface JumblRequest {
	type: 'words';
	topic: string;
	numOfWords: string;
	difficultyLevel: string;
}
export default {
	async fetch(request, env): Promise<Response> {
		// const numOfWords = 10;
		// const topic = 'Cooking';
		// const difficultyLevel = 'Medium'

		const canvaAppId = 'AAGKAGwRQxo';

		const corsHeaders = {
			'Access-Control-Allow-Origin': `http://localhost:3000`,
			'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
			'Access-Control-Max-Age': '86400',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method !== 'POST') {
			return new Response('Please send a POST request', { status: 405, headers: corsHeaders });
		}

		const body: JumblRequest = await request.json();
		const { type, topic, numOfWords, difficultyLevel} = body;

		const response = (await env.AI.run("@hf/mistral/mistral-7b-instruct-v0.2", {
			messages: [
				{ role: "system", content: `You are a Professional Crossword Constructor who specialize in creating crosswords. Your task is to generate words for crossword with difficulty level - ${difficultyLevel}. You must write response in following format - [{answer1, clue1}, {answer2, clue2}].` },
				{
					role: "user",
					content: `For topic - ${topic} list ${numOfWords} words. Remember the response must contain answer and clue.`,
				},
			], stream: false
		})) as { response: string };

		return new Response(response.response, {
			headers: { 'Content-Type': 'application/json', ...corsHeaders },
		});
	},
} satisfies ExportedHandler<Env>;
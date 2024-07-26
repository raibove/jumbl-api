export interface Env {
	AI: Ai;
	jumbl: KVNamespace
}
interface JumblRequest {
	type: 'words';
	topic: string;
	numOfWords: string;
	difficultyLevel: string;
	users: { score: number, name: string }[],
	crossword: Object,
	id: string,
	generatedBy: string,
}
export default {
	async fetch(request, env): Promise<Response> {
		const corsHeaders = {
			'Access-Control-Allow-Origin': `*`,
			'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
			'Access-Control-Max-Age': '86400',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url)
		const path = url.pathname

		if(request.method === 'GET') {
			const id = path.slice(1);
			const savedCrossword = await env.jumbl.get(id);
			return new Response(savedCrossword, {
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}

		if (request.method !== 'POST') {
			return new Response('Please send a POST request', { status: 405, headers: corsHeaders });
		}

		const body: JumblRequest = await request.json();
		const { type, topic, numOfWords, difficultyLevel, users, crossword, generatedBy, id } = body;
		if (type === 'words') {
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
		} else if (type === 'crossword-save') {
			const crosswordData = {
				users,
				crossword,
				generatedBy,
				timestamp: new Date().toISOString()
			};

			try {
				console.Console
				await env.jumbl.put(id, JSON.stringify(crosswordData));
				return new Response(JSON.stringify({ message: 'Crossword data stored successfully' }), {
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			} catch (error) {
				console.error('Error storing crossword data:', error);
				return new Response(JSON.stringify({ error: 'Failed to store crossword data' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}
		}

		return new Response('Please add valid type with post request', { status: 405, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
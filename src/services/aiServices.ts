import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAICacheManager } from "@google/generative-ai/dist/server/server";
import { config } from "~/config";
import { generatePrompt } from "~/scripts/prompt";
/*
class aiServices {
    private static apiKey: string;
    private gemini: GoogleGenerativeAI;

    constructor(apiKey: any){
        aiServices.apiKey = apiKey;
        this.gemini = new GoogleGenerativeAI(apiKey);
    };
}
*/
class aiServices {
    private static apiKey: string;
    public gemini: GoogleGenerativeAI;
    public cache:GoogleAICacheManager;

    constructor(apiKey: any){
        aiServices.apiKey = apiKey;
        this.gemini = new GoogleGenerativeAI(apiKey);
        this.cache = new GoogleAICacheManager(apiKey);
    }
}
async function chat(prompt: string,message:string): Promise<string> {
    try{
            // Choose a model that's appropriate for your use case.
    const model = this.gemini.getGenerativeModel({ model: config.Model});

    const formatPrompt =  prompt + ` Este es el texto: ${message}`

    const result = await model.generateContent(formatPrompt);
    const response = result.response;
    const answ = response.text();
    return answ
    }catch(err){
        console.error('Error al conectar con Gemini: ', err);
        return 'ERROR'
    }
    
}

async function startingModelCache(history:[],expireTime: string,name:string){
            const displayName = 'propiedades'
            //const model = 'models/gemini-1.5-flash-001'
            const model = 'models/gemini-1.5-flash-8b'
            const contexto = generatePrompt(name)
            const systemInstruction = `Sos Santiago, el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina. Utiliza solamente el contexto proporcionado para responder.`
            const ttlSeconds = 300 // Asignacion de la cantidad de segundos que esta disponible el cache
            const cache = this.cache.create({
                        model,
                        displayName,
                        systemInstruction,
                        contents: [
                            {
                            role: 'user',
                            parts: [{text: contexto}],
                            },
                        ],
                        ttlSeconds,
                        })
            this.gemini.getGenerativeModelFromCachedContent(cache)

}

export default aiServices;
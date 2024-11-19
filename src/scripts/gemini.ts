import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generatePrompt } from './prompt';
import { config } from '~/config';
// import { GoogleAICacheManager } from '@google/generative-ai/server';

dotenv.config()

// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(config.ApiKey)

// const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY)


  export async function chat(prompt: string,message:string): Promise<string> {
    // Choose a model that's appropriate for your use case.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b"});

    const formatPrompt =  prompt + ` Este es el texto: ${message}`

    const result = await model.generateContent(formatPrompt);
    const response = result.response;
    const answ = response.text();
    return answ
}

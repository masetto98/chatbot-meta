import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS} from '@builderbot/bot'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager,GoogleAIFileManager,FileState } from '@google/generative-ai/server';
import 'dotenv/config'
import { cargarfaq } from 'utils/utils';
import { config } from '~/config';

const genAI = new GoogleGenerativeAI(config.ApiKey);
const cacheManager = new GoogleAICacheManager(config.ApiKey)


async function uploadToGemini(path, mimeType) {
  
  const fileManager = new GoogleAIFileManager(config.ApiKey);
	const fileResult = await fileManager.uploadFile(path, {
		mimeType,
		displayName: path,
	});

	let file = await fileManager.getFile(fileResult.file.name);
	while(file.state === FileState.PROCESSING) {
		console.log('Waiting for file to finish processing');
		await new Promise(resolve => setTimeout(resolve, 2_000));
		file = await fileManager.getFile(fileResult.file.name);
	}

  return file;
}




let modelo;
let chattest;
let cache;

const faqFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, ctxFn) => {
        cargarfaq()
        const book = './faq2.txt';
        const bookFile = await uploadToGemini(book, 'text/plain');
        console.log(`${book} uploaded to Google.`);
        // console.log(bookFile)
        const newHistory = (ctxFn.state.getMyState()?.history ?? [])
        const expireTime = (ctxFn.state.getMyState()?.expireTime ?? String)
        // Si el cache no está creado o si esta creado pero ya expiró inicializó todo nuevamente
        if(!cache || expireTime < new Date().toISOString()){
            
            const displayName = 'faq'
            //const model = 'models/gemini-1.5-flash-001'
            const model = 'models/gemini-1.5-flash-8b'
            const systemInstruction = `Sos Santiago, el asistente virtual de la inmobiliaria Martin + Tettamanzi en Argentina. Tu función principal es resolver las consultas, dudas o inquietudes del usuario teniendo en cuenta solamente el contexto dado. Utiliza solamente el contexto proporcionado para responder. Antes de responder revisa si la respuesta esta dentro del contexto dado. Si la respuesta no se encuentra dentro del contexto dado, comunicale esta situación al usuario. Mantené una conversación agradable y profesional. No inventes respuestas que no se encuentran en el contexto dado. Ante cada respuesta consultale si podes ayudarlo con otra consulta o duda.`
            const ttlSeconds = 120 // Asignacion de la cantidad de segundos que esta disponible el cache
            cache = await cacheManager.create({
                        model,
                        displayName,
                        systemInstruction,
                        contents: [
                            {
                              role: 'user',
                              parts: [
                                {
                                  fileData: {
                                    mimeType: bookFile.mimeType,
                                    fileUri: bookFile.uri,
                                  },
                                },
                              ],
                            },
                          ],
                          ttlSeconds,
                        });
            modelo = genAI.getGenerativeModelFromCachedContent(cache)
            console.log(cache)
            newHistory.push({
              role:'user',
              parts: [{ text: ctx.body}]
            })
          
            chattest = modelo.startChat({
            generationConfig: {
                maxOutputTokens: 200,  // Adjust based on desired response length
                /*temperature:0.3,
                topP:0.8,
                topK:20*/
            },
            history: [{
                  role: "user",
                  parts: [{ text: `Sos Santiago, el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina. Utiliza solamente el contexto proporcionado para responder.`}],
                },
                {
                  role: "model",
                  parts: [{ text: `Ok.`}],
                },
                  ...newHistory],
              cachedContent: cache.name
            });
            const lastExpireTime = (await cacheManager.get(cache.name)).expireTime
            await ctxFn.state.update({expireTime:lastExpireTime})
            console.log(expireTime)         
        }
        
        console.log(cache) 
        console.log(bookFile)
        const response = await chattest.sendMessage(ctx.body.trimEnd());
        const resp = response.response.text().trimEnd();
        
        await ctxFn.flowDynamic(resp);
        newHistory.push({
          role:'user',
          parts: [{ text: ctx.body}]
        })
        const updatedHistory = [...newHistory];
        updatedHistory.push({
            role: 'model',
            parts: [{ text: response.response.text() }],
        });
        
        //Limito el historial a los ultimos 4 mensajes(ultimas 2 interacciones completas user-model)
        console.log(updatedHistory.length)
        const limitedHistory = updatedHistory.slice(-6);

        //chattest.history = updatedHistory;
        chattest.history = limitedHistory;

        console.log(chattest.history)
       

        /*const lastExpireTime = (await cacheManager.get(cache.name)).expireT
        ime
        await ctxFn.state.update({expireTime:lastExpireTime})*/
        await ctxFn.state.update({history:limitedHistory})
        console.log(`Cantidad Token Entrada:${response.response.usageMetadata.promptTokenCount}`);
        console.log(`Cantidad Token Resp:${response.response.usageMetadata.candidatesTokenCount}`);
        console.log(`Cantidad Total Token:${response.response.usageMetadata.totalTokenCount}`);
        
    }
  )

export {faqFlow}
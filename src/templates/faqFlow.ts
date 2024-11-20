import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS} from '@builderbot/bot'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager,GoogleAIFileManager,FileState } from '@google/generative-ai/server';
import 'dotenv/config'
import { cargarfaq } from 'utils/utils';
import { config } from '~/config';
import { welcomeFlow } from './welcomeFlow';

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

const afirmativeFlow2 = addKeyword('Sí')
                        .addAction(async (ctx,ctxFn) => {
                            return ctxFn.gotoFlow(welcomeFlow)
                        })
const negativeFlow2 = addKeyword('No')
                        .addAction(async (ctx,ctxFn) => {
                            return ctxFn.endFlow('Espero haberte ayudado 🤗, gracias por comunicarte. Escribe *menu* para realizar otra consulta.')
                        })           

let cache;
const finFlow = addKeyword(EVENTS.ACTION)
.addAnswer(`¿Necesitas que te ayude con otra consulta?`,{
  capture:true,
  buttons: [
      {body:'Sí'},
      {body:'No'},
  ]
  },null,[afirmativeFlow2,negativeFlow2])

const faqFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, ctxFn) => {
        await cargarfaq()
        const book = './faq2.txt';
        const bookFile = await uploadToGemini(book, 'text/plain');
        console.log(`${book} uploaded to Google.`);
        // console.log(bookFile)
        const newHistory = (ctxFn.state.getMyState()?.history ?? [])
        const expireTime = (ctxFn.state.getMyState()?.expireTime ?? String)
        let modelo = await ctxFn.state.get('modelo');
        let chattest= await ctxFn.state.get('chattest')
        // Si el cache no está creado o si esta creado pero ya expiró inicializó todo nuevamente
        if(!cache || expireTime < new Date().toISOString() || !modelo){
            
            const displayName = 'faq'
            //const model = 'models/gemini-1.5-flash-001'
            const model = 'models/gemini-1.5-flash-8b'
            const systemInstruction = `Sos Santiago, el asistente virtual de la inmobiliaria Martin + Tettamanzi en Argentina. A continuación te dejo las premisas que debes seguir para responder a los mensajes:\n
            - Tu función principal es resolver las consultas, dudas o inquietudes del usuario teniendo en cuenta solamente el contexto dado.\n
            - Al comenzar la conversación no digas Hola y comentale que tu función es asistirlo en lo que necesite y que te diga en que podes ayudarlo.\n
            - Responde de manera breve, directa y natural, adecuada para WhatsApp.\n
            - Manten un tono profesional y siempre responde en primera persona.\n
            - Utiliza solamente el contexto proporcionado para responder. Antes de responder revisa si la respuesta esta dentro del contexto dado. Si la respuesta no se encuentra dentro del contexto dado, comunicale esta situación al usuario.\n
            - Mantené una conversación agradable y profesional. No inventes respuestas que no se encuentran en el contexto dado.\n
            - Siempre ante cada respuesta que le des consultale al usuario si podes ayudarlo con otra consulta o duda.\n
            - Si la repuesta contiene mucha información, resumila y presentasela al usuario. Luego consultale si quiere saber más detalle.
            - Solo si ya resolviste todas las dudas del usuario y el usuario no desea consultar más nada, escribe la siguiente palabra con este formato: {{FIN}}.`
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
            
            
            chattest = modelo.startChat({
            generationConfig: {
                maxOutputTokens: 200,  // Adjust based on desired response length
                /*temperature:0.3,
                topP:0.8,
                topK:20*/
            },
            history: [/*{
                  role: "user",
                  parts: [{ text: `Sos Santiago, el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina. Necesito ayuda para resolver algunas dudas. Utiliza solamente el contexto proporcionado para responder.`}],
                },
                {
                  role: "model",
                  parts: [{ text: `Ok.`}],
                },*/
                  ...newHistory],
              cachedContent: cache.name
            });
            const lastExpireTime = (await cacheManager.get(cache.name)).expireTime
            await ctxFn.state.update({expireTime:lastExpireTime})
            await ctxFn.state.update({chattest:chattest})
            await ctxFn.state.update({modelo:modelo}) 
            console.log(expireTime)         
        }
        
        
        const response = await chattest.sendMessage(ctx.body.trimEnd());
        const resp = response.response.text().trimEnd();
        if(resp === '{{FIN}}'){
          return ctxFn.gotoFlow(finFlow)
        }
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
        const limitedHistory = updatedHistory.slice(-10);

        //chattest.history = updatedHistory;
        chattest.history = limitedHistory;

        console.log(chattest.history)
       

        /*const lastExpireTime = (await cacheManager.get(cache.name)).expireT
        ime
        await ctxFn.state.update({expireTime:lastExpireTime})*/
        await ctxFn.state.update({history:limitedHistory})
        await ctxFn.state.update({chattest:chattest})
        await ctxFn.state.update({modelo:modelo})
        console.log(`Cantidad Token Entrada:${response.response.usageMetadata.promptTokenCount}`);
        console.log(`Cantidad Token Resp:${response.response.usageMetadata.candidatesTokenCount}`);
        console.log(`Cantidad Total Token:${response.response.usageMetadata.totalTokenCount}`);
        
    }
  )

export {faqFlow}
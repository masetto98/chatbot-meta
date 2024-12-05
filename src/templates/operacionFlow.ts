import {  addKeyword, EVENTS} from '@builderbot/bot'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { cargarInstrucciones } from 'utils/utils';
import { DatosUsuario } from 'utils/visitas';
import { generatePrompt } from '~/scripts/prompt';
import 'dotenv/config'
import { config } from '~/config';
import { agenteFlow } from './agenteFlow';
import { agendarFlowAlquiler } from './agendarFlowAlquiler';




const genAI = new GoogleGenerativeAI(config.ApiKey);
const cacheManager = new GoogleAICacheManager(config.ApiKey)

let cache;

const operacionFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, ctxFn) => {
        
        const name = ctx?.pushName ?? ''
        const newHistory = (ctxFn.state.getMyState()?.history ?? [])
        const expireTime = (ctxFn.state.getMyState()?.expireTime ?? String)
        let modelo = await ctxFn.state.get('modelo');
        let chattest= await ctxFn.state.get('chattest')
        //let cache = await ctxFn.state.get('cache')
       // Si el cache no está creado o si esta creado pero ya expiró inicializó todo nuevamente
        if(!cache || expireTime < new Date().toISOString() || !modelo){
            
            const displayName = 'propiedades'
            //const model = 'models/gemini-1.5-flash-001'
            const model = 'models/gemini-1.5-flash-8b'
            
            const contexto = await generatePrompt(name)
            console.log(contexto)
            //const systemInstruction = `Sos Santiago, el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina. Utiliza solamente el contexto proporcionado para responder.`
            const systemInstruction = await cargarInstrucciones()
            const ttlSeconds = 600 // Asignacion de la cantidad de segundos que esta disponible el cache
            cache = await cacheManager.create({
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
            modelo = genAI.getGenerativeModelFromCachedContent(cache)
          
            chattest = modelo.startChat({
            generationConfig: {
                maxOutputTokens: 300,  // Adjust based on desired response length
                temperature:0.2,
                /*topP:0.8,
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
            await ctxFn.state.update({chattest:chattest})
            await ctxFn.state.update({modelo:modelo})     
           // await ctxFn.state.update({cache:cache})   
        }
      
        
        const response = await chattest.sendMessage(ctx.body.trimEnd());
        let resp = response.response.text().trimEnd();
        //const patron = /{{nombre: (.*)}},{{horario: (.*)}}, {{enlace: (.*)}}/;
        const patron = /{{cliente: (.*)}},{{enlace: (.*)}},{{VISITA}}/;
        const coincidencia = patron.exec(resp);
        if(coincidencia){
          const datos: DatosUsuario = {
            nombre: coincidencia[1],
            //horario: coincidencia[2],
            enlace: coincidencia[2],
            telefono: ctx.from,
            fecha: new Date()
          };
          await ctxFn.state.update({cliente:datos.nombre})
          await ctxFn.state.update({propiedad:datos.enlace})
          await ctxFn.state.update({tel:datos.telefono})
          
         // Asigna el resultado de replace a resp
          resp = resp.replace(patron, ' ').trimStart();
          await ctxFn.state.update({history:undefined})
          await ctxFn.state.update({chattest:undefined})
          await ctxFn.state.update({modelo:undefined})
          return ctxFn.gotoFlow(agendarFlowAlquiler)/*
          actualizarExcel('./visitas.xlsx',datos);
          console.log(datos);*/
        }
        
        const patron2 = /{{cliente: (.*)}},{{enlace: (.*)}},{{AGENTE}}/;
        const coincidencia2 = patron2.exec(resp);
        if(coincidencia2){
          const datos: DatosUsuario = {
            nombre: coincidencia2[1],
            //horario: coincidencia[2],
            enlace: coincidencia2[2],
            telefono: ctx.from,
            fecha: new Date()
          };
          await ctxFn.state.update({cliente:datos.nombre})
          await ctxFn.state.update({propiedad:datos.enlace})
          await ctxFn.state.update({tel:datos.telefono})
          await ctxFn.state.update({history:undefined})
          await ctxFn.state.update({chattest:undefined})
          await ctxFn.state.update({modelo:undefined})
          return ctxFn.gotoFlow(agenteFlow)
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
        
        //Limito el historial a los ultimos 10 mensajes(ultimas 5 interacciones completas user-model)
        
        const limitedHistory = updatedHistory.slice(-10);

      
        chattest.history = limitedHistory;

        await ctxFn.state.update({history:limitedHistory})
        await ctxFn.state.update({chattest:chattest})
        await ctxFn.state.update({modelo:modelo})
        console.log(`Cantidad Token Entrada:${response.response.usageMetadata.promptTokenCount}`);
        console.log(`Cantidad Token Resp:${response.response.usageMetadata.candidatesTokenCount}`);
        console.log(`Cantidad Total Token:${response.response.usageMetadata.totalTokenCount}`);
        
    }
  )



export {operacionFlow}
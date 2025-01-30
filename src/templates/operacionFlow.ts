import {  addKeyword, EVENTS} from '@builderbot/bot'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { cargarInstrucciones, cargarIntencionUser } from 'utils/utils';
import { DatosUsuario } from 'utils/visitas';
import { generatePrompt } from '~/scripts/prompt';
import 'dotenv/config'
import { config } from '~/config';
import { agenteFlow } from './agenteFlow';
import { agendarFlowAlquiler } from './agendarFlowAlquiler';





const genAI = new GoogleGenerativeAI(config.ApiKey);
const cacheManager = new GoogleAICacheManager(config.ApiKey)

//let cache;

const operacionFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, ctxFn) => {
        
        const receivedTime = new Date().getTime(); // Timestamp actual en milisegundos
        const messageTimestamp = ctx.timestamp ? new Date(ctx.timestamp * 1000).getTime() : new Date().getTime(); // Convertimos a timestamp


        console.log("📩 Mensaje recibido:");
        console.log("Texto:", ctx.body);
        console.log("Hora del mensaje:", messageTimestamp);
        console.log("Hora actual:", receivedTime);
        console.log("Diferencia de tiempo (ms):", receivedTime - messageTimestamp);

        if (receivedTime - messageTimestamp > 30 * 1000) { 
            console.warn("⚠️ Mensaje retrasado detectado. Ignorando...");
            return;
        }

        const name = ctx?.pushName ?? ''
        const newHistory = (ctxFn.state.getMyState()?.history ?? [])
        const expireTime = (ctxFn.state.getMyState()?.expireTime ?? String)
        const lastInteraction = ctxFn.state.get('lastInteraction'); // Guardar timestamp del último mensaje del usuario
        console.log('Estado actual:', ctxFn.state.getMyState());
        console.log('Historial antes de enviar mensaje:', newHistory);
        console.log('Última interacción del usuario:', lastInteraction);
        console.log('Mensaje entrante:', ctx.body);
        // Validar si hay interacción del usuario
        if (!ctx.body || !ctx.body.trimEnd()) {
          console.warn('No hay mensaje del usuario.');
          return; // Salir del flujo si no hay mensaje
        }
        let modelo = await ctxFn.state.get('modelo');
        let chattest= await ctxFn.state.get('chattest')
        //let cache;
        let cache = await ctxFn.state.get('cache')
       // Si el cache no está creado o si esta creado pero ya expiró inicializó todo nuevamente
        if(!cache || expireTime < new Date().toISOString() || !modelo){
            console.log('Creando un nuevo caché...');
            const displayName = 'propiedades'
            const model = 'models/gemini-1.5-flash-latest'
            
            //const model = 'models/gemini-1.5-flash-001'
            //const model = 'models/gemini-1.5-flash-8b'
            //const model = 'models/gemini-1.5-flash-8b-001'
            
            const contexto = await generatePrompt(name)
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
                            parts: [{text: JSON.stringify(contexto)}],
                            },
                        ],
                        ttlSeconds,
                        })
            modelo = genAI.getGenerativeModelFromCachedContent(cache)
            chattest = modelo.startChat({
            generationConfig: {
                maxOutputTokens: 370,  // Adjust based on desired response length
                /*temperature:0.3,
                topP:0.2,
                topK:2,*/
            },
            history: [{
                  role: "user",
                  parts: [{ text: `Sos Santiago, el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina. Siempre utiliza las instrucciones proporcionadas para responder.`}],
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
            await ctxFn.state.update({cache:cache})   
        }
      
        // Validar si el último mensaje del usuario está dentro de las 24 horas
       
        if (lastInteraction) {
          const lastInteractionDate = new Date(lastInteraction);
      
          if (!isNaN(lastInteractionDate.getTime()) && (new Date().getTime() - lastInteractionDate.getTime() > 24 * 60 * 60 * 1000)) {
              console.warn('El usuario no interactuó en las últimas 24 horas. No se puede enviar mensaje.');
              return; // No enviar mensaje
          }
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
          await ctxFn.state.update({ history: [] }); // Limpia el historial después de responder
          await ctxFn.state.update({chattest:undefined})
          await ctxFn.state.update({modelo:undefined})
          await ctxFn.state.update({cache:undefined})
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
          await ctxFn.state.update({ history: [] });
          await ctxFn.state.update({chattest:undefined})
          await ctxFn.state.update({modelo:undefined})
          await ctxFn.state.update({cache:undefined})
          return ctxFn.gotoFlow(agenteFlow)
        }
        const patron3 = /{{tipoPropiedad: (.*)}},{{caracteristica: (.*)}},{{presupuesto: (.*)}},{{zona: (.*)}},{{INTENCION}}/;
        const coincidencia3 = patron3.exec(resp);
        if(coincidencia3){
          
          const tipoProp = coincidencia3[1]
          const caracteristica = coincidencia3[2]
          const presupuesto = coincidencia3[3]
          const zona = coincidencia3[4]
          const tel = ctx.from
          const sessionID = await ctxFn.state.get('sessionId');
          cargarIntencionUser(tipoProp,caracteristica,presupuesto,zona,'Alquiler',tel,sessionID,name)
          resp = resp.replace(patron3, '').trimStart();
          /*
          const values = [[ctx.from, coincidencia3[1], coincidencia3[2],coincidencia3[3]]];
          const sql = 'INSERT INTO interations (phoneNumber, propertyType, featureProperty,estimatedMoney) values ?';
          pool.query(sql, [values]);  
          console.log(`tipoProp: ${coincidencia3[1]},caracte: ${coincidencia3[2]},presup:${coincidencia3[3]}`)*/
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
        
        const limitedHistory = updatedHistory.slice(-20);
        chattest.history = limitedHistory;


      

        // Actualizar el timestamp de interacción
        await ctxFn.state.update({lastInteraction: new Date().toISOString() });
        await ctxFn.state.update({history:limitedHistory})
        await ctxFn.state.update({chattest:chattest})
        await ctxFn.state.update({modelo:modelo})
        await ctxFn.state.update({cache:cache})
        console.log(`Cantidad Token Entrada:${response.response.usageMetadata.promptTokenCount}`);
        console.log(`Cantidad Token Resp:${response.response.usageMetadata.candidatesTokenCount}`);
        console.log(`Cantidad Total Token:${response.response.usageMetadata.totalTokenCount}`);
        
    }
  )



export {operacionFlow}
import {  addKeyword, EVENTS} from '@builderbot/bot'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { cargarInstrucciones, cargarIntencionUser } from 'utils/utils';
import { DatosUsuario } from 'utils/visitas';
import { generatePrompt } from '~/scripts/prompt';
import 'dotenv/config'
import { config } from '~/config';
import { agenteFlow } from './agenteFlow';
//import { agendarFlowAlquiler } from './agendarFlowAlquiler';





const genAI = new GoogleGenerativeAI(config.ApiKey);
const cacheManager = new GoogleAICacheManager(config.ApiKey)

//let cache;

const operacionFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, ctxFn) => {
        try {
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
        
        // Validar si hay interacción del usuario
        if (!ctx.body || !ctx.body.trimEnd()) {
          console.warn('No hay mensaje del usuario.');
          return; // Salir del flujo si no hay mensaje
        }
        let model = await ctxFn.state.get('modelo');
        let chattest= await ctxFn.state.get('chattest')
        let chatActual = await ctxFn.state.get('chat')
        let useCache = false; //
        /*let cache = await ctxFn.state.get('cache')
        // Si el cache no está creado o si esta creado pero ya expiró inicializó todo nuevamente
        if(!cache || expireTime < new Date().toISOString() || !modelo){
            console.log('Creando un nuevo caché...');
            const displayName = 'propiedades'
            const model = 'models/gemini-1.5-flash-001'
            //const model = 'models/gemini-1.5-flash-001'
            //const model = 'models/gemini-1.5-flash-8b'
            //const model = 'models/gemini-1.5-flash-8b-001'
            //gemini-1.5-flash
            
            const contexto = await generatePrompt(name)
            //const systemInstruction = `Sos Santiago, el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina. Utiliza solamente el contexto proporcionado para responder.`
            const systemInstruction = await cargarInstrucciones()
            const ttlSeconds = 900 // Asignacion de la cantidad de segundos que esta disponible el cache
            try {
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
                maxOutputTokens: 400,  // Adjust based on desired response length
                
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
          } catch(error){
            console.warn('Error al crear o usar la cache: ', error)
            useCache = false; // falla la cache uso el chat sin cache

          }   
        }
        */
        // Validar si el último mensaje del usuario está dentro de las 24 horas
       
        if (lastInteraction) {
          const lastInteractionDate = new Date(lastInteraction);
      
          if (!isNaN(lastInteractionDate.getTime()) && (new Date().getTime() - lastInteractionDate.getTime() > 24 * 60 * 60 * 1000)) {
              console.warn('El usuario no interactuó en las últimas 24 horas. No se puede enviar mensaje.');
              return; // No enviar mensaje
          }
        }
        let response;
        
        if (useCache && chattest) {
        /*// Usar la sesión de chat con caché
        console.log('Usando la sesión de chat con caché.');
        //const response = await chattest.sendMessage(ctx.body.trimEnd());
        response = await chattest.sendMessage(ctx.body.trimEnd());
        
        const updatedHistory = [...(chattest.history || []), { role: 'user', parts: [{ text: ctx.body }] }, { role: 'model', parts: [{ text: response.response.text() }] }];
        const limitedHistory = updatedHistory.slice(-20);
        chattest.history = limitedHistory;
        await ctxFn.state.update({ history: limitedHistory });
        await ctxFn.state.update({ chattest: chattest });
        await ctxFn.state.update({ modelo: modelo });
        await ctxFn.state.update({ cache: cache });*/
        }
        else{
          // usa una nueva sesión de chat sin cache
          if(!chatActual && !model){
            console.log('Iniciando una nueva sesión de chat sin caché.');
            model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash-001' });
            const systemInstruction = await cargarInstrucciones() || `Sos Santiago, el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina. Utiliza solamente el contexto proporcionado para responder.`;
            const contexto = await generatePrompt(name) || {};
            
            chatActual = model.startChat({
                generationConfig: {
                    maxOutputTokens: 400,
                },
                history: [
                    {
                        role: "user",
                        parts: [{ text: systemInstruction }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Ok." }],
                    },
                    ...newHistory,
                    {
                        role: "user",
                        parts: [{ text: JSON.stringify(contexto) }],
                    }
                ],
            });
          }
          response = await chatActual.sendMessage(ctx.body.trimEnd());
          const updatedHistory = [...newHistory, { role: 'user', parts: [{ text: ctx.body }] }, { role: 'model', parts: [{ text: response.response.text() }] }];
          const limitedHistory = updatedHistory.slice(-20);
          await ctxFn.state.update({ history: limitedHistory });
          // Limpiar las variables relacionadas con la caché para la próxima iteración
          await ctxFn.state.update({ chat: chatActual });
          await ctxFn.state.update({ modelo: model });
          await ctxFn.state.update({ cache: undefined });
          await ctxFn.state.update({ expireTime: undefined });
          console.log(`Cantidad Token Entrada:${response.response.usageMetadata.promptTokenCount}`);
          console.log(`Cantidad Token Resp:${response.response.usageMetadata.candidatesTokenCount}`);
          console.log(`Cantidad Total Token:${response.response.usageMetadata.totalTokenCount}`);
          
          
        }
        // FRAGMENTO PARA AGENDAR VISITAS EN CALENDAR

        /*
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
          return ctxFn.gotoFlow(agendarFlowAlquiler)
          console.log(datos);
        }
        */
        let resp = response.response.text().trimEnd();
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
          const sourcewebname = await ctxFn.state.get('fromwebsite');
          const sourceweburl = await ctxFn.state.get('url');
          console.log('carga interaccion')
          console.log(sourcewebname)
          console.log(sourceweburl)
          cargarIntencionUser(tipoProp,caracteristica,presupuesto,zona,'Alquiler',tel,sessionID,name,sourcewebname,sourceweburl)
          resp = resp.replace(patron3, '').trimStart();
          /*
          const values = [[ctx.from, coincidencia3[1], coincidencia3[2],coincidencia3[3]]];
          const sql = 'INSERT INTO interations (phoneNumber, propertyType, featureProperty,estimatedMoney) values ?';
          pool.query(sql, [values]);  
          console.log(`tipoProp: ${coincidencia3[1]},caracte: ${coincidencia3[2]},presup:${coincidencia3[3]}`)*/
        }
        await ctxFn.flowDynamic(resp);
        /*newHistory.push({
          role:'user',
          parts: [{ text: ctx.body}]
        })
        const updatedHistory = [...newHistory];
        updatedHistory.push({
            role: 'model',
            parts: [{ text: response.response.text() }],
        });*/
        
        //Limito el historial a los ultimos 10 mensajes(ultimas 5 interacciones completas user-model)
        
        //const limitedHistory = updatedHistory.slice(-20);
        //chattest.history = limitedHistory;

        // Actualizar el timestamp de interacción
        await ctxFn.state.update({lastInteraction: new Date().toISOString() });
        //await ctxFn.state.update({history:limitedHistory})
        await ctxFn.state.update({chat:chatActual})
        await ctxFn.state.update({modelo:model})
        //await ctxFn.state.update({cache:cache})
        
          
        }
        catch (error) {


        }
        
        
    }
  )



export {operacionFlow}
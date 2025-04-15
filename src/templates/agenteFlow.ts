import { addKeyword,EVENTS } from "@builderbot/bot"
import { createEvent } from "~/scripts/calendar"
import { stop } from "utils/idle-custom";
import { adapterDB } from "~/db"

function formatDateForMySQL(dateString: string): string {
    // Convertir la fecha de formato MM/DD/YYYY, HH:MM:SS AM/PM a un objeto Date
    const date = new Date(dateString); 
  
    // Verificar si la fecha fue parseada correctamente
    if (isNaN(date.getTime())) {
      throw new Error("Fecha inválida");
    }
  
    // Formatear la fecha en el formato YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses empiezan en 0
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

const agenteFlow = addKeyword(EVENTS.ACTION)                        
                        .addAction(async (ctx,ctxFn) => {
                            const eventName = "Contactar Cliente"
                            const name = await ctxFn.state.get('cliente')
                            const prop = await ctxFn.state.get('propiedad')
                            const tel = await ctxFn.state.get('tel')
                            const sessionID = await ctxFn.state.get('sessionId');
                            const description = `Nombre: ${name}, tel: ${tel}, asunto: le interesa ${prop}` 
                            const date = new Date()
                            date.setHours(date.getHours() + 1)
                            const eventId = await createEvent(eventName,description,date.toISOString(),0.1)
                            await ctxFn.state.update({intention:undefined})
                            try{
                                const dateforMySql = formatDateForMySQL(date.toLocaleString())
                                const values = [[ctx.from, name, eventId,dateforMySql,dateforMySql,'active',prop,sessionID,'Alquiler']];
                                const sql = 'INSERT INTO visits (phoneNumber, name, eventID,date,dateStartEvent,state,linkProperty,sessionId,operationType) values ?';
                                await adapterDB.db.promise().query(sql, [values]);    
                                await ctxFn.state.update({intention:undefined})
                                stop(ctx);
                                await ctxFn.state.update({timer:undefined})
                                await ctxFn.state.update({sessionId:undefined})
                                ctxFn.flowDynamic(`¡Genial! 🤗 Un agente ya fue notificado y se contactará a la brevedad. Ante cualquier otra consulta no dudes en escribirme.`)
                            }
                            catch(err){
                                console.error('Error al procesar la solicitud:', err);
                                return ctxFn.endFlow('Lo siento, ocurrió un problema. Por favor, intenta de nuevo más tarde.');
                            }
                        })
                        
                        


export{agenteFlow}
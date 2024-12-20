import { addKeyword,EVENTS } from "@builderbot/bot"
import { getUserVisits, text2iso } from "utils/utils"
import { createEvent, deleteEvent, getEventById, getNextAvailableSlot, isDateAvailable } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow"
import { adapterDB } from "~/db"
import { stop } from "utils/idle-custom";
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
// Función para formatear la fecha en palabras
function formatDateInWords(date) {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const dayName = days[date.getDay()];
    const dayNumber = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    const formattedTime = `${hours % 12 || 12}:${minutes} ${ampm}`;
    return `${dayName} ${dayNumber} de ${monthName} ${year} a las ${formattedTime}`;
}

const afirmative3 = addKeyword('Sí')
                    .addAction(async (ctx,ctxFn) => {
                        
                        try {
                            // Obtén el EventID del estado
                            const EventID = ctxFn.state.get('EventID');
                            console.log(EventID);
                        
                            // Borra el evento (función deleteEvent)
                            await deleteEvent(EventID);
                        
                            // Actualiza la base de datos usando parámetros para evitar inyección SQL
                            const sql = `UPDATE visits SET state = ? WHERE eventID = ?`;
                            await adapterDB.db.promise().query(sql, ['deleted', EventID]);
                        
                            // Limpia los estados y finaliza el flujo
                            await ctxFn.state.update({ intention: undefined });
                            stop(ctx);
                            await ctxFn.state.update({ timer: undefined });
                            return ctxFn.endFlow('La visita ha sido cancelada 🤗. Ante cualquier otra consulta no dudes en escribirme.');
                        } catch (err) {
                            console.error('Error al procesar la solicitud:', err);
                            return ctxFn.endFlow('Lo siento, ocurrió un problema al cancelar la visita. Por favor, intenta de nuevo más tarde.');
                        }
                        
                        /*
                        const EventID = ctxFn.state.get('EventID')
                        console.log(EventID)
                        await deleteEvent(EventID)
                        const sql = `UPDATE visits SET state = 'deleted' WHERE eventID = '${EventID}'`;
                        pool.query(sql);
                        await ctxFn.state.update({intention:undefined})
                        stop(ctx);
                        await ctxFn.state.update({timer:undefined})
                        return ctxFn.endFlow('La visita ha sido cancelada 🤗. Ante cualquier otra consulta no dudes en escribirme.')*/

                    })
const negative3 = addKeyword('No')
                    .addAction(async (ctx,ctxFn) => {
                        stop(ctx);
                        await ctxFn.state.update({timer:undefined})
                        return ctxFn.gotoFlow(welcomeFlow)})

const afirmativeChangeEvent = addKeyword('Reagendar')
                                .addAction(async (ctx,ctxFn) => {
                                    
                                    try{
                                        const EventID = ctxFn.state.get('EventID')
                                        console.log(EventID)
                                        await deleteEvent(EventID)
                                        // Actualiza la base de datos usando parámetros para evitar inyección SQL
                                        const sql = `UPDATE visits SET state = ? WHERE eventID = ?`;
                                        await adapterDB.db.promise().query(sql, ['modified', EventID]);
                                        return await ctxFn.gotoFlow(visitaFlowAlquiler)
                                    } catch (err) {
                                        console.error('Error al procesar la solicitud:', err);
                                        return ctxFn.endFlow('Lo siento, ocurrió un problema al reagendar la visita. Por favor, intenta de nuevo más tarde.');
                                    }
                                    
                                    /*
                                    const EventID = ctxFn.state.get('EventID')
                                    console.log(EventID)
                                    await deleteEvent(EventID)
                                    const sql = `UPDATE visits SET state = 'modified' WHERE eventID = '${EventID}'`;
                                    pool.query(sql);
                                    return await ctxFn.gotoFlow(visitaFlowAlquiler)*/
                        })

const negativeChangeEventAlq = addKeyword('Cancelar')
                            .addAnswer('¿Estás seguro que queres cancelar la visita pendiente?',{
                                capture:true,
                                buttons: [
                                {body:'Sí'},
                                {body:'No'},
                                ]
                                },null,[afirmative3,negative3])
                            
const salirChangeEvent = addKeyword('Salir')
                            .addAction(async (ctx,ctxFn) => {
                            await ctxFn.state.update({intention:undefined})
                            stop(ctx);
                            await ctxFn.state.update({timer:undefined})
                            return ctxFn.endFlow('Espero haberte ayudado 🤗, gracias por comunicarte. Ante cualquier otra consulta no dudes en escribirme.')
                            })
const newChangeEvent = addKeyword('Nueva visita')
                            .addAction(async (ctx,ctxFn) => {
                            return ctxFn.gotoFlow(visitaFlowAlquiler)
                            })

const changeEventAlquiler =  addKeyword(EVENTS.ACTION)
                     .addAnswer('Elegí una de las opciones para continuar..🤗',{
                        capture:true,
                        buttons: [
                            {body:'Nueva visita'},
                           // {body:'Reagendar'},
                           // {body:'Cancelar'},
                            {body:'Salir'},
                        ]
                        },null,[afirmativeChangeEvent,negativeChangeEventAlq,salirChangeEvent,newChangeEvent])

const afirmativeFlow2 = addKeyword('Sí')
                        .addAction(async (ctx,ctxFn) => {
                            return ctxFn.gotoFlow(welcomeFlow)
                            
                            }
                    
                )
const negativeFlow2 = addKeyword('No')
                        .addAction(async (ctx,ctxFn) => {
                            await ctxFn.state.update({intention:undefined})
                            return ctxFn.endFlow('Espero haberte ayudado 🤗, gracias por comunicarte. Ante cualquier otra consulta no dudes en escribirme.')
                        })                       


const afirmativeFlow = addKeyword('Sí')
                        .addAction(async (ctx,ctxFn) => {
                                
                                const name = await ctxFn.state.get('cliente')
                                const propiedad = await ctxFn.state.get('propiedad')
                                const tel = await ctxFn.state.get('tel')
                               // const name = ctx?.pushName ?? ''
                                const eventName = "Visita"
                                const description = `Nombre: ${name}, tel: ${tel}, propiedad interesada: ${propiedad}`
                                let date;
                                let dateFormat;
                                let presentDate;
                                const startDate = ctxFn.state.get('startDate')
                                const nextAvailableslot = ctxFn.state.get('nextAvailableslot')
                                
                                if(!nextAvailableslot){
                                    date = startDate.toISOString()
                                    dateFormat = startDate.toLocaleString()
                                    presentDate = startDate
                                }
                                else{

                                    date = nextAvailableslot.start.toISOString()
                                    dateFormat = nextAvailableslot.start.toLocaleString()
                                    presentDate = nextAvailableslot.start

                                }
                                
                            
                                const dateforMySql = formatDateForMySQL(dateFormat)
                                console.log(dateforMySql)
                                
                                try{
                                    const eventId = await createEvent(eventName,description,date)
                                    const values = [[ctx.from, name, eventId,dateforMySql,'active',propiedad]];
                                    const sql = 'INSERT INTO visits (phoneNumber, name, eventID,dateStartEvent,state,linkProperty) values ?';
                                    await adapterDB.db.promise().query(sql, [values]);    
                                    stop(ctx);
                                    await ctxFn.state.update({timer:undefined})  
                                    ctxFn.flowDynamic(`¡Genial! 🤗 la cita ha sido agendada para el ${formatDateInWords(presentDate)}. Nos vemos pronto.`)
                                }
                                catch(err){
                                    console.error('Error al procesar la solicitud:', err);
                                    return ctxFn.endFlow('Lo siento, ocurrió un problema al agendar la visita. Por favor, intenta de nuevo más tarde.');
                                }
                                
                                //finalizo session
                                await ctxFn.state.update({sessionId:undefined})
                                /*
                                const eventId = await createEvent(eventName,description,date)
                                const values = [[ctx.from, name, eventId,dateforMySql,'active']];
                                const sql = 'INSERT INTO visits (phoneNumber, name, eventID,dateStartEvent,state) values ?';
                                pool.query(sql, [values]);     
                                stop(ctx);
                                await ctxFn.state.update({timer:undefined}) 
                                ctxFn.flowDynamic(`¡Genial! 🤗 la cita ha sido agendada para el ${formatDateInWords(presentDate)}. Nos vemos pronto.`)*/
                            
                                
                                
    },null,[changeEventAlquiler]
)
.addAnswer(`¿Necesitas que te ayude con otra consulta?`,{
    capture:true,
    buttons: [
        {body:'Sí'},
        {body:'No'},
    ]
    },null,[afirmativeFlow2,negativeFlow2])

    

const negativeFlow = addKeyword('No')
                        .addAction(async (ctx,ctxFn) => {
                               return ctxFn.gotoFlow(agendarFlowAlquiler)
                                
    }
)


const availableFlow = addKeyword(EVENTS.ACTION)
                        .addAnswer(`😄 ¡Tengo disponibilidad para la fecha/hora solicitada! ¿Querés confirmar la visita?`,{
                        capture:true,
                        buttons: [
                            {body:'Sí'},
                            {body:'No'},
                        ]
                        },null,[afirmativeFlow,negativeFlow])

const noavailableFlow = addKeyword(EVENTS.ACTION)                        
                        .addAnswer('¿Querés confirmar la visita?'
                        ,{
                            capture:true,
                            buttons: [
                                {body:'Sí'},
                                {body:'No'},
                            ]
                        },
                        null
                        ,[afirmativeFlow,negativeFlow])
   

const visitaFlowAlquiler = addKeyword(EVENTS.ACTION)
    .addAnswer('😄 ¡Perfecto! Por favor, indicame que día y horario te parece conveniente para la visita',{
        capture:true,
    })
    .addAction(async (ctx,ctxFn) => {
        console.log(ctx.body)
        const solicitedDate = await text2iso(ctx.body)
        let clearStartDate = undefined;
        let clearNextAvailableslot = undefined;
        await ctxFn.state.update({startDate:clearStartDate})
        await ctxFn.state.update({nextAvailableslot:clearNextAvailableslot})
        console.log("Fecha solicitada: " + solicitedDate)
        if(solicitedDate.includes('false')){
            return ctxFn.endFlow('No se pudo deducir una fecha. Por favor, volve a intentarlo')
        
        }
        const startDate = new Date(solicitedDate)
        
        if(startDate > new Date()){
            console.log("Start Date: " + startDate)

            const dateAvailable = await isDateAvailable(startDate)
            console.log('Is Date Available: ' + dateAvailable)
            if(dateAvailable){
            /* const name = ctx?.pushName ?? ''
                const eventName = "Visita"
                const description = `Nombre: ${name}, tel: ${ctx.from}` 
                const date = startDate.toISOString()
                const eventId = await createEvent(eventName,description,date)
                ctxFn.flowDynamic('La fecha solicitada se encuentra disponible y la cita ha sido agendada')*/
                await ctxFn.state.update({startDate:startDate})
                return ctxFn.gotoFlow(availableFlow)
            }
            else{
                const nextAvailableslot = await getNextAvailableSlot(startDate)
                await ctxFn.state.update({nextAvailableslot:nextAvailableslot})
                await ctxFn.flowDynamic(`😅 ¡No tengo disponibilidad para la fecha/hora solicitada! Te parece si lo agendamos para el día: ${formatDateInWords(nextAvailableslot.start)}`)
                return await ctxFn.gotoFlow(noavailableFlow)
            }

        }
        else{
            return ctxFn.fallBack('La fecha/hora solicitada no está disponible. Porfavor, intentalo nuevamente.')
        }
        
},null,[availableFlow,noavailableFlow])
    
const agendarFlowAlquiler = addKeyword(EVENTS.ACTION)
                    .addAction(async (ctx,ctxFn) => {
                        const events = await getUserVisits(ctx.from);
                        console.log("Contenido de events:", events);
                        console.log("Longitud de events:", events?.length || 0);
                        let index = 0;
                        if(events.length > 0){
                           await ctxFn.flowDynamic(`Recordá que tenes las siguientes *visitas pendientes:*`)
                           for(let event of events) {
                                index++;
                                const eventId = event.eventID;
                                const linkProperty = event.linkProperty
                                const dateStartEvent = event.dateStartEvent
                                let Event = await getEventById(eventId);
                                await ctxFn.state.update({EventID:eventId})
                                await ctxFn.state.update({dateStartEvent:dateStartEvent})
                                await ctxFn.flowDynamic(`*${index}.* Fecha: ${dateStartEvent.toLocaleString()} Propiedad: ${linkProperty}`)
                            }
                            return ctxFn.gotoFlow(changeEventAlquiler)

                        }
                        else {
                            return await ctxFn.gotoFlow(visitaFlowAlquiler)
                        }

                        },null,[changeEventAlquiler,visitaFlowAlquiler])

export {agendarFlowAlquiler,visitaFlowAlquiler,changeEventAlquiler,negativeChangeEventAlq}
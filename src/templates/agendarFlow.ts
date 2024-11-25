import { addKeyword,EVENTS } from "@builderbot/bot"
import { getUserVisits, text2iso } from "utils/utils"
import { createEvent, deleteEvent, getEventById, getNextAvailableSlot, isDateAvailable } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow"
import { pool } from "~/db"
import { createContext } from "vm"

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

const afirmative3 = addKeyword('Sí')
                    .addAction(async (ctx,ctxFn) => {
                        const EventID = ctxFn.state.get('EventID')
                        console.log(EventID)
                        await deleteEvent(EventID)
                        const sql = `UPDATE visits SET state = 'deleted' WHERE eventID = '${EventID}'`;
                        pool.query(sql);
                        await ctxFn.state.update({intention:undefined})
                        return ctxFn.endFlow('La visita ha sido cancelada 🤗. Si necesitas ayuda con otra consulta escribe *menu*.')

                    })
const negative3 = addKeyword('No')
                    .addAction(async (ctx,ctxFn) => {return ctxFn.gotoFlow(welcomeFlow)})

const afirmativeChangeEvent = addKeyword('Reagendar')
                                .addAction(async (ctx,ctxFn) => {
                                    const EventID = ctxFn.state.get('EventID')
                                    console.log(EventID)
                                    await deleteEvent(EventID)
                                    return await ctxFn.gotoFlow(visitaFlow)
                        })

const negativeChangeEvent = addKeyword('Cancelar')
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
                            return ctxFn.endFlow('Espero haberte ayudado 🤗, gracias por comunicarte. Escribe *menu* para realizar otra consulta.')
                            })

const changeEvent =  addKeyword(EVENTS.ACTION)
                     .addAnswer('¿Queres cancelar o reagendar la visita?🤗',{
                        capture:true,
                        buttons: [
                            {body:'Reagendar'},
                            {body:'Cancelar'},
                            {body:'Salir'},
                        ]
                        },null,[afirmativeChangeEvent,negativeChangeEvent,salirChangeEvent])

const afirmativeFlow2 = addKeyword('Sí')
                        .addAction(async (ctx,ctxFn) => {
                            return ctxFn.gotoFlow(welcomeFlow)
                            
                            }
                    
                )
const negativeFlow2 = addKeyword('No')
                        .addAction(async (ctx,ctxFn) => {
                            await ctxFn.state.update({intention:undefined})
                            return ctxFn.endFlow('Espero haberte ayudado 🤗, gracias por comunicarte. Escribe *menu* para realizar otra consulta.')
                        })                       


const afirmativeFlow = addKeyword('Sí')
                        .addAction(async (ctx,ctxFn) => {
                                console.log(ctx.body)
                                const name = await ctxFn.state.get('cliente')
                                const propiedad = await ctxFn.state.get('propiedad')
                                const tel = await ctxFn.state.get('tel')
                               // const name = ctx?.pushName ?? ''
                                const eventName = "Visita"
                                const description = `Nombre: ${name}, tel: ${tel}, propiedad interesada: ${propiedad}`
                                let date;
                                let dateFormat;
                                const startDate = ctxFn.state.get('startDate')
                                const nextAvailableslot = ctxFn.state.get('nextAvailableslot')
                                
                                if(!nextAvailableslot){
                                    date = startDate.toISOString()
                                    dateFormat = startDate.toLocaleString()
                                    
                                }
                                else{

                                    date = nextAvailableslot.start.toISOString()
                                    dateFormat = nextAvailableslot.start.toLocaleString()
                                   

                                }
                                
                            
                                const dateforMySql = formatDateForMySQL(dateFormat)
                                console.log(dateforMySql)
                                const eventId = await createEvent(eventName,description,date)
                                const values = [[ctx.from, name, eventId,dateforMySql,'active']];
                                const sql = 'INSERT INTO visits (phoneNumber, name, eventID,dateStartEvent,state) values ?';
                                pool.query(sql, [values]);      
                                ctxFn.flowDynamic(`¡Genial! 🤗 la cita ha sido agendada para el ${dateFormat}. Nos vemos pronto.`)
                            
                                
                                
    },null,[changeEvent]
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
                               return ctxFn.gotoFlow(agendarFlow)
                                
    }
)


const availableFlow = addKeyword(EVENTS.ACTION)
                        .addAnswer(`😄 ¡Tengo disponibilidad para la fecha solicitada! ¿Querés confirmar la visita?`,{
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
   

const visitaFlow = addKeyword(EVENTS.ACTION)
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
                await ctxFn.flowDynamic(`😅 ¡No tengo disponibilidad para la fecha solicitada! Te parece si lo agendamos para el día: ${nextAvailableslot.start.toLocaleString()}`)
                return await ctxFn.gotoFlow(noavailableFlow)
            }

        }
        else{
            return ctxFn.fallBack('La fecha solicitada no está disponible. Porfavor, intentalo nuevamente.')
        }
        
},null,[availableFlow,noavailableFlow])
    
const agendarFlow = addKeyword(EVENTS.ACTION)
                    .addAction(async (ctx,ctxFn) => {
                        
                        const events = await getUserVisits(ctx.from);
                        console.log("Contenido de events:", events);
                        console.log("Longitud de events:", events?.length || 0);
                        if(events.length > 0){
                           for(let event of events) {
                                const eventId = event.eventID;
                                const dateStartEvent = event.dateStartEvent // Asegúrate de que la columna de tu base de datos se llame 'eventID'
                                let Event = await getEventById(eventId);
                                await ctxFn.state.update({EventID:eventId})
                                await ctxFn.state.update({dateStartEvent:dateStartEvent})
                                console.log(Event)
                                ctxFn.flowDynamic(`Tenes una visita pendiente el ${dateStartEvent.toLocaleString()}`)
                            }
                            return ctxFn.gotoFlow(changeEvent)

                        }
                        else {
                            return await ctxFn.gotoFlow(visitaFlow)
                        }

                        },null,[changeEvent,visitaFlow])

export {agendarFlow,visitaFlow,changeEvent,negativeChangeEvent}
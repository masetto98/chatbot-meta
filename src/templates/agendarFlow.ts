import { addKeyword,EVENTS } from "@builderbot/bot"
import { text2iso } from "utils/utils"
import { createEvent, getNextAvailableSlot, isDateAvailable } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow"


const afirmativeFlow2 = addKeyword('Sí')
                        .addAction(async (ctx,ctxFn) => {
                            return ctxFn.gotoFlow(welcomeFlow)
                        })
const negativeFlow2 = addKeyword('No')
                        .addAction(async (ctx,ctxFn) => {
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
                               
                                const eventId = await createEvent(eventName,description,date)
                                ctxFn.flowDynamic(`¡Genial! 🤗 la cita ha sido agendada para el ${dateFormat}. Nos vemos pronto.`)
                            
                                
                                
    }
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
                        
const agendarFlow = addKeyword(EVENTS.ACTION)
    .addAnswer('😄 ¡Perfecto! Por favor, indicame que día y horario te parece conveniente para la visita',{
        capture:true
    })
    .addAction(async (ctx,ctxFn) => {
        const solicitedDate = await text2iso(ctx.body)
        let clearStartDate = undefined;
        let clearNextAvailableslot = undefined;
        await ctxFn.state.update({startDate:clearStartDate})
        await ctxFn.state.update({startDate:clearNextAvailableslot})
        console.log("Fecha solicitada: " + solicitedDate)
        if(solicitedDate.includes('false')){
            return ctxFn.endFlow('No se pudo deducir una fecha. Por favor, volve a intentarlo')
        
        }
        const startDate = new Date(solicitedDate)
        
        
        if(startDate.toLocaleString() >= new Date().toLocaleString()){
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
    

export {agendarFlow}
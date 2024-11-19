import { addKeyword,EVENTS } from "@builderbot/bot"
import { text2iso } from "utils/utils"
import { createEvent, getNextAvailableSlot, isDateAvailable, listAvailableSlots } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow";
import { authorizeGmail, getAccessToken, sendEmail } from 'src/scripts/gmailServices';
let startDate;
let nextAvailableslot;


const afirmativeFlow = addKeyword('Sí')
                        .addAnswer('🙌 Antes de agendar la reunión, queremos conocer algunos detalles...')
                        .addAnswer('¿En qué localidad estas interesado comprar?',{
                            capture:true
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({localidad:ctx.body})
                        })
                        .addAnswer('¿Qué tipo de propiedad estás buscando?',{
                            capture:true
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({tipoPropiedad:ctx.body})
                        })
                        .addAnswer('¿Tenés algun presupuesto en mente?',{
                            capture:true
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({presupuesto:ctx.body})
                        })
                        .addAnswer('Por último, indicame tu nombre y apellido',{
                            capture:true
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({cliente:ctx.body})
                        })
                        .addAction(async (ctx,ctxFn) => {
                            const eventName = "Potencial Venta"
                            const name = await ctxFn.state.get('cliente')
                            const localidad = await ctxFn.state.get('localidad')
                            const tipoProp = await ctxFn.state.get('tipoPropiedad')
                            const presp = await ctxFn.state.get('presupuesto')
                            const description = `Nombre: ${name}, tel: ${ctx.from}, asunto: le interesa ${tipoProp} en ${localidad} y tiene un presupuesto de ${presp}` 
                            const date = new Date()
                            date.setHours(date.getHours() + 1)
                            const eventId = await createEvent(eventName,description,date.toISOString(),0.1)
                            ctxFn.flowDynamic(`¡Genial! 🤗 Un agente se contactará a la brevedad. Para volver al menú principal escribe *menu*.`)
                        })
                        
                        


const negativeFlow = addKeyword('No').addAction(async(ctx,ctxFn) => {
    return ctxFn.gotoFlow(welcomeFlow)
})

const agendarVtaFlow = addKeyword(EVENTS.ACTION)
    .addAnswer('😄 ¡Perfecto! Por favor, indicame que día y horario te parece conveniente para que uno de nuestros agentes se comunique con vos',{
        capture:true
    })
    .addAction(async (ctx,ctxFn) => {
        console.log('asd')
        const solicitedDate = await text2iso(ctx.body)
        console.log("Fecha solicitada: " + solicitedDate)
        /*if(solicitedDate.includes('false')){
            return ctxFn.fallBack('La fecha solicitada no está disponible. Porfavor, intentalo nuevamente.')
        }
        startDate = new Date(solicitedDate)
        if(startDate >= new Date()){
            console.log("Start Date: " + startDate)
            const slots = await listAvailableSlots(startDate)
            console.log(slots)
        }*/
    })
    
                    

const ventasFlow = addKeyword(EVENTS.ACTION)
    .addAnswer('😄 ¡Genial! Estamos para ayudarte a encontrar la propiedad de tus sueños. 🤗 ¿Coordinamos una reunión para conocer más en detalle tus necesidades?'
        ,{
        capture:true,
        buttons: [
            {body:'Sí'},
            {body:'No'},
        ]
    },null,[afirmativeFlow,negativeFlow])
    

export {ventasFlow}
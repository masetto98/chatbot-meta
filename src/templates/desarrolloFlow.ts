import { addKeyword,EVENTS } from "@builderbot/bot"
import { createEvent } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow";



const afirmativeFlow = addKeyword('Sí')
                        .addAnswer('🙌 Antes de agendar la reunión, queremos conocer algunos detalles...')
                        .addAnswer('¿Qué tipo de propiedad estás buscando?',{
                            capture:true,
                            delay:2000,
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
                            const eventName = "Desarrollo"
                            const name = await ctxFn.state.get('cliente')
                            const tipoProp = await ctxFn.state.get('tipoPropiedad')
                            const presp = await ctxFn.state.get('presupuesto')
                            const description = `Nombre: ${name}, tel: ${ctx.from}, asunto: le interesa ${tipoProp} y tiene un presupuesto de ${presp}` 
                            const date = new Date()
                            date.setHours(date.getHours() + 1)
                            const eventId = await createEvent(eventName,description,date.toISOString(),0.1)
                            await ctxFn.state.update({intention:undefined})
                            ctxFn.flowDynamic(`¡Genial! 🤗 Un agente se contactará a la brevedad. Ante cualquier otra consulta no dudes en escribirme.`)
                        })
                        
                        


const negativeFlow = addKeyword('No').addAction(async(ctx,ctxFn) => {
    return ctxFn.gotoFlow(welcomeFlow)
})

    
                
const desarrolloFlow = addKeyword(EVENTS.ACTION)
                        .addAnswer('😄 ¡Genial! Estamos para ayudarte a encontrar la propiedad de tus sueños. 🤗 ¿Coordinamos una reunión para conocer más en detalle tus necesidades?'
                            ,{
                            capture:true,
                            buttons: [
                                {body:'Sí'},
                                {body:'No'},
                            ]
                        },null,[afirmativeFlow,negativeFlow])
    
export{desarrolloFlow}
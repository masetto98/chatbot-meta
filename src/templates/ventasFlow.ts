import { addKeyword,EVENTS } from "@builderbot/bot"
import { stop } from "utils/idle-custom";
import { createEvent } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow";
import { cargarIntencionUser } from "utils/utils";
import { delay } from "@builderbot/bot/dist/utils";


const afirmativeFlow = addKeyword('Sí')
                        .addAnswer('🙌 Antes de agendar la reunión, nos gustaría conocer algunos detalles...')
                        .addAnswer('Por favor, la respuesta ante cada pregunta en *un mismo mensaje*.')
                        .addAnswer('🏡¿Qué tipo de propiedad estás buscando?',{
                            capture:true,
                            delay:2000,
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({tipoPropiedad:ctx.body})
                        })
                        .addAnswer('📍¿En qué localidad estas interesado comprar?',{
                            capture:true,
                            delay:2000,
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({localidad:ctx.body})
                        })
                        .addAnswer('😄 Perfecto ¿Te interesa alguna zona o barrio en particular?',{
                            capture:true,
                            delay:2000,
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({zona:ctx.body})
                        })
                        .addAnswer('💰¿Tenés algun presupuesto en mente?',{
                            capture:true,
                            delay:2000,
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({presupuesto:ctx.body})
                        })
                        .addAnswer('Por último, indicame en un solo mensaje tu nombre y apellido..',{
                            capture:true,
                            delay:2000,
                        },
                        async (ctx,ctxFn) => {
                            await ctxFn.state.update({cliente:ctx.body})
                        })
                        .addAnswer(`¡Genial! 🤗 Un agente se contactará a la brevedad para brindarte una asesoría personalizada. Para volver al menú principal escribe *menu*.`,
                            {delay:2000},
                            async (ctx,ctxFn) => {
                                const eventName = "Potencial Venta"
                                const name = await ctxFn.state.get('cliente')
                                const localidad = await ctxFn.state.get('localidad')
                                const tipoProp = await ctxFn.state.get('tipoPropiedad')
                                const presp = await ctxFn.state.get('presupuesto')
                                const zona = await ctxFn.state.get('zona')
                                const tel = await ctx.from
                                const description = `Nombre: ${name}, tel: ${tel} || Asunto: le interesa ${tipoProp} en ${localidad}, zona: ${zona} y tiene un presupuesto de ${presp}` 
                                const date = new Date()
                                date.setHours(date.getHours() + 1)
                                const eventId = await createEvent(eventName,description,date.toISOString(),0.1)
                                await cargarIntencionUser(tipoProp,'null',presp,localidad + ' ' + zona,'Venta',tel)
                                await ctxFn.state.update({intention:undefined})
                                stop(ctx);
                                await ctxFn.state.update({timer:undefined})}
                            
                        )
                        /*
                        .addAction(async (ctx,ctxFn) => {
                            const eventName = "Potencial Venta"
                            const name = await ctxFn.state.get('cliente')
                            const localidad = await ctxFn.state.get('localidad')
                            const tipoProp = await ctxFn.state.get('tipoPropiedad')
                            const presp = await ctxFn.state.get('presupuesto')
                            const zona = await ctxFn.state.get('zona')
                            const tel = await ctx.from
                            const description = `Nombre: ${name}, tel: ${tel} || Asunto: le interesa ${tipoProp} en ${localidad}, zona: ${zona} y tiene un presupuesto de ${presp}` 
                            const date = new Date()
                            date.setHours(date.getHours() + 1)
                            const eventId = await createEvent(eventName,description,date.toISOString(),0.1)
                            await cargarIntencionUser(tel,tipoProp,'null',presp,localidad + ' ' + zona,'Venta')
                            await ctxFn.state.update({intention:undefined})
                            stop(ctx);
                            await ctxFn.state.update({timer:undefined})
                            ctxFn.flowDynamic(`¡Genial! 🤗 Un agente se contactará a la brevedad para brindarte una asesoría personalizada. Para volver al menú principal escribe *menu*.`)
                        })*/
                        
                        


const negativeFlow = addKeyword('No').addAction(async(ctx,ctxFn) => {
    return ctxFn.gotoFlow(welcomeFlow)
})

    
                
const ventasFlow = addKeyword(EVENTS.ACTION)
    .addAnswer('😄 ¡Genial! Estamos para ayudarte a encontrar la propiedad de tus sueños. 🤗 ¿Coordinamos una reunión para conocer más en detalle tus necesidades?'
        ,{
        capture:true,
        buttons: [
            {body:'Sí'},
            {body:'No'},
        ],
        delay:2000,
    },null,[afirmativeFlow,negativeFlow])
    

export {ventasFlow}
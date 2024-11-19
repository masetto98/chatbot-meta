import { addKeyword,EVENTS } from "@builderbot/bot"
import { text2iso } from "utils/utils"
import { createEvent } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow";


const agenteFlow = addKeyword(EVENTS.ACTION)
                        
                        .addAction(async (ctx,ctxFn) => {
                            const eventName = "Contactar Cliente"
                            const name = await ctxFn.state.get('cliente')
                            const prop = await ctxFn.state.get('propiedad')
                            const tel = await ctxFn.state.get('tel')
                            const description = `Nombre: ${name}, tel: ${tel}, asunto: le interesa ${prop}` 
                            const date = new Date()
                            date.setHours(date.getHours() + 1)
                            const eventId = await createEvent(eventName,description,date.toISOString(),0.1)
                            ctxFn.flowDynamic(`¡Genial! 🤗 Un agente se contactará a la brevedad. Para volver al menú principal escribe *menu*.`)
                        })
                        
                        


export{agenteFlow}
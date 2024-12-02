import { addKeyword,EVENTS } from "@builderbot/bot"
import { reset, start,stop } from "utils/idle-custom"




const desarrolloFlow = addKeyword(EVENTS.ACTION)
                    .addAction(async (ctx, { gotoFlow }) => start(ctx, gotoFlow, 10000))
                    .addAnswer('🙌 ¡Genial! Podrías indicarnos tu nombre completo',{capture:true})
                    .addAnswer('¿Algún horario preferencia para comunicarnos?',{
                        capture:true
                    })
                    .addAnswer('🙌 ¡Excelente! Un agente se contactará a la brevedad. Ante cualquier otra consulta no dudes en escribirme.',{
                        capture:true
                    })

export{desarrolloFlow}
import { addKeyword,EVENTS } from "@builderbot/bot"




const desarrolloFlow = addKeyword(EVENTS.ACTION)
                    .addAnswer('🙌 ¡Genial! Podrías indicarnos tu nombre completo',{capture:true})
                    .addAnswer('¿Algún horario preferencia para comunicarnos?',{
                        capture:true
                    })
                    .addAnswer('🙌 ¡Excelente! Un agente se contactará a la brevedad. Escribe *menu* si quieres volver al menú principal.',{
                        capture:true
                    })

export{desarrolloFlow}
import { addKeyword,EVENTS } from "@builderbot/bot"




const tasacionFlow = addKeyword(EVENTS.ACTION)
                    .addAnswer('🙌 ¡Genial! Podrías indicarnos tu nombre completo',{capture:true})
                    .addAnswer('¿Algún horario preferencia para comunicarnos?',{
                        capture:true
                    },)
                    .addAnswer('🙌 ¡Excelente! Un agente se contactará a la brevedad. Escribe *menu* si quieres volver al menú principal.',{
                        capture:true
                    },)

export{tasacionFlow}
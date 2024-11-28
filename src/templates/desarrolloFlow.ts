import { addKeyword,EVENTS } from "@builderbot/bot"
import { reset, start,stop } from "utils/idle-custom"




const desarrolloFlow = addKeyword(EVENTS.ACTION)
                    .addAction(async (ctx, { gotoFlow }) => start(ctx, gotoFlow, 10000))
                    .addAnswer('🙌 ¡Genial! Podrías indicarnos tu nombre completo',{capture:true},
                        async (ctx, { gotoFlow, state }) => {
                            reset(ctx, gotoFlow, 10000);
                            })
                    .addAnswer('¿Algún horario preferencia para comunicarnos?',{
                        capture:true
                    },async (ctx, { gotoFlow, state }) => {
                        reset(ctx, gotoFlow, 10000);
                        })
                    .addAnswer('🙌 ¡Excelente! Un agente se contactará a la brevedad. Escribe *menu* si quieres volver al menú principal.',{
                        capture:true
                    },async (ctx, { gotoFlow, state }) => {
                        stop(ctx);
                    })

export{desarrolloFlow}
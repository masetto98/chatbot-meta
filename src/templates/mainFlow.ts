import { addKeyword,EVENTS } from "@builderbot/bot"
import { operacionFlow } from "./operacionFlow"
import { faqFlow } from "./faqFlow";
import { welcomeFlow } from "./welcomeFlow";
import { agendarFlow } from "./agendarFlow";
import { ventasFlow } from "./ventasFlow";
import { desarrolloFlow } from "./desarrolloFlow";
import { tasacionFlow } from "./tasacionFlow";
import { reset,start } from "utils/idle-custom";
import { iniciarSesion } from "utils/utils";
import { fromwebsite } from "./fromwebsite";

const trackUserInteraction = async (ctx, state) => {
    await state.update({ lastInteraction: new Date().toISOString() });
};

const mainFlow = addKeyword(EVENTS.WELCOME)
    .addAction(
        async (ctx,{gotoFlow,state}) => {
            const lastInteraction = state.get('lastInteraction'); // Guardar timestamp del último mensaje del usuario
            console.log('Ultima interaccion:' + lastInteraction)
            if (lastInteraction) {
                const lastInteractionDate = new Date(lastInteraction);
            
                if (!isNaN(lastInteractionDate.getTime()) && (new Date().getTime() - lastInteractionDate.getTime() > 24 * 60 * 60 * 1000)) {
                    console.warn('El usuario no interactuó en las últimas 24 horas. No se puede enviar mensaje.');
                    return; // No enviar mensaje
                }
            }
            let sessionIdNew = await state.get('sessionId');
            if(!sessionIdNew){
                sessionIdNew = await iniciarSesion();
                await state.update({sessionId:sessionIdNew})
            }
            
            let timer = await state.get('timer');
            if(!timer){
                start(ctx, gotoFlow, 3600000)
                await state.update({timer:'active'})
            }
            const intention = (state.getMyState()?.intention ?? String)
            trackUserInteraction(ctx, state);
            /*if(ctx.body.toLowerCase().includes('zonaprop') || ctx.body.toLowerCase().includes('argenprop')){
                await state.update({intention:'web'})
            }*/
            switch(ctx.body){
                case 'alq':
                await state.update({intention:'alq'})
                break
                case 'vta':
                await state.update({intention:'vta'})
                break
                case 'des':
                await state.update({intention:'des'})
                break
                case 'tas':
                await state.update({intention:'tas'})
                break
                case 'vis':
                await state.update({intention:'vis'})
                break
                case 'faq':
                await state.update({intention:'faq'})
                break
                
            }
            const intentionUpdate = state.get('intention')
            console.log(intentionUpdate)
            switch(intentionUpdate){
                case 'alq':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(operacionFlow)
                case 'vta':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(ventasFlow)
                case 'des':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(desarrolloFlow)
                case 'tas':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(tasacionFlow)
                case 'vis':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(agendarFlow);
                    //return gotoFlow(agendarFlow)
                case 'faq':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(faqFlow)
                /*case 'web':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(fromwebsite)*/
                default:
                    return gotoFlow(welcomeFlow)
            }
            
        }
    )

export {mainFlow}
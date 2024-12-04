import { addKeyword,EVENTS } from "@builderbot/bot"
import { operacionFlow } from "./operacionFlow"
import { faqFlow } from "./faqFlow";
import { welcomeFlow } from "./welcomeFlow";
import { agendarFlow } from "./agendarFlow";
import { ventasFlow } from "./ventasFlow";
import { desarrolloFlow } from "./desarrolloFlow";
import { tasacionFlow } from "./tasacionFlow";
import { reset } from "utils/idle-custom";



const mainFlow = addKeyword(EVENTS.WELCOME)
    .addAction(
        async (ctx,{gotoFlow,state}) => {
            
            const intention = (state.getMyState()?.intention ?? String)
            console.log(intention)
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
                    return gotoFlow(agendarFlow)
                case 'faq':
                    reset(ctx, gotoFlow, 3600000);
                    return gotoFlow(faqFlow)
                default:
                    return gotoFlow(welcomeFlow)
            }
            
        }
    )
    

export {mainFlow}
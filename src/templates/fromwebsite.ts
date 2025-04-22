import { addKeyword,EVENTS } from "@builderbot/bot"
import { operacionFlow } from "./operacionFlow";

const webFlow = addKeyword(['zonaprop','argenprop'])
                        .addAction(async (ctx,ctxFn) => {
                            await ctxFn.state.update({intention:"alq"})   
                            return ctxFn.gotoFlow(operacionFlow)
                        })


export{webFlow}
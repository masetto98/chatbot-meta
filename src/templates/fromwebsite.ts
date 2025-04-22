import { addKeyword,EVENTS } from "@builderbot/bot"
import { operacionFlow } from "./operacionFlow";

const fromwebsite = addKeyword(['zonaprop','argenprop',])
                        .addAction(async (ctx,ctxFn) => {
                            console.log('flujo webflow')
                            await ctxFn.state.update({intention:"alq"})   
                            return ctxFn.gotoFlow(operacionFlow)
                        })


export{fromwebsite}
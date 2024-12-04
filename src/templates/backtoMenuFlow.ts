import { addKeyword,EVENTS } from "@builderbot/bot"
import { welcomeFlow } from "./welcomeFlow"


const backtoMenuFlow = addKeyword(['menu','principal','volver','menu principal','quiero volver',])
                        .addAction(async (ctx,ctxFn) => {
                            await ctxFn.state.update({intention:undefined})
                            await ctxFn.state.update({history:undefined})
                            await ctxFn.state.update({chattest:undefined})
                            await ctxFn.state.update({modelo:undefined})
                            return ctxFn.gotoFlow(welcomeFlow)
                        })


export{backtoMenuFlow}
import { addKeyword,EVENTS } from "@builderbot/bot"
import { welcomeFlow } from "./welcomeFlow"


const backtoMenuFlow = addKeyword(['menu','principal','volver','menu principal','quiero volver'])
                        .addAction(async (ctx,ctxFn) => {
                            return ctxFn.gotoFlow(welcomeFlow)
                        })


export{backtoMenuFlow}
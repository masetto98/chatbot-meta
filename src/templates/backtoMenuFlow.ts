import { addKeyword,EVENTS } from "@builderbot/bot"
import { welcomeFlow } from "./welcomeFlow"
import { stop } from "utils/idle-custom";

const backtoMenuFlow = addKeyword(['menu','principal','volver','menu principal','quiero volver','salir',])
                        .addAction(async (ctx,ctxFn) => {
                            await ctxFn.state.update({intention:undefined})
                            await ctxFn.state.update({history:undefined})
                            await ctxFn.state.update({chattest:undefined})
                            await ctxFn.state.update({modelo:undefined})
                            stop(ctx);
                            await ctxFn.state.update({timer:undefined})
                            ctxFn.state.clear()                 
                            return ctxFn.gotoFlow(welcomeFlow)
                        })


export{backtoMenuFlow}
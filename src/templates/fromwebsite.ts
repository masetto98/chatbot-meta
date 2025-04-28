import { addKeyword,EVENTS } from "@builderbot/bot"
import { operacionFlow } from "./operacionFlow";
import { iniciarSesion } from "utils/utils";
import { reset,start } from "utils/idle-custom";


function extraerUrl(mensaje: string): string | null {
    // Expresión regular para buscar URLs
    const regex = /(https?:\/\/[\w.-]+(?:\.[\w\.-]+)+[\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/gi;
    const coincidencias = mensaje.match(regex);
  
    if (coincidencias && coincidencias.length > 0) {
      // Si se encontraron coincidencias, devolvemos la primera URL encontrada
      return coincidencias[0];
    } else {
      // Si no se encontraron URLs, devolvemos null
      return null;
    }
  }

  const trackUserInteraction = async (ctx, state) => {
    await state.update({ lastInteraction: new Date().toISOString() });
};

const fromwebsite = addKeyword(['zonaprop','argenprop',])
                        .addAction(async (ctx,ctxFn) => {

                            console.log('flujo webflow: '+ ctx.body)

                            // Creo una nueva session en caso de ser la primera vez
                            let sessionIdNew = await ctxFn.state.get('sessionId');
                            if(!sessionIdNew){
                                sessionIdNew = await iniciarSesion();
                                await ctxFn.state.update({sessionId:sessionIdNew})
                            }
                            // Inicializo timer para notificación de inactividad
                            let timer = await ctxFn.state.get('timer');
                            if(!timer){
                                start(ctx, ctxFn.gotoFlow, 3600000) // 3600000 = 1 hs
                                await ctxFn.state.update({timer:'active'})
                            }
                            // Almaceno fecha ultima interaccion para verificar que no sobrepase las 24hs
                            trackUserInteraction(ctx, ctxFn.state);
                            const urlExtraida = extraerUrl(ctx.body);
                            await ctxFn.state.update({url:urlExtraida})
                            console.log(ctx.body.includes('zonaprop'))
                            if(ctx.body.toLowerCase().includes('zonaprop')){
                                await ctxFn.state.update({fromwebsite:"zonaprop"})
                                
                            }
                            else if(ctx.body.includes('argenprop')){
                                await ctxFn.state.update({fromwebsite:"argenprop"})
                            }
                            await ctxFn.state.update({intention:"alq"})   
                            return ctxFn.gotoFlow(operacionFlow)
                        })


export{fromwebsite}
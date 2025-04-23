import { addKeyword,EVENTS } from "@builderbot/bot"
import { operacionFlow } from "./operacionFlow";
import { obtenerHTML } from "utils/utils";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from "~/config";

const genAI = new GoogleGenerativeAI(config.ApiKey);

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

async function extraerPalabraConGemini(html: string | null): Promise<string | null> {
    if (!html) {
      console.error('No se proporcionó HTML válido para Gemini.');
      return null;
    }
  
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
  
      const prompt = `Dado el siguiente código HTML, que pertenece a una pagina de publicaciones de propiedades para alquilar y vender, extrae la palabra clave o relevante que hace referencia a la dirección geografica de la propiedad en cuestión. La dirección suele tener este formato por ejemplo: Dorrego 1674 06, Rosario, Santa Fe
        
      ${html}
  
      La dirección extraída debe ser concisa y representativa.`;
  
      const result = await model.generateContent([prompt]);
      const response = await result.response;
  
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
        const palabraExtraida = response.candidates[0].content.parts[0].text.trim();
        return palabraExtraida;
      } else {
        console.error('No se pudo extraer la palabra de la respuesta de Gemini.');
        console.log('Respuesta completa de Gemini:', response);
        return null;
      }
  
    } catch (error) {
      console.error('Error al comunicarse con el modelo Gemini:', error);
      return null;
    }
  }

const fromwebsite = addKeyword(['zonaprop','argenprop',])
                        .addAction(async (ctx,ctxFn) => {
                            console.log('flujo webflow: '+ ctx.body)
                            const urlExtraida = extraerUrl(ctx.body);
                            await ctxFn.state.update({url:urlExtraida})
                            console.log(ctx.body.includes('zonaprop'))
                            if(ctx.body.toLowerCase().includes('zonaprop')){
                                await ctxFn.state.update({fromwebsite:"zonaprop"})
                                let asd= await ctxFn.state.get('fromwebsite')
                                console.log(asd)
                            }
                            else if(ctx.body.includes('argenprop')){
                                await ctxFn.state.update({fromwebsite:"argenprop"})
                            }
                            await ctxFn.state.update({intention:"alq"})   
                            return ctxFn.gotoFlow(operacionFlow)
                        })


export{fromwebsite}
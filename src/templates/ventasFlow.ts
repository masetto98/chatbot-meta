import { addKeyword,EVENTS } from "@builderbot/bot"
import { stop } from "utils/idle-custom";
import { createEvent } from "~/scripts/calendar"
import { welcomeFlow } from "./welcomeFlow";
import { cargarIntencionUser } from "utils/utils";

const quintoFlow = addKeyword(['Hasta 30000','Entre 30000 y 80000','Mas 80000','0'])
                    .addAction(async (ctx,ctxFn) => {
                        await ctxFn.state.update({presupuesto:ctx.body})

                    })
                    .addAnswer('Por último, indicame en *un solo mensaje* tu nombre y apellido..',{
                        capture:true,
                        delay:2000,
                    },
                    async (ctx,ctxFn) => {
                        await ctxFn.state.update({cliente:ctx.body})
                    })
                    .addAnswer(`¡Genial! 🤗 Un agente se contactará a la brevedad para brindarte una asesoría personalizada. Para volver al menú principal escribe *menu*.`,
                        {delay:2000},
                        async (ctx,ctxFn) => {
                            const eventName = "Potencial Venta"
                            const name = await ctxFn.state.get('cliente')
                            const localidad = await ctxFn.state.get('localidad')
                            const tipoProp = await ctxFn.state.get('tipoPropiedad')
                            const presp = await ctxFn.state.get('presupuesto')
                            const caracteristica = await ctxFn.state.get('caracteristica')
                            const tel = await ctx.from
                            const sessionID = await ctxFn.state.get('sessionId');
                            const description = `Nombre: ${name}, tel: ${tel} || Asunto: le interesa ${tipoProp} de ${caracteristica} en ${localidad} y tiene un presupuesto de ${presp}` 
                            const date = new Date()
                            date.setHours(date.getHours() + 1)
                            const eventId = await createEvent(eventName,description,date.toISOString(),0.1)
                            await cargarIntencionUser(tipoProp,caracteristica,presp,localidad,'Venta',tel,sessionID)
                            await ctxFn.state.update({intention:undefined})
                            stop(ctx);
                            await ctxFn.state.update({timer:undefined})
                            //finalizo session actual
                            await ctxFn.state.update({sessionId:undefined})
                        }
                            
                        
                    )

const cuartoFlow = addKeyword(['0 Dormitorios','1 Dormitorio','2 Dormitorios','3 Dormitorios','4 Dormitorios'])
                    .addAnswer('💰¿Tenés algun presupuesto en mente?',{
                        delay:3000,
                        capture:false,
                        
                    },
                    async (ctx,ctxFn) => {
                        const list = {
                            "header": {
                                "type": "text",
                                "text": ""
                            },
                            "body": {
                                "text":"Elegí una de las opciones del menú."
                            },
                            "footer": {
                                "text": ""
                            },
                            "action":{
                                "button":"Presupuesto",
                                "sections": [
                                    {
                                        "title": "Presupuesto",
                                        "rows": [
                                            {
                                                "id":"Hasta 30000",
                                                "title":"Hasta USD 30 mil",
                                                "description": ""
                                            },
                                            {
                                                "id":"Entre 30000 y 80000",
                                                "title":"Entre USD 30 y 80 mil",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"Mas 80000",
                                                "title":"Mas USD 80 mil",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"0",
                                                "title":"Sin presupuesto",
                                                "description": ""
                                            }
   
                                        ]
                                    }
                                    
                                        
                                ]
                            }
                        }
                        await ctxFn.provider.sendList(ctx.from,list)
                        await ctxFn.state.update({caracteristica:ctx.body})
                    },[quintoFlow])
                    


const tercerFlow = addKeyword(['Rosario','Roldan','Alvear','General Lagos','Ibarlucea','Villa Amelia','Pueblo Esther','Arroyo Seco','San Lorenzo'])
                    .addAnswer('🧮¿Cuantos dormitorios te interesan? Si no corresponde elegí la opción *0*',{
                        capture:false,
                        delay:2000,
                    },
                    async (ctx,ctxFn) => {
                        const list = {
                            "header": {
                                "type": "text",
                                "text": ""
                            },
                            "body": {
                                "text":"Elegí una de las opciones del menú."
                            },
                            "footer": {
                                "text": ""
                            },
                            "action":{
                                "button":"Dormitorios",
                                "sections": [
                                    {
                                        "title": "Cantidad de dormitorios",
                                        "rows": [
                                            {
                                                "id":"0 Dormitorios",
                                                "title":"0 Dormitorios",
                                                "description": ""
                                            },
                                            {
                                                "id":"1 Dormitorio",
                                                "title":"1 Dormitorio",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"2 Dormitorios",
                                                "title":"2 Dormitorios",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"3 Dormitorios",
                                                "title":"3 Dormitorios",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"4 Dormitorios",
                                                "title":"4 Dormitorios",
                                                "description": ""
                                            }
                                            
                                        ]
                                    }
                                    
                                        
                                ]
                            }
                        }
                        await ctxFn.provider.sendList(ctx.from,list)
                        await ctxFn.state.update({localidad:ctx.body})
                        //await ctxFn.state.update({caracteristica:ctx.body})
                    },[cuartoFlow,quintoFlow])
const segundoFlow = addKeyword(['Departamento','Casa','Pasillo','Local','Oficina','Terreno','Cochera'])
                    .addAnswer('📍¿En qué localidad estas interesado comprar?',{
                        capture:false,
                        delay:2000,
                    },
                    async (ctx,ctxFn) => {
                        const list = {
                            "header": {
                                "type": "text",
                                "text": ""
                            },
                            "body": {
                                "text":"Elegí una de las opciones del menú."
                            },
                            "footer": {
                                "text": ""
                            },
                            "action":{
                                "button":"Localidades",
                                "sections": [
                                    {
                                        "title": "Localidades",
                                        "rows": [
                                            {
                                                "id":"Rosario",
                                                "title":"Rosario",
                                                "description": ""
                                            },
                                            {
                                                "id":"Roldan",
                                                "title":"Roldán",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"Alvear",
                                                "title":"Alvear",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"General Lagos",
                                                "title":"General Lagos",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"Ibarlucea",
                                                "title":"Ibarlucea",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"Villa Amelia",
                                                "title":"Villa Amelia",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"Pueblo Esther",
                                                "title":"Pueblo Esther",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"Arroyo Seco",
                                                "title":"Pueblo Esther",
                                                "description": ""
                                            }
                                            ,
                                            {
                                                "id":"San Lorenzo",
                                                "title":"San Lorenzo",
                                                "description": ""
                                            }
                                            
                                        ]
                                    }
                                    
                                        
                                ]
                            }
                        }
                        await ctxFn.provider.sendList(ctx.from,list)
                        await ctxFn.state.update({tipoPropiedad:ctx.body})
                        //await ctxFn.state.update({localidad:ctx.body})
                    },[cuartoFlow,tercerFlow,quintoFlow])
const afirmativeVtaFlow = addKeyword('Sí')
                        .addAnswer('🙌 Antes de agendar la reunión, nos gustaría conocer algunos detalles...')
                        .addAnswer('🏡¿Qué tipo de propiedad estás buscando?',{
                            capture:false,
                            delay:2000,
                        },
                        async (ctx,ctxFn) => {
                            const list = {
                                "header": {
                                    "type": "text",
                                    "text": ""
                                },
                                "body": {
                                    "text":"Elegí una de las opciones del menú."
                                },
                                "footer": {
                                    "text": ""
                                },
                                "action":{
                                    "button":"Propiedades",
                                    "sections": [
                                        {
                                            "title": "Tipo Propiedades",
                                            "rows": [
                                                {
                                                    "id":"Departamento",
                                                    "title":"Departamento",
                                                    "description": ""
                                                },
                                                {
                                                    "id":"Casa",
                                                    "title":"Casa",
                                                    "description": ""
                                                }
                                                ,
                                                {
                                                    "id":"Pasillo",
                                                    "title":"Pasillo",
                                                    "description": ""
                                                }
                                                ,
                                                {
                                                    "id":"Local",
                                                    "title":"Local Comercial",
                                                    "description": ""
                                                }
                                                ,
                                                {
                                                    "id":"Oficina",
                                                    "title":"Oficina",
                                                    "description": ""
                                                }
                                                ,
                                                {
                                                    "id":"Terreno",
                                                    "title":"Terreno",
                                                    "description": ""
                                                }
                                                ,
                                                {
                                                    "id":"Cochera",
                                                    "title":"Cochera",
                                                    "description": ""
                                                }
                                                
                                            ]
                                        }
                                        
                                            
                                    ]
                                }
                            }
                            await ctxFn.provider.sendList(ctx.from,list)
                            //await ctxFn.state.update({tipoPropiedad:ctx.body})
                        },[segundoFlow,cuartoFlow,tercerFlow,segundoFlow,quintoFlow])
                        
                        
                        
                        


const negativeVtaFlow = addKeyword('No').addAction(async(ctx,ctxFn) => {
    return ctxFn.gotoFlow(welcomeFlow)
})

    
                
const ventasFlow = addKeyword(EVENTS.ACTION)
    .addAnswer('😄 ¡Genial! Estamos para ayudarte a encontrar la propiedad de tus sueños. ¿Coordinamos una reunión para conocer más en detalle tus necesidades? 🤗'
        ,{
        capture:true,
        buttons: [
            {body:'Sí'},
            {body:'No'},
        ],
        delay:2000,
    },null,[afirmativeVtaFlow,negativeVtaFlow,cuartoFlow,tercerFlow,segundoFlow,quintoFlow])
    

export {ventasFlow}





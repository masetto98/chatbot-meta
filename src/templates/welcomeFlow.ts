import { addKeyword,EVENTS } from "@builderbot/bot"
import { start } from "utils/idle-custom"
import { createMessageQueue,QueueConfig } from "utils/fast-entires"

const queueConfig: QueueConfig = { gapMilliseconds: 3000 };
const enqueueMessage = createMessageQueue(queueConfig);

/*
const welcomeFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { gotoFlow }) => start(ctx, gotoFlow, 3600000))
    .addAnswer('👋¡Hola! Soy el asistente virtual de la inmobiliaria Martin + Tettamanzi. Estoy para ayudarte con tus consultas.',
        {
            capture:false
        },
        async (ctx,{provider}) => {
            const list = {
                "header": {
                    "type": "text",
                    "text": ""
                },
                "body": {
                    "text":"Contame como puedo ayudarte eligiendo una de las opciones del *menú principal*."
                },
                "footer": {
                    "text": ""
                },
                "action":{
                    "button":"Menú Principal",
                    "sections": [
                        {
                            "title": "Operaciones",
                            "rows": [
                                {
                                    "id":"alq",
                                    "title":"Alquileres",
                                    "description": "Descubrí las mejores propiedades en alquiler disponibles" //"Encontrá las opciones disponibles que mejor se adapten a tus necesidades y agenda una visita."
                                },
                                {
                                    "id":"vta",
                                    "title":"Ventas",
                                    "description": "Adquirí la propiedad de tus sueños"//"Agenda una reunión con un agente ahora mismo."
                                }
                                ,
                                {
                                    "id":"des",
                                    "title":"Desarrollos",
                                    "description": "Mirá las opciones de desarrollos que tenemos para vos"//"Mirá las opciones de desarrollos que tenemos para vos."
                                }
                                ,
                                {
                                    "id":"tas",
                                    "title":"Tasaciones",
                                    "description": "Conocé el valor real de tu propiedad"//"Mirá las opciones de desarrollos que tenemos para vos."
                                }
                                
                            ]
                        },
                        {
                            "title": "Más opciones",
                            "rows": [
                                {
                                    "id":"faq",
                                    "title":"Preguntas/Consultas",
                                    "description": "Resolvé todas tus dudas"//"¿Queres tasar una propiedad? Agenda una reunión con un agente."
                                },
                                {
                                    "id":"vis",
                                    "title":"Agendar visita/reunión",
                                    "description": "Coordina una visita o reunión con nuestros agentes"//"Agenda una visita o reunión con un agente ahora mismo."
                                }
                            ]
                        }
                        
                            
                    ]
                }
            }
            await provider.sendList(ctx.from,list)
        }
    )
*/  
const welcomeFlow = addKeyword(EVENTS.ACTION)
    //.addAction(async (ctx, { gotoFlow }) => start(ctx, gotoFlow, 3600000))
    .addAnswer('👋¡Hola! Soy el asistente virtual de la inmobiliaria Martin + Tettamanzi. Estoy para ayudarte con tus consultas.',
        {
            capture:false
        },
        async (ctx,{provider}) => {
            try {
                enqueueMessage(ctx, async (body) => {
                    console.log('Processed messages:', body, ctx.from);
                    const list = {
                        "header": {
                            "type": "text",
                            "text": ""
                        },
                        "body": {
                            "text":"Contame como puedo ayudarte eligiendo una de las opciones del *menú principal*."
                        },
                        "footer": {
                            "text": ""
                        },
                        "action":{
                            "button":"Menú Principal",
                            "sections": [
                                {
                                    "title": "Operaciones",
                                    "rows": [
                                        {
                                            "id":"alq",
                                            "title":"Alquileres",
                                            "description": "Descubrí las mejores propiedades en alquiler disponibles" //"Encontrá las opciones disponibles que mejor se adapten a tus necesidades y agenda una visita."
                                        },
                                        {
                                            "id":"vta",
                                            "title":"Ventas",
                                            "description": "Adquirí la propiedad de tus sueños"//"Agenda una reunión con un agente ahora mismo."
                                        }
                                        ,
                                        {
                                            "id":"des",
                                            "title":"Desarrollos",
                                            "description": "Mirá las opciones de desarrollos que tenemos para vos"//"Mirá las opciones de desarrollos que tenemos para vos."
                                        }
                                        ,
                                        {
                                            "id":"tas",
                                            "title":"Tasaciones",
                                            "description": "Conocé el valor real de tu propiedad"//"Mirá las opciones de desarrollos que tenemos para vos."
                                        }
                                        
                                    ]
                                },
                                {
                                    "title": "Más opciones",
                                    "rows": [
                                        {
                                            "id":"faq",
                                            "title":"Preguntas/Consultas",
                                            "description": "Resolvé todas tus dudas"//"¿Queres tasar una propiedad? Agenda una reunión con un agente."
                                        },
                                        {
                                            "id":"vis",
                                            "title":"Agendar visita/reunión",
                                            "description": "Coordina una visita o reunión con nuestros agentes"//"Agenda una visita o reunión con un agente ahora mismo."
                                        }
                                    ]
                                }
                                
                                    
                            ]
                        }
                    }
                    await provider.sendList(ctx.from,list)
                
                });
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }    
    )
export {welcomeFlow}
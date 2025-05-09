import { addKeyword,EVENTS } from "@builderbot/bot"



const welcomeFlow = addKeyword(EVENTS.ACTION)
    .addAnswer('👋¡Hola! Soy el asistente virtual de la inmobiliaria Martin + Tettamanzi. Estoy para ayudarte con tus consultas.')
    //.addAction(async (ctx, { gotoFlow }) => start(ctx, gotoFlow, 3600000))
    .addAnswer('Por favor, escribí *frases cortas* y *todo en un mismo mensaje* para contarme que necesitas.',
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
                                    "title":"Agendar reunión",
                                    "description": "Coordina una reunión con uno de nuestros agentes"//"Agenda una visita o reunión con un agente ahora mismo."
                                }
                            ]
                        }
                        
                            
                    ]
                }
            }
            await provider.sendList(ctx.from,list)
        }
    )

export {welcomeFlow}
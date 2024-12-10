import { descargarYLeerExcel } from "utils/utils"


/*-En el caso de que un cliente tenga interes sobre alguna propiedad y quiera que lo contacte un agente, solicitá al cliente, solamente cuando exprese interes sobre una propiedad, su nombre, apellido y un horario disponible para poder comunicarnos. Luego agradece y escribe, solamente cuando recopiles todos estos datos: su nombre, apellido, horario disponible y enlace de la propiedad interesada en este formato: {{nombre: nombre del cliente}},{{horario: horario disponible del cliente}}, {{enlace: enlace propiedad interesada del cliente}}*/
/*
const PROMPT = `INSTRUCCIONES PARA RESPONDER:\n
-Sos el asistente virtual de la inmobiliaria "Martin + Tettamanzi" en Argentina.\n
-Tu principal responsabilidad es utilizar la información de la BASE_DE_DATOS para responder a las consultas de los clientes y persuadirlos para que realicen un alquiler de una propiedad.\n
-En caso de necesitas más información sobre la inmobiliaria buscala en este sitio https://www.mtinmobiliaria.com.ar/quienes-somos/\n 
-Responde de manera breve, directa y natural, adecuada para WhatsApp.\n
-Como experto en negocios inmobiliarios tu tarea es mantener una conversacion agradable, responder a las preguntas del cliente sobre nuestros servicios y finalmente guiarlos para agendar una visita en caso de que le interese una propiedad para alquilar.\n
-Solamente cuando el cliente le interesa alquilar, consultale si ya estuvo viendo una propiedad especifica o si quiere que le presentes opciones disponibles que más se adapten a sus necesidades.\n
-Cuando tengas que presentar las propiedad es muy importante que tengas en cuenta las caracteristicas que desea el cliente. Ejemplo: precio hasta 400000 y presentas propiedades que cumplan esta condicion. Si no hay ninguna propiedad que se adapte a las caracteristicas del cliente persuadilo para que vea otras opciones disponible similares a las caracteristicas que quiere el cliente.\n
-Solamente si el cliente quiere ver las opciones disponibles presentale las opciones disponibles teniendo en cuenta sus preferencias. En cambio, solamente si el cliente tiene vista una propiedad especifica e ingresa la direccion completa o incompleta de la propiedad busca las coincidentes en la base de datos y presentaselas.\n
-Luego de presentar las propiedades y si al cliente le interesa alguna propiedad presentada consultale si desea que lo ayudes a agendar una visita o prefiere que lo contacte un agente. Luego solo si quiere que lo ayudes a agendar una visita solicitá al cliente su nombre y apellido. Luego agradece y escribe, solamente cuando recopiles todos estos datos: su nombre, apellido y enlace de la propiedad interesada en este formato: {{cliente: nombre y apellido del cliente}},{{enlace: enlace propiedad interesada del cliente}},{{VISITA}}. Solamente si quiere que lo contacte un agente consultale su nombre y apellido, luego solo cuando recopiles todos estos datos escribe en este formato: {{cliente: nombre y apellido del cliente}},{{enlace: enlace propiedad interesada del cliente}},{{AGENTE}}\n
-El contexto es la única informacion que tienes. Ignora cualquier cosa que no este relacionada con el contexto. Manten un tono profesional y siempre responde en primera persona.\n
-Revisa el historial de la conversación para determinar si la pregunta ya ha sido abordada. Si es una consulta nueva, planifica una respuesta que sea coherente con el contexto general y la información ya proporcionada.\n
-En la BASE_DE_DATOS vas a encontrar precios en diferentes monedas. Si no lo especifica la moneda es PESOS ARGENTINOS(Ejemplo: $300.000) y si lo especifica USD es en DOLARES ESTADOUNIDENSE (Ejemplo: $30.000 USD).
A continuación te dejo mas detalle sobre las conversaciones que debes mantener, es muy importante que las respetes: \n
INSTRUCCIONES PARA LA INTERACCIÓN:\n
-No especules ni inventes respuestas si la BASE_DE_DATOS no proporciona la información necesaria.\n
-Si no tienes la respuesta o la BASE_DE_DATOS no proporciona suficientes detalles, pide amablemente que reformulé su pregunta.\n
-Antes de responder, asegúrate de que la información necesaria para hacerlo se encuentra en la BASE_DE_DATOS.\n
-Presenta las opciones que mejores se adapten a las caracteristicas que desee el usuario buscando en la BASE_DE_DATOS. La presentación hacela en forma de lista con la dirección de la propiedad y una breve descripcion. Si encontras más de dos opciones que se ajustan a la necesidades, presenta de a dos estas opciones y consultas si desea ver más opciones.
DIRECTRICES PARA RESPONDER AL CLIENTE:\n
-Tu objetivo principal es persuadir al cliente para que realice una operacion escribiendo "alquilar", "comprar" o "tasar". Destaca los departamentos disponibles segun las caracteristicas que ingrese el cliente.\n
-No sugerirás ni promocionarás propiedades de otras inmobiliarias.\n
-El uso de emojis es permitido para darle más carácter a la comunicación, ideal para WhatsApp. Recuerda, tu objetivo es ser persuasivo y amigable, pero siempre profesional.\n
-Respuestas corta ideales para whatsapp.\n
BASE_DE_DATOS="{context}"\n
NOMBRE_DEL_CLIENTE="{customer_name}"\n`
*/

/*
const generatePrompt = async (name: string): Promise<string> => {
    const PROMPT = `BASE_DE_DATOS="{context}"\n
                NOMBRE_DEL_CLIENTE="{customer_name}"\n`
    const DATE_BASE = await descargarYLeerExcel()
    const context = DATE_BASE.map(prop => 
        `Tipo: ${prop.tipo}, Categoría: ${prop.categoria}, Característica: ${prop.caracteristica}, Precio: ${prop.precio}, Descripción: ${prop.descripcion}, Enlace: ${prop.enlace}`
    ).join('\n');
    return PROMPT.replaceAll('{customer_name}', name).replaceAll('{context}', context)
}
*/
interface RowData {
    [key: string]: any;
  }
  
  const generatePrompt = async (name: string): Promise<string> => {
    const PROMPT = `BASE_DE_DATOS="{context}"\n
                     NOMBRE_DEL_CLIENTE="{customer_name}"\n`;
    
    // Obtener las propiedades del Excel
    const properties = await descargarYLeerExcel();
    // Inicializar un contador para los IDs
    let idCounter = 1;
    // Generar el contexto con los datos
    const context = properties.map((prop) => {
        prop.id = idCounter++; // Agregar el ID a la propiedad
        const propertyString = Object.entries(prop)
            .map(([key, value]) => `**${key}:** ${value || "N/A"}`)
            .join('\n');

        return propertyString;
    }).join('\n\n');

    // Reemplazar las variables en el prompt
    return PROMPT.replaceAll('{customer_name}', name).replaceAll('{context}', context);
};

export { generatePrompt }
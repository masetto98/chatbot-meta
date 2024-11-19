import { Propiedad } from "./propiedad";
import xlsx from 'xlsx';
import * as fs from 'fs';
import { DatosUsuario } from "./visitas";
import { DateTime } from 'luxon'
import { chat } from "~/scripts/gemini";
import { readFileSync } from 'fs'; // Importa el módulo fs para manejar archivos
import { join } from 'path'; // Útil para manejar rutas de archivos
import axios from "axios";


/*
// Función para cargar datos del Excel
async function cargarDatosExcel(): Promise<Propiedad[]> {
    const fichasDoc = xlsx.readFile('./fichas.xlsx');
    const fichasHoja = fichasDoc.Sheets[fichasDoc.SheetNames[0]];
    
    // Leer todos los datos de la hoja
    const fichasdata = xlsx.utils.sheet_to_json<any>(fichasHoja, { header: 1 });
    
    const propiedades: Propiedad[] = [];

    // Iterar sobre las filas, ignorando el encabezado
    fichasdata.slice(1).forEach((row: any) => {
        propiedades.push({
            tipo: row[0] as string,
            categoria: row[1] as string,
            caracteristica: row[2] as string,
            precio: row[3] as number,
            enlace: row[4] as string,
            descripcion: row[5] as string,
        });
    });
    
    return propiedades;
}
*/
function actualizarExcel(rutaArchivo: string, nuevoDato: DatosUsuario) {
    let agenda: xlsx.WorkBook;
    let agendasheet: xlsx.WorkSheet;
     // Comprueba si el archivo ya existe
     if (fs.existsSync(rutaArchivo)) {
        // Si existe, carga el archivo y obtiene la primera hoja
        agenda = xlsx.readFile(rutaArchivo);
        agendasheet = agenda.Sheets[agenda.SheetNames[0]];
    } else {
        // Si no existe, crea un nuevo libro de trabajo y una hoja
        agenda = xlsx.utils.book_new();
        agendasheet = xlsx.utils.aoa_to_sheet([['Nombre', 'Horario', 'Enlace', 'Teléfono', 'Fecha']]); // Hoja vacía
        xlsx.utils.book_append_sheet(agenda, agendasheet, 'Datos');
    }
    // Convierte la hoja existente en un array de arrays para añadir los nuevos datos
    const data = xlsx.utils.sheet_to_json(agendasheet, { header: 1 }) as any[][];
   // Convierte el objeto DatosUsuario en un array y añade una nueva fila
    const nuevaFila = [
        nuevoDato.nombre,
        //nuevoDato.horario,
        nuevoDato.enlace,
        nuevoDato.telefono,
        nuevoDato.fecha.toString()
    ];
    data.push(nuevaFila);
    // Convierte el array de vuelta a una hoja de cálculo
    agendasheet = xlsx.utils.aoa_to_sheet(data);
    agenda.Sheets[agenda.SheetNames[0]] = agendasheet;

    // Guarda el archivo Excel actualizado
    xlsx.writeFile(agenda, rutaArchivo);
}

/**
 * convierte una fecha en formato ISO a un texto legible.
 * @param {string} - iso - Fecha en formato iso.
 * @returns {string} - fecha en formato legible.
 */

function iso2text(iso){
    try{
        //convertir la fecha a datetime de luxon
        const dateTime = DateTime.fromISO(iso,{zone:'utc'}).setZone('America/Argentina/Buenos_Aires')

        // formato la fecha
        const formattedDate = dateTime.toLocaleString({
            weekday: 'long',
            day:'2-digit',
            month:'long',
            hour:'2-digit',
            minute:'2-digit',
            hour12:false,
            timeZoneName:'short'
        });
        return formattedDate;
    }catch(err){
        console.error('Error al convertir la fecha: ', err)
        return 'Formato de fecha no válido'
    }
}

/**
 * convierte una fecha en texto a formato iso utilizando gemini
 * @param {string} text - fecha en formato texto
 * @returns {Promise<string> } - fecha en formato ISO.
 * 
 */

async function text2iso(text:string) {
    const currentDate = new Date();
    const prompt = 'La fecha de hoy es: ' + currentDate + ` te voy a dar un texto.
    Necesito que de ese texto extraigas la fecha y la hora del texto que te voy a dar y respondas con la misma en formato ISO.
    Me tenes que responder EXCLUSIVAMENTE con esa fecha y horarios en formato ISO usando el horario 10:00 en caso de que no este especificada la hora.
    Por ejemplo, el texto puede ser algo como "el jueves 30 de mayo a las 12 hs". En ese caso tu respuesta tiene que ser 2024-06-30T12:00:00.000.
    Por ejemplo, el texto puede ser algo como "Este viernes 31". En ese caso tu respuesta tiene que ser 2024-06-31T10:00:00.000.
    Si el texto es algo como: Mañana 10am, sumarle un dia a la fecha actual y dar eso como resultado.
    Si el texto es algo como: Lunes de la semana que viene 10hs y el dia de la fecha actual es jueves sumar 4 días a la fecha actual y dar eso como resultado.
    Si el texto no tiene sentido, repsonde 'false'`;
    //const messages = [{role: 'user', content: `${text}`}]
    const response = await chat(prompt,text);
    return response.trim();
}

const localFilePath = join('./', 'instrucciones.txt'); // Ruta temporal para guardar el archivo descargado

async function cargarInstrucciones(): Promise<string> {
    const googleDriveFileUrl = 'https://drive.google.com/file/d/1sg53GTXpOZGZlC4K0DdAE8r0Zkat23SS/view?usp=sharing'; // Reemplaza con el enlace de tu archivo en Google Drive

    try {
        // Descargar el archivo desde Google Drive
        const response = await axios.get(googleDriveFileUrl, { responseType: 'arraybuffer' });

        // Guardar el archivo temporalmente
        fs.writeFileSync(localFilePath, response.data);

        // Leer el contenido del archivo descargado
        const fileContent = fs.readFileSync(localFilePath, 'utf-8');
        console.log('Contenido del archivo:', fileContent); // Mostrar el contenido en consola

        // Eliminar el archivo temporal después de usarlo
        fs.unlinkSync(localFilePath);

        return fileContent;
    } catch (error) {
        console.error('Error al descargar o leer el archivo:', error);
        throw new Error('No se pudo procesar el archivo de Google Drive.');
    }
}

async function descargarYLeerExcel(): Promise<Propiedad[]> {
    const url = 'https://docs.google.com/spreadsheets/d/11elV0LdHSeMS3srRATf1Ja6dMSR7vz6t/edit?usp=sharing&ouid=111590046753094012259&rtpof=true&sd=true'; // Sustituye con el enlace de tu archivo
    const localPath = './fichas2.xlsx';

    // Descargar el archivo
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(localPath, response.data);

    // Leer el archivo descargado
    const fichasDoc = xlsx.readFile(localPath);
    const fichasHoja = fichasDoc.Sheets[fichasDoc.SheetNames[0]];
    const fichasdata = xlsx.utils.sheet_to_json<any>(fichasHoja, { header: 1 });

    const propiedades: Propiedad[] = [];

    fichasdata.slice(1).forEach((row: any) => {
        propiedades.push({
            tipo: row[0] as string,
            categoria: row[1] as string,
            caracteristica: row[2] as string,
            precio: row[3] as number,
            enlace: row[4] as string,
            descripcion: row[5] as string,
        });
    });

    return propiedades;
}
export{actualizarExcel,iso2text,text2iso,cargarInstrucciones,descargarYLeerExcel}
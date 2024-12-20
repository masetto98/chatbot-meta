import { Propiedad } from "./propiedad";
import xlsx from 'xlsx';
import * as fs from 'fs';
import { DatosUsuario } from "./visitas";
import { DateTime } from 'luxon'
import { chat } from "~/scripts/gemini";
import { readFileSync } from 'fs'; // Importa el módulo fs para manejar archivos
import { join } from 'path'; // Útil para manejar rutas de archivos
import axios from "axios";
import { adapterDB } from "~/db"
//import { RowDataPacket } from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos
import type { RowDataPacket } from 'mysql2';




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

const localFilePath = join('./', 'instrucciones2.txt'); // Ruta temporal para guardar el archivo descargado

async function cargarInstrucciones(): Promise<string> {
    const googleDriveFileUrl = 'https://drive.google.com/uc?id=1sg53GTXpOZGZlC4K0DdAE8r0Zkat23SS'; // Reemplaza con el enlace de tu archivo en Google Drive
    try {
        // Descargar el archivo desde Google Drive
        const response = await axios.get(googleDriveFileUrl, { responseType: 'arraybuffer' });

        // Guardar el archivo temporalmente
        fs.writeFileSync(localFilePath, response.data);

        // Leer el contenido del archivo descargado
        const fileContent = fs.readFileSync(localFilePath, 'utf-8');
        

        // Eliminar el archivo temporal después de usarlo
        fs.unlinkSync(localFilePath);

        return fileContent;
    } catch (error) {
        console.error('Error al descargar o leer el archivo:', error);
        throw new Error('No se pudo procesar el archivo de Google Drive.');
    }
}

const localFilePath2 = join('./', 'faq2.txt'); // Ruta temporal para guardar el archivo descargado

async function cargarfaq() {
    const googleDriveFileUrl = 'https://drive.google.com/uc?id=1OjbLlqIJeEwDGqSjKC6Qt0zm4FOGyAmy'; // Reemplaza con el enlace de tu archivo en Google Drive
    
    try {
        // Descargar el archivo desde Google Drive
        const response = await axios.get(googleDriveFileUrl, { responseType: 'arraybuffer' });

        // Guardar el archivo temporalmente
        fs.writeFileSync(localFilePath2, response.data);

        // Leer el contenido del archivo descargado
        const fileContent = fs.readFileSync(localFilePath2, 'utf-8');
        

        // Eliminar el archivo temporal después de usarlo
        //fs.unlinkSync(localFilePath2);

        
    } catch (error) {
        console.error('Error al descargar o leer el archivo:', error);
        throw new Error('No se pudo procesar el archivo de Google Drive.');
    }
}

interface RowData {
    [key: string]: any; // Permite cualquier tipo de valor para cada propiedad
  }
async function descargarYLeerExcel(): Promise<RowData[]> {
    const url = 'https://drive.google.com/uc?id=1XMRVXMwIanD-S5TR-fBwXbtb1MkMQqEr'; // Sustituye con el enlace de tu archivo
    const localPath = './fichas2.xlsx';
    
    // Descargar el archivo
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(localPath, response.data);

    // Leer el archivo descargado
    const fichasDoc = xlsx.readFile(localPath);
    const fichasHoja = fichasDoc.Sheets[fichasDoc.SheetNames[0]];
    const fichasdata = xlsx.utils.sheet_to_json<any>(fichasHoja, { header: 0 });
   
    /*const headers = Object.keys(fichasdata[0]); // Obtener los nombres de las columnas
    const propiedades: RowData[] = [];
    
      fichasdata.slice(1).forEach((row: any) => {
        const propiedad: RowData = {};
        headers.forEach((header, index) => {
            propiedad[header] = row[index];
        });
        propiedades.push(propiedad);
        });*/
      return fichasdata;
}
/*
async function getUserVisits(phoneNumber: string): Promise<RowDataPacket[]> {
  try {
    await adapterDB.db.execute('SET time_zone = "America/Buenos_Aires"');
    const [rows]: [RowDataPacket[], any] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM visits WHERE phoneNumber = ? AND dateStartEvent >= NOW() AND state = "active"',
        [phoneNumber]
      );
    // Retornar los eventos encontrados
    return rows;
  } catch (error) {
    console.error('Error retrieving user visits:', error);
  }
}*/
async function getUserVisits(phoneNumber: string): Promise<RowDataPacket[]> {
  try {
    // Establecer la zona horaria
    await adapterDB.db.query('SET time_zone = "America/Buenos_Aires"');

    // Ejecutar la consulta y convertir el tipo de retorno
    const result = await adapterDB.db.query('SELECT * FROM visits WHERE phoneNumber = ? AND dateStartEvent >= NOW() AND state = "active"', [phoneNumber]);

    // Convertir el resultado a 'unknown' y luego a '[RowDataPacket[], any]'
    const [rows] = result as unknown as [RowDataPacket[], any];

    return rows;
  } catch (error) {
    console.error('Error retrieving user visits:', error);
    return []; // Retorna un array vacío en caso de error
  }
}
interface Config {
    availableDays: string[];
    availableHoursStart: string;
    availableHoursEnd: string;
    defaultDuration: number;
    specialDays: Record<string, { start?: string; end?: string } | 'cerrado'>;
  }


async function descargarYLeerConfigExcel(): Promise<Config> {
    const url = 'https://drive.google.com/uc?id=1o_d6MWfepM5KTRGCrtwTUzxYQX4jlfZA'; // Sustituye con el ID correcto de tu archivo
    const localPath = './config.xlsx';
   
    //https://docs.google.com/spreadsheets/d/1o_d6MWfepM5KTRGCrtwTUzxYQX4jlfZA/edit?usp=sharing&ouid=111590046753094012259&rtpof=true&sd=true
    // Descargar el archivo desde Google Drive
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(localPath, response.data);
  
    // Leer el archivo descargado
    const workbook = xlsx.readFile(localPath);
  
    // Obtener los datos de las hojas
    const parametrosHoja = workbook.Sheets['Parametros']; // Nombre de la hoja 1
    const diasEspecialesHoja = workbook.Sheets['Feriados']; // Nombre de la hoja 2
    console.log(`diasEspecialesHoja: ${diasEspecialesHoja}`)
  
    // Procesar hoja de parámetros
    const parametrosData = xlsx.utils.sheet_to_json<any>(parametrosHoja, { header: 1 });
    const parametros: Record<string, any> = {};
    parametrosData.slice(1).forEach((row: any[]) => {
      parametros[row[0]] = row[1];
    });
  
    // Procesar hoja de días especiales
    const diasEspecialesData = xlsx.utils.sheet_to_json<any>(diasEspecialesHoja, { header: 1 });
    console.log(`diasEspecialesData: ${diasEspecialesData}`)
    const excelDateOffset = new Date(1899, 11, 30).getTime(); // Fecha base de Excel
    const specialDays: Record<string, { start?: string; end?: string } | 'cerrado'> = {};
    diasEspecialesData.slice(1).forEach((row: any[]) => {
      let [date, status, start, end] = row;
      // Convertir fecha en número de serie de Excel a formato ISO si es necesario
      if (typeof date === 'number') {
        date = new Date(excelDateOffset + date * 86400000).toISOString().split('T')[0];
      }
      if (status === 'cerrado') {
        specialDays[date] = 'cerrado';
      } else {
        specialDays[date] = { start, end };
      }
    });
  
    // Formatear la configuración
    const config: Config = {
      availableDays: parametros['available_days'].split(','),
      availableHoursStart: parametros['available_hours_start'],
      availableHoursEnd: parametros['available_hours_end'],
      defaultDuration: parseInt(parametros['default_duration'], 10),
      specialDays,
    };
  
    return config;
  }

async function cargarIntencionUser(tipoProp: string,caracte: string,presup:string,zona:string,tipoOp:string,tel:string,sessionID:string){
        try{
          
          const values = [[tel, tipoProp, caracte,presup,zona,tipoOp,sessionID]];
          const sql = 'INSERT INTO interations (phoneNumber, propertyType, featureProperty,estimatedMoney,favoriteArea,operationType,sessionId) values ?';
          await adapterDB.db.promise().query(sql, [values]);  
        }
        catch(err){
          console.error('Error al cargar intencion del usuario:', err);
        }
}
// inicializar un nuevo sesiónID
async function iniciarSesion(): Promise<string> {
  let sessionId = uuidv4();
  while (await sessionIdExiste(sessionId)) {
    sessionId = uuidv4(); // Generar uno nuevo si ya existe
  }
  return sessionId;
  /*
  const sessionId = uuidv4(); // Genera un ID único para la sesión
  console.log(`Sesión iniciada con ID: ${sessionId}`);
  return sessionId;*/
}
/*
// veerifico si el sessionID ya existe
async function sessionIdExiste(sessionId: string): Promise<boolean> {
  const [rows] = await adapterDB.db.query(
    'SELECT COUNT(*) AS count FROM interations WHERE sessionId = ?',
    [sessionId]
  );
  const result = rows as Array<{ count: number }>;
  return result[0].count > 0;
}*/
async function sessionIdExiste(sessionId: string): Promise<boolean> {
  try {
    // Ejecutar la consulta
    const result = await adapterDB.db.promise().query(
      'SELECT COUNT(*) AS count FROM interations WHERE sessionId = ?',
      [sessionId]
    );

    // Convertir el resultado a 'unknown' y luego al tipo esperado
    const [rows] = result as unknown as [{ count: number }[], any]; 

    // Verificar si el conteo es mayor que 0
    return rows[0].count > 0;
  } catch (error) {
    console.error('Error checking sessionId:', error);
    return false; // Retornar false en caso de error
  }
}
export{actualizarExcel,iso2text,text2iso,cargarInstrucciones,descargarYLeerExcel,cargarfaq,getUserVisits,descargarYLeerConfigExcel,cargarIntencionUser,iniciarSesion,sessionIdExiste}
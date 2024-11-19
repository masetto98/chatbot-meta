import {google} from 'googleapis'

import { JWT } from 'google-auth-library';
import { config } from '~/config';
/*
// Inicializo la librearia cliente de google y configuro la auth con credenciales de la cuenta de servicio
const auth = new google.auth.GoogleAuth({
    keyFile:'./calendarchatbot.json',
    scopes:['https://www.googleapis.com/auth/calendar']
});
*/
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(config.CalendarKey),
    scopes:['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({version: "v3"});

const calendarID = 'fe54b32f48982404ffd079ef35374adf6ebf126697e458e4416d68cad51d0c66@group.calendar.google.com';
const timeZone = 'America/Argentina/Buenos_Aires';

const rangeLimit = {
    days: [1,2,3,4,5], // Lunes a Viernes
    startHour:9,
    endHour:17
};

const standardDuration = 1; // Duración por defecto de las citas(1 hora)
const dateLimit = 30; // maximo de dias a traer la lista de Next Events


/**
 * Crea un evento en el calendario
 * @param {string} eventName - Nombre del evento.
 * @param {string} description - Desc del evento.
 * @param {date} date - fecha y hora del inicio del evento en formato ISO.
 * @param {number}  [duration = standardDuration] - Duración del evento en horas. Default es 1 hora.
 * @returns {string} - URL de la invitación al evento.
 */

export async function createEvent(eventName:string,description:string,date:string,duration=standardDuration) {
    try{
        //Auth
        // traigo el cliente de autenticación y fuerzo el tipo a JWT xq calendar recibe este tipo como auth
        const authClient = await auth.getClient() as JWT;
        //const calendar = google.calendar({version: "v3", auth: authClient});

        google.options({auth:authClient})
        // Fecha y hora de inicio del evento
        const startDateTime = new Date(date);
        // Fecha y hora de fin del evento
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + duration)

        const event = {
            summary: eventName,
            description: description,
            start:{
                dateTime: startDateTime.toISOString(),
                timeZone: timeZone,
            },
            end:{
                dateTime: endDateTime.toISOString(),
                timeZone: timeZone,
            }
            //,
           // attendees:[{email:'masetto98@gmail.com'}]
            ,
            colorId: '2' // el id del color verde en google calendar es '11'
        };

        const response = await calendar.events.insert({
            calendarId: calendarID,
            requestBody: event,
            sendUpdates:'all'
        })

        // Generar la URL de la invitación
        const eventId = response.data.id;
        console.log('Evento creado con exito');
        return eventId;

    }
    catch(err){
        console.error('Hubo un error al crear el evento en servicio de calendario de google',err);

    }
}


/**
 * Lista los slots disponibles entre las fechas dadas.
 * @param {Date} [startDate=new Date()] - Fecha de inicio para buscar slots disponibles. Default es 
 * @param {Date} [endDate] - Fecha de fin para buscar slots disponibles. Default es el maximo definido
 * @returns {Array} - Lista de slots disponibles.
 */

export async function listAvailableSlots(startDate = new Date(), endDate?: Date){
    try{
        const authClient = await auth.getClient() as JWT;
        google.options({auth:authClient});

        if(!endDate){
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + dateLimit);
        }

        const response = await calendar.events.list({
            calendarId: calendarID,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items;
        const slots = [];

        const currentDate = new Date(startDate);

        //genera slots disponibles basados en rangeLimit
        while (currentDate < endDate){
            const dayOfWeek = currentDate.getDay();
            if(rangeLimit.days.includes(dayOfWeek)){
                for(let hour = rangeLimit.startHour; hour < rangeLimit.endHour; hour++){
                    const slotStart = new Date(currentDate);
                    slotStart.setHours(hour,0,0,0);
                    const slotEnd = new Date(slotStart);
                    slotEnd.setHours(hour + standardDuration);

                    const isBusy = events.some( event => {
                        const eventStart = new Date(event.start.dateTime || event.start.date);
                        const eventEnd = new Date(event.end.dateTime || event.end.date);
                        return (slotStart < eventEnd && slotEnd > eventStart);

                    });
                    if(!isBusy){
                        slots.push({start: slotStart, end: slotEnd});

                    }
                
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return slots;

    } catch(err){
        console.error('Hubo un error al contactar el servicio de Calendar: ' + err);
        throw err;
    }

}

/**
 * Obtiene el proximo slot disponible a partir de la fecha dada.
 * @param {string|Date} date - Fecha a partir de la cual buscar el proximo slot disponible, puede ser
 * @returns {Object|null} - El proximo slot disponible o null si no hay ninguno.
 */

export async function getNextAvailableSlot(date) {
    try{
        // verifico si date es un string en formato ISO
        if(typeof date === 'string'){
            // convierto el string iso en un obj Date
            date = new Date(date);
        } else if(!(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error('La fecha proporcionada no es válida')
        }

        // obtengo el prox slot disp

        const availableSlots = await listAvailableSlots(date);

        // filtro slots disp q comienzan desp de la fecha proporcionada
        const filteredSlots = availableSlots.filter(slot => new Date(slot.start) > date)
        // ordeno los slots x su hs de inicio en orden ascendente

        const sortedSlots = filteredSlots.sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        // tomo el primer slot de la lista resultante, que sera el prox slot disp mas cercano
        return sortedSlots.length > 0 ? sortedSlots[0] : null;


    
    } catch(err){
        console.error('Hubo un error al obtener el prox slot disponible: ' + err)
        throw err;
    }
    
}

/**
 * Verifica si hay slots disponibles para una fecha dada.
 * @param {Date} date - Fecha a verificar.
 * @returns {boolean} - Devuelve true si hay slots disponibles dentro del rango permitido, false en caso de que 
 */

export async function isDateAvailable(date:Date) {

    try{
        //valido que la fecha este dentro del rango permitido
        const currentDate = new Date();
        const maxDate = new Date(currentDate);
        maxDate.setDate(currentDate.getDate() + dateLimit);

        if(date < currentDate || date > maxDate){
            return false; // La fecha está fuera del rango permitido
        }

        // verifico que la fecha caiga en undia permitido
        const dayOfWeek = date.getDay();
        if(!rangeLimit.days.includes(dayOfWeek)){
            return false; // la fecha no esta dentro de los dias permitidos
        }

        // verifico que la hora este dentro del rango permitido

        const hour = date.getHours();
        if(hour < rangeLimit.startHour ||hour >= rangeLimit.endHour) {
            return false; // la hs no esta dentro del rango permitido
        }

        // obtengo todos los slots disp desde la fecha actual hasta el limite 

        const availableSlots = await listAvailableSlots(currentDate);

        // filtro slots disp basados en la fecha dada
        const slotsOnGivenDate = availableSlots.filter(slot => new Date(slot.start).toDateString() === date.toDateString() )
        // verifico si hay slots disp en la fecha dada
        const isSlotAvailable = slotsOnGivenDate.some( slot => 
            new Date(slot.start).getTime() === date.getTime() && 
            new Date(slot.end).getTime() === date.getTime() + standardDuration * 60 * 60 * 1000
        );

        return isSlotAvailable

    }catch(err){
        console.error('Hubo un error al verificar disp de la fecha: ' + err)
        throw err;
    }
    
}


import { EVENTS, addKeyword } from '@builderbot/bot'
import { BotContext, TFlow } from '@builderbot/bot/dist/types';
import { getLastInteraction } from './utils';
import { createContext } from 'vm';

// Object to store timers for each user
const timers = {};

// Flow for handling inactivity
const idleFlow = addKeyword(EVENTS.ACTION).addAction(
    async (ctx, { endFlow,state }) => {
        /*
        await state.update({intention:undefined})
        state.clear()   
        return endFlow("Pasó el tiempo y voy a tener que cerrar nuestra conversación para seguir ayudando a más personas. De todos modos, cuando me necesites, volvé a escribirme. 🤗");*/

        const lastInteraction = await getLastInteraction(ctx.from);
        const currentTime = new Date().getTime();
        const interactionTime = lastInteraction ? new Date(lastInteraction).getTime() : 0;

        // Si han pasado más de 24 horas desde la última interacción, no enviar el mensaje
        if (interactionTime && (currentTime - interactionTime > 24 * 60 * 60 * 1000)) {
            console.warn("⚠️ No se enviará mensaje de inactividad porque han pasado más de 24 horas.");
            return endFlow(); // Termina el flujo sin enviar mensaje
        }

        // Guardar el estado correctamente antes de cerrar la conversación
        await state.update({ intention: undefined });
        state.clear();
        return endFlow("Pasó el tiempo y voy a tener que cerrar nuestra conversación para seguir ayudando a más personas. De todos modos, cuando me necesites, volvé a escribirme. 🤗");
    }
);

// Function to start the inactivity timer for a user
const start = (ctx: BotContext, gotoFlow: (a: TFlow) => Promise<void>, ms: number) => {
    timers[ctx.from] = setTimeout(() => {
        console.log(`User timeout: ${ctx.from}`);
        return gotoFlow(idleFlow);
    }, ms);
}

// Function to reset the inactivity timer for a user
const reset = (ctx: BotContext, gotoFlow: (a: TFlow) => Promise<void>, ms: number) => {
    stop(ctx);
    if (timers[ctx.from]) {
        console.log(`reset countdown for the user: ${ctx.from}`);
        clearTimeout(timers[ctx.from]);
    }
    start(ctx, gotoFlow, ms);
}

// Function to stop the inactivity timer for a user
const stop = (ctx: BotContext) => {
    if (timers[ctx.from]) {
        clearTimeout(timers[ctx.from]);
    }
}

export {
    start,
    reset,
    stop,
    idleFlow,
}

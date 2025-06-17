import { timerFunction } from '../src/timer.mjs';

// events/ready.mjs
export default async function ({ log, db, presence }, client, {
    timerFunctionFn = timerFunction
} = {}) {
    log.debug('ready', { tag: client.user.tag });
    if (presence) client.user.setPresence(presence);
    try {
        await timerFunctionFn({ client, log, db }); // Run now
    } catch (e) {
        log.error('Error in timerFunction:', e);
    }
    setInterval(async () => {
        try {
            await timerFunctionFn({ client, log, db });
        } catch (e) {
            log.error('Error in timerFunction:', e);
        }
    }, 60000); // Run every minute
    log.info(`Logged in as ${client.user.tag}`);
}
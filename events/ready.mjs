import { join } from 'path';
import { readFileSync } from 'fs';
import log from '../log.mjs';
import { timerFunction } from '../custom/timer.mjs';
import { getCurrentDirname } from '../esm-filename.mjs';



// Event handler for ready
export default async function (client, { log: injectedLog = log, timerFunction: injectedTimerFunction = timerFunction } = {}) {
    // Dynamically load version from package.json
    const dirname = getCurrentDirname(import.meta);
    const pkgPath = join(dirname, '../../package.json');
    let version = 'unknown';
    try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        version = pkg.version || version;
    } catch (e) {
        // Optionally log error
    }
    client.user.setPresence({
        activities: [
            {
                name: `🎧 Leveling v${version}`,
                type: 4
            }],
        status: 'online'
    });
    try {
        await injectedTimerFunction();
    } catch (error) {
        injectedLog.error('Error in timerFunction:', error);
    }
    setInterval(async () => {
        try {
            await injectedTimerFunction();
        } catch (error) {
            injectedLog.error('Error in timerFunction:', error);
        }
    }, 60000); // Run every minute
    injectedLog.info(`Logged in as ${client.user.tag}`);
}

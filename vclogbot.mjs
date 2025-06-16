#!/usr/bin/env node
import 'dotenv/config';
import { log, fs, path, pathUrl, registerHandlers, registerSignals } from '@purinton/common';
import { createDb } from '@purinton/mysql';
import { createDiscord } from '@purinton/discord';

(async () => {
    registerHandlers({ log });
    registerSignals({ log });
    const packageJson = JSON.parse(fs.readFileSync(path(import.meta, 'package.json')), 'utf8');
    const version = packageJson.version;
    const name = `🎧 Leveling v${version}`;
    const status = 'online';
    const db = await createDb();
    const client = await createDiscord({
        log,
        rootDir: path(import.meta),
        intents: {
            Guilds: true,
            GuildMessages: true,
            MessageContent: true,
        },
        context: {
            fs,
            path,
            pathUrl,
            presence: { activities: [{ name, type: 4 }], status },
            db
        },
    });
    registerSignals({
        shutdownHook: async () => {
            await client.destroy();
            await db.end();
            log.info('Shutdown complete.');
        }
    });
})();

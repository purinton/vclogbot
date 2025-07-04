import 'dotenv/config';
import log from '@purinton/log';
import { createDb } from '@purinton/mysql';
import { requiredSecondsForLevel } from './utils.mjs';

export async function main({ db, log } = {}) {
    const [users] = await db.query('SELECT DISTINCT user_id, guild_id FROM sessions');
    for (const { user_id, guild_id } of users) {
        const [rows] = await db.query(
            `SELECT SUM(
               IFNULL(UNIX_TIMESTAMP(leave_time), UNIX_TIMESTAMP()) - UNIX_TIMESTAMP(join_time)
            ) AS total_seconds
            FROM sessions WHERE user_id = ? AND guild_id = ? AND join_time IS NOT NULL`,
            [user_id, guild_id]
        );
        const total_seconds = Math.max(0, rows[0].total_seconds || 0);
        let level = 0;
        while (total_seconds >= requiredSecondsForLevel(level + 1)) level++;
        await db.query(
            `INSERT INTO users (user_id, guild_id, total_seconds, last_level) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE total_seconds=?, last_level=?`,
            [user_id, guild_id, total_seconds, level, total_seconds, level]
        );
        log.info(`Updated user ${user_id} in guild ${guild_id}: total_seconds=${total_seconds}, level=${level}`);
    }
    log.info('Sanity check complete.');
}

if (process.argv[1] && process.argv[1].endsWith('dbSanityCheck.mjs')) {
    const db = await createDb();
    await main({ db, log }).catch(e => {
        log.error('Error running sanity check:', e);
        process.exit(1);
    });
    await db.end();
}

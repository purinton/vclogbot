// Timer utility for periodic level-up checks
import { calculateLevel, requiredSecondsForLevel, getCurrentTimestamp } from './utils.mjs';
import { sendMessage } from './messageService.mjs';

export const timerFunction = async (
    { client, log, db },
    {
        calculateLevelfn = calculateLevel,
        requiredSecondsForLevelfn = requiredSecondsForLevel,
        getCurrentTimestampfn = getCurrentTimestamp,
        sendMessagefn = sendMessage,
    } = {}
) => {
    try {
        log.debug('Timer tick', { time: getCurrentTimestampfn() });
        const [openSessions] = await db.query(`SELECT * FROM sessions WHERE leave_time IS NULL`);
        if (!openSessions || openSessions.length === 0) return;
        for (const session of openSessions) {
            log.debug(`Open session: user_id=${session.user_id}, guild_id=${session.guild_id}, channel_id=${session.channel_id}, join_time=${session.join_time}`);
            const { user_id, guild_id, channel_id, join_time } = session;
            const now = new Date();
            const join = new Date(join_time);
            log.debug(`Current time: ${now.toISOString()}, Join time: ${join.toISOString()}`);
            const openSeconds = Math.floor((now - join) / 1000);
            log.debug(`Open seconds: ${openSeconds}`);
            // Get closed session seconds
            const [closedRows] = await db.query(
                `SELECT SUM(TIMESTAMPDIFF(SECOND, join_time, leave_time)) as closedSeconds FROM sessions WHERE user_id = ? AND guild_id = ? AND leave_time IS NOT NULL`,
                [user_id, guild_id]
            );
            log.debug(`Closed session query result: ${JSON.stringify(closedRows)}`);
            const closedSeconds = Number(closedRows[0]?.closedSeconds) || 0;
            log.debug(`Closed seconds: ${closedSeconds}`);
            const totalSeconds = closedSeconds + openSeconds;
            log.debug(`Total seconds: ${totalSeconds}`);
            // Get user record
            const [userRows] = await db.query(
                `SELECT * FROM users WHERE user_id = ? AND guild_id = ?`,
                [user_id, guild_id]
            );
            log.debug(`User query result: ${JSON.stringify(userRows)}`);
            let user = userRows[0];
            if (!user) {
                log.debug(`No user found, inserting new user with total_seconds=${totalSeconds}`);
                await db.query(
                    `INSERT INTO users (user_id, guild_id, total_seconds, last_level) VALUES (?, ?, ?, 0)`,
                    [user_id, guild_id, totalSeconds]
                );
                user = { user_id, guild_id, total_seconds: totalSeconds, last_level: 0 };
            }
            log.debug(`User before level calculation: ${JSON.stringify(user)}`);
            const { level, leveledUp } = calculateLevelfn(totalSeconds, user.last_level, requiredSecondsForLevelfn);
            log.debug(`Level calculation result: level=${level}, leveledUp=${leveledUp}`);
            await db.query(
                `UPDATE users SET total_seconds = ?, last_level = ? WHERE user_id = ? AND guild_id = ?`,
                [totalSeconds, level, user_id, guild_id]
            );
            log.debug(`Updated user: user_id=${user_id}, guild_id=${guild_id}, total_seconds=${totalSeconds}, last_level=${level}`);
            if (leveledUp) {
                const msg = `${getCurrentTimestampfn()} <@${user_id}> reached level ${level}! 🎉 `;
                log.debug(`Sending level up message: ${msg}`);
                await sendMessagefn({ client, channel_id, content: msg, log });
            }
        }
    } catch (error) {
        log.error('Error in timerFunction:', error);
        throw error; // Re-throw to be caught by the caller
    }
};
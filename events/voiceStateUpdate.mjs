import dbPromise from '../db.mjs';
import log from '../log.mjs';
import { getCurrentTimestamp } from '../custom/utils.mjs';
import { timerFunction } from '../custom/timer.mjs';

// Event handler for voiceStateUpdate (standard event export style)
export default async function (oldState, newState, { db: injectedDb, log: injectedLog = log, timerFunction: injectedTimerFunction = timerFunction, getCurrentTimestamp: injectedGetCurrentTimestamp = getCurrentTimestamp, messageService = global.messageService } = {}) {
    const db = injectedDb || await dbPromise;
    try {
        injectedLog.debug(`VoiceStateUpdate: oldState=${JSON.stringify(oldState)}, newState=${JSON.stringify(newState)}`);
        // User leaves a voice channel
        if (oldState.channelId && !newState.channelId) {
            try {
                // Check for existing open session
                const [openSessionRows] = await db.query(
                    `SELECT * FROM sessions WHERE user_id = ? AND guild_id = ? AND leave_time IS NULL`,
                    [oldState.id, oldState.guild?.id]
                );
                const openSession = openSessionRows[0];
                if (openSession) {
                    // Await timerFunction to update user records
                    await injectedTimerFunction();
                    // Set leave_time for the session
                    const now = new Date();
                    const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
                    await db.query(
                        `UPDATE sessions SET leave_time = ? WHERE id = ?`,
                        [mysqlDatetime, openSession.id]
                    );
                    if (messageService) {
                        const msg = `${injectedGetCurrentTimestamp()} <@${oldState.id}> left!`;
                        await messageService.sendMessage(oldState.channelId, msg);
                    }
                }
            } catch (err) {
                injectedLog.error('Error handling voice leave event', err);
            }
        } else if (newState.channelId) {
            // Any event where the user is in a channel (join, mute/unmute, etc)
            try {
                // Check for existing open session
                const [openSessionRows] = await db.query(
                    `SELECT * FROM sessions WHERE user_id = ? AND guild_id = ? AND leave_time IS NULL`,
                    [newState.id, newState.guild?.id]
                );
                const openSession = openSessionRows[0];
                if (!openSession) {
                    // Insert new session (late join or missed join event)
                    const now = new Date();
                    const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
                    await db.query(
                        `INSERT INTO sessions (user_id, guild_id, channel_id, join_time) VALUES (?, ?, ?, ?)`,
                        [newState.id, newState.guild?.id, newState.channelId, mysqlDatetime]
                    );
                    if (messageService) {
                        const msg = `${injectedGetCurrentTimestamp()} <@${newState.id}> joined!`;
                        await messageService.sendMessage(newState.channelId, msg);
                    }
                }
            } catch (err) {
                injectedLog.error('Error handling voice session start event', err);
            }
        }
        // else: do nothing if not in a channel
    } catch (error) {
        injectedLog.error('Error in voiceStateUpdate event handler', error);
        throw error;
    }
}

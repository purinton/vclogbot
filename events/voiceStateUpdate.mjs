// events/voiceStateUpdate.mjs
import { getCurrentTimestamp } from '../src/utils.mjs';
import { timerFunction } from '../src/timer.mjs';
import { sendMessage } from '../src/messageService.mjs';

export default async function ({ client, log, db }, oldState, newState, {
    timerFunctionfn = timerFunction,
    getCurrentTimestampfn = getCurrentTimestamp,
    sendMessagefn = sendMessage,
} = {}) {
    log.debug('voiceStateUpdate', { oldState, newState });
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
                await timerFunctionfn({ client, log, db }); // Use the injected function
                // Set leave_time for the session
                const now = new Date();
                const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
                await db.query(
                    `UPDATE sessions SET leave_time = ? WHERE id = ?`,
                    [mysqlDatetime, openSession.id]
                );
                const content = `${getCurrentTimestampfn()} <@${oldState.id}> left!`;
                await sendMessagefn({ client, channel_id: oldState.channelId, content, log });
            }
        } catch (err) {
            log.error('Error handling voice leave event', err);
        }
    } 
    // User switches from one voice channel to another
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        try {
            // Message in old channel: moved to new channel
            const contentOld = `${getCurrentTimestampfn()} <@${oldState.id}> moved to <#${newState.channelId}>`;
            await sendMessagefn({ client, channel_id: oldState.channelId, content: contentOld, log });
            // Message in new channel: moved from old channel
            const contentNew = `${getCurrentTimestampfn()} <@${newState.id}> moved from <#${oldState.channelId}>`;
            await sendMessagefn({ client, channel_id: newState.channelId, content: contentNew, log });
        } catch (err) {
            log.error('Error handling voice channel switch event', err);
        }
    }
    else if (newState.channelId) {
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
                if (sendMessagefn) {
                    const content = `${getCurrentTimestampfn()} <@${newState.id}> joined!`;
                    await sendMessagefn({ client, channel_id: newState.channelId, content, log });
                }
            }
        } catch (err) {
            log.error('Error handling voice session start event', err);
        }
    }
}
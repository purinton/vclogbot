// Message sending utility for Discord
import log from '../log.mjs';

export async function sendMessage(channelId, content, client = global.client || null, logger = log) {
  try {
    if (!client) {
      logger.error?.('Discord client is not initialized');
      return;
    }
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      logger.debug?.(`Channel ${channelId} not found`);
      return;
    }
    await channel.send({
      content,
      allowedMentions: { parse: [] },
    });
    logger.debug?.(`Message sent to channel ${channelId}: ${content}`);
  } catch (e) {
    logger.error?.('Error sending message:', e);
  }
}

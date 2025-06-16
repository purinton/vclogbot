// Message sending utility for Discord
export async function sendMessage({ client, channel_id, content, log }) {
  try {
    if (!client) {
      log.error?.('Discord client is not initialized');
      return;
    }
    const channel = await client.channels.fetch(channel_id);
    if (!channel) {
      log.debug?.(`Channel ${channel_id} not found`);
      return;
    }
    await channel.send({ content, allowedMentions: { parse: [] } });
    log.debug?.(`Message sent to channel ${channel_id}: ${content}`);
  } catch (e) {
    log.error?.('Error sending message:', e);
  }
}
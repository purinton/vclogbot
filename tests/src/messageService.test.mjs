// Tests for sendMessage in messageService.mjs
import { jest } from '@jest/globals';
import { sendMessage } from '../../src/messageService.mjs';

const mockChannel = {
    send: jest.fn().mockResolvedValue(true),
};

const mockClient = {
    channels: {
        fetch: jest.fn(),
    },
};

const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
};

describe('sendMessage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sends a message to the correct channel', async () => {
        mockClient.channels.fetch.mockResolvedValue(mockChannel);
        const channel_id = '123';
        const content = 'Hello!';
        await sendMessage({ client: mockClient, channel_id, content, log: mockLogger });
        expect(mockClient.channels.fetch).toHaveBeenCalledWith(channel_id);
        expect(mockChannel.send).toHaveBeenCalledWith({
            content,
            allowedMentions: { parse: [] },
        });
        expect(mockLogger.debug).toHaveBeenCalledWith(
            `Message sent to channel ${channel_id}: ${content}`
        );
    });

    it('logs and returns if channel is not found', async () => {
        mockClient.channels.fetch.mockResolvedValue(null);
        const channel_id = 'notfound';
        await sendMessage({ client: mockClient, channel_id, content: 'test', log: mockLogger });
        expect(mockLogger.debug).toHaveBeenCalledWith(
            `Channel ${channel_id} not found`
        );
        expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('logs error if send throws', async () => {
        mockClient.channels.fetch.mockResolvedValue(mockChannel);
        mockChannel.send.mockRejectedValueOnce(new Error('fail'));
        await sendMessage({ client: mockClient, channel_id: '123', content: 'fail', log: mockLogger });
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error sending message:',
            expect.any(Error)
        );
    });
});

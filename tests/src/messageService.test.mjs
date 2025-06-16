// Tests for sendMessage in messageService.mjs
import { jest } from '@jest/globals';
import { sendMessage } from '../../src/custom/messageService.mjs';

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
        const channelId = '123';
        const content = 'Hello!';
        await sendMessage(channelId, content, mockClient, mockLogger);
        expect(mockClient.channels.fetch).toHaveBeenCalledWith(channelId);
        expect(mockChannel.send).toHaveBeenCalledWith({
            content,
            allowedMentions: { parse: [] },
        });
        expect(mockLogger.debug).toHaveBeenCalledWith(
            `Message sent to channel ${channelId}: ${content}`
        );
    });

    it('logs and returns if channel is not found', async () => {
        mockClient.channels.fetch.mockResolvedValue(null);
        const channelId = 'notfound';
        await sendMessage(channelId, 'test', mockClient, mockLogger);
        expect(mockLogger.debug).toHaveBeenCalledWith(
            `Channel ${channelId} not found`
        );
        expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('logs error if send throws', async () => {
        mockClient.channels.fetch.mockResolvedValue(mockChannel);
        mockChannel.send.mockRejectedValueOnce(new Error('fail'));
        await sendMessage('123', 'fail', mockClient, mockLogger);
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error sending message:',
            expect.any(Error)
        );
    });
});

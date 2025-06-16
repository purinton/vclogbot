import { jest } from '@jest/globals';
import helpHandler from '../../commands/help.mjs';

describe('/help command handler', () => {
    let mockLog, mockMsg, interaction;

    beforeEach(() => {
        mockLog = { error: jest.fn(), debug: jest.fn() };
        mockMsg = jest.fn((key, fallback) => fallback);
        interaction = {
            locale: 'en-US',
            reply: jest.fn().mockResolvedValue()
        };
    });

    it('replies with help content', async () => {
        mockMsg.mockReturnValueOnce('Help content here.');
        await helpHandler({ log: mockLog, msg: mockMsg }, interaction);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: 'Help content here.',
            flags: 1 << 6
        });
    });
});

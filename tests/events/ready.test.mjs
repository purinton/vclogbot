import { jest } from '@jest/globals';
import readyHandler from '../../events/ready.mjs';

// Mock objects
function createMockClient() {
    return {
        user: {
            tag: 'TestUser#1234',
            setPresence: jest.fn(),
        },
    };
}

describe('ready event handler', () => {
    let mockLog, mockTimerFunction, client, mockDb, mockPresence;

    beforeEach(() => {
        mockLog = {
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        mockTimerFunction = jest.fn().mockResolvedValue();
        client = createMockClient();
        mockDb = {};
        mockPresence = { activities: [{ name: '🎧 Leveling vX', type: 4 }], status: 'online' };
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('logs in and sets presence', async () => {
        await readyHandler({ log: mockLog, db: mockDb, presence: mockPresence }, client, { timerFunctionFn: mockTimerFunction });
        expect(mockLog.info).toHaveBeenCalledWith('Logged in as TestUser#1234');
        expect(client.user.setPresence).toHaveBeenCalledWith(mockPresence);
    });

    it('calls timerFunction immediately and on interval', async () => {
        await readyHandler({ log: mockLog, db: mockDb }, client, { timerFunctionFn: mockTimerFunction });
        expect(mockTimerFunction).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(60000);
        await Promise.resolve();
        expect(mockTimerFunction).toHaveBeenCalledTimes(2);
    });

    it('logs error if timerFunction throws', async () => {
        mockTimerFunction.mockRejectedValueOnce(new Error('fail'));
        await readyHandler({ log: mockLog, db: mockDb }, client, { timerFunctionFn: mockTimerFunction });
        // The error should be logged from the initial call
        expect(mockLog.error).toHaveBeenCalledWith('Error in timerFunction:', expect.any(Error));
        jest.advanceTimersByTime(60000);
        await Promise.resolve();
        expect(mockLog.error).toHaveBeenCalledTimes(1);
    });
});
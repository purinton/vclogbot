import { jest } from '@jest/globals';
import readyHandler from '../../src/events/ready.mjs';

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
    let mockLog, mockTimerFunction, client;

    beforeEach(() => {
        mockLog = {
            info: jest.fn(),
            error: jest.fn(),
        };
        mockTimerFunction = jest.fn().mockResolvedValue();
        client = createMockClient();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('logs in and sets presence', async () => {
        await readyHandler(client, { log: mockLog, timerFunction: mockTimerFunction });
        expect(mockLog.info).toHaveBeenCalledWith('Logged in as TestUser#1234');
        // Accept any version string in the presence name
        const presenceArg = client.user.setPresence.mock.calls[0][0];
        expect(presenceArg.activities[0].name).toMatch(/^🎧 Leveling v/);
        expect(presenceArg.activities[0].type).toBe(4);
        expect(presenceArg.status).toBe('online');
    });

    it('calls timerFunction immediately and on interval', async () => {
        await readyHandler(client, { log: mockLog, timerFunction: mockTimerFunction });
        expect(mockTimerFunction).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(60000);
        // Wait for the interval callback to run
        await Promise.resolve();
        expect(mockTimerFunction).toHaveBeenCalledTimes(2);
    });

    it('logs error if timerFunction throws', async () => {
        mockTimerFunction.mockRejectedValueOnce(new Error('fail'));
        await readyHandler(client, { log: mockLog, timerFunction: mockTimerFunction });
        // The error should be logged from the initial call
        expect(mockLog.error).toHaveBeenCalledWith('Error in timerFunction:', expect.any(Error));
        // Now advance the timer and ensure no additional error log (since next call resolves)
        jest.advanceTimersByTime(60000);
        await Promise.resolve();
        expect(mockLog.error).toHaveBeenCalledTimes(1);
    });
});
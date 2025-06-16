// Tests for timerFunction in timer.mjs
import { jest } from '@jest/globals';
import { timerFunction } from '../../src/timer.mjs';

const mockDb = {
    query: jest.fn(),
};
const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
};
const mockClient = {};

describe('timerFunction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does nothing if no open sessions', async () => {
        mockDb.query.mockResolvedValueOnce([[]]);
        await timerFunction({ client: mockClient, log: mockLogger, db: mockDb });
        expect(mockDb.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM sessions WHERE leave_time IS NULL')
        );
    });

    it('inserts new user and sends level up message', async () => {
        const now = Date.now();
        const openSession = {
            user_id: 'u1',
            guild_id: 'g1',
            channel_id: 'c1',
            join_time: new Date(now - 60 * 1000).toISOString(), // joined 60 seconds ago
        };
        mockDb.query
            .mockResolvedValueOnce([[openSession]]) // open sessions
            .mockResolvedValueOnce([[{ closedSeconds: 0 }]]) // closed sessions
            .mockResolvedValueOnce([[]]) // userRows
            .mockResolvedValueOnce([{}]) // insert user
            .mockResolvedValueOnce([{}]); // update user
        const sendMessageMock = jest.fn();
        const calculateLevelMock = jest.fn(() => ({ level: 1, leveledUp: true }));
        const requiredSecondsForLevelMock = jest.fn(() => 60);
        const getCurrentTimestampMock = jest.fn(() => 'timestamp');
        await timerFunction(
            { client: mockClient, log: mockLogger, db: mockDb },
            {
                sendMessagefn: sendMessageMock,
                calculateLevelfn: calculateLevelMock,
                requiredSecondsForLevelfn: requiredSecondsForLevelMock,
                getCurrentTimestampfn: getCurrentTimestampMock,
            }
        );
        const insertCall = mockDb.query.mock.calls.find(call => call[0].includes('INSERT INTO users'));
        expect(insertCall).toBeDefined();
        expect(insertCall[1]).toEqual(expect.arrayContaining(['u1', 'g1', expect.any(Number)]));
        expect(sendMessageMock).toHaveBeenCalledWith(
            expect.objectContaining({
                client: mockClient,
                channel_id: 'c1',
                content: expect.stringContaining('<@u1> reached level'),
                log: mockLogger,
            })
        );
    });

    it('updates existing user and sends level up message', async () => {
        const now = Date.now();
        const openSession = {
            user_id: 'u2',
            guild_id: 'g2',
            channel_id: 'c2',
            join_time: new Date(now - 120 * 1000).toISOString(), // joined 120 seconds ago
        };
        const userRow = { user_id: 'u2', guild_id: 'g2', total_seconds: 60, last_level: 1 };
        mockDb.query
            .mockResolvedValueOnce([[openSession]]) // open sessions
            .mockResolvedValueOnce([[{ closedSeconds: 60 }]]) // closed sessions
            .mockResolvedValueOnce([[userRow]]) // userRows
            .mockResolvedValueOnce([{}]); // update user
        const sendMessageMock = jest.fn();
        const calculateLevelMock = jest.fn(() => ({ level: 2, leveledUp: true }));
        const requiredSecondsForLevelMock = jest.fn(() => 180);
        const getCurrentTimestampMock = jest.fn(() => 'timestamp');
        await timerFunction(
            { client: mockClient, log: mockLogger, db: mockDb },
            {
                sendMessagefn: sendMessageMock,
                calculateLevelfn: calculateLevelMock,
                requiredSecondsForLevelfn: requiredSecondsForLevelMock,
                getCurrentTimestampfn: getCurrentTimestampMock,
            }
        );
        const updateCall = mockDb.query.mock.calls.find(call => call[0].includes('UPDATE users SET total_seconds = ?'));
        expect(updateCall).toBeDefined();
        expect(updateCall[1]).toEqual(expect.arrayContaining([expect.any(Number), expect.any(Number), 'u2', 'g2']));
        expect(sendMessageMock).toHaveBeenCalledWith(
            expect.objectContaining({
                client: mockClient,
                channel_id: 'c2',
                content: expect.stringContaining('<@u2> reached level'),
                log: mockLogger,
            })
        );
    });

    it('handles errors and logs them', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('db fail'));
        const sendMessageMock = jest.fn();
        await expect(timerFunction(
            { client: mockClient, log: mockLogger, db: mockDb },
            { sendMessagefn: sendMessageMock }
        )).rejects.toThrow('db fail');
        expect(mockLogger.error).toHaveBeenCalledWith('Error in timerFunction:', expect.any(Error));
    });
});

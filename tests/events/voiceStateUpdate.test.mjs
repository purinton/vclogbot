import { jest } from '@jest/globals';
import voiceStateUpdateHandler from '../../src/events/voiceStateUpdate.mjs';

describe('voiceStateUpdate event handler', () => {
    let mockDb, mockLog, mockTimerFunction, mockGetCurrentTimestamp, mockMessageService;
    const now = new Date('2025-06-04T12:00:00Z');
    const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');

    beforeEach(() => {
        mockDb = {
            query: jest.fn()
        };
        mockLog = {
            debug: jest.fn(),
            error: jest.fn()
        };
        mockTimerFunction = jest.fn().mockResolvedValue();
        mockGetCurrentTimestamp = jest.fn().mockReturnValue('12:00:00');
        mockMessageService = {
            sendMessage: jest.fn().mockResolvedValue()
        };
        jest.useFakeTimers().setSystemTime(now);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('handles user leaving a voice channel and closes session', async () => {
        mockDb.query.mockResolvedValueOnce([[{ id: 1 }]]) // open session exists
            .mockResolvedValueOnce([{}]); // update query
        const oldState = { id: 'user1', guild: { id: 'guild1' }, channelId: 'chan1' };
        const newState = { id: 'user1', guild: { id: 'guild1' }, channelId: null };
        await voiceStateUpdateHandler(oldState, newState, {
            db: mockDb,
            log: mockLog,
            timerFunction: mockTimerFunction,
            getCurrentTimestamp: mockGetCurrentTimestamp,
            messageService: mockMessageService
        });
        expect(mockDb.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM sessions'),
            ['user1', 'guild1']
        );
        expect(mockTimerFunction).toHaveBeenCalled();
        expect(mockDb.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE sessions SET leave_time'),
            [mysqlDatetime, 1]
        );
        expect(mockMessageService.sendMessage).toHaveBeenCalledWith('chan1', '12:00:00 <@user1> left!');
    });

    it('handles user joining a voice channel and opens session', async () => {
        mockDb.query.mockResolvedValueOnce([[]]) // no open session
            .mockResolvedValueOnce([{}]); // insert query
        const oldState = { id: 'user2', guild: { id: 'guild2' }, channelId: null };
        const newState = { id: 'user2', guild: { id: 'guild2' }, channelId: 'chan2' };
        await voiceStateUpdateHandler(oldState, newState, {
            db: mockDb,
            log: mockLog,
            timerFunction: mockTimerFunction,
            getCurrentTimestamp: mockGetCurrentTimestamp,
            messageService: mockMessageService
        });
        expect(mockDb.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM sessions'),
            ['user2', 'guild2']
        );
        expect(mockDb.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO sessions'),
            ['user2', 'guild2', 'chan2', mysqlDatetime]
        );
        expect(mockMessageService.sendMessage).toHaveBeenCalledWith('chan2', '12:00:00 <@user2> joined!');
    });

    it('does nothing if user switches between channels with open session', async () => {
        mockDb.query.mockResolvedValueOnce([[{ id: 2 }]]); // open session exists
        const oldState = { id: 'user3', guild: { id: 'guild3' }, channelId: 'chan3' };
        const newState = { id: 'user3', guild: { id: 'guild3' }, channelId: 'chan4' };
        await voiceStateUpdateHandler(oldState, newState, {
            db: mockDb,
            log: mockLog,
            timerFunction: mockTimerFunction,
            getCurrentTimestamp: mockGetCurrentTimestamp,
            messageService: mockMessageService
        });
        // Should only check for open session, not insert or update
        expect(mockDb.query).toHaveBeenCalledTimes(1);
        expect(mockMessageService.sendMessage).not.toHaveBeenCalled();
    });

    it('logs error if db query fails on leave', async () => {
        mockDb.query.mockRejectedValueOnce(new Error('fail'));
        const oldState = { id: 'user4', guild: { id: 'guild4' }, channelId: 'chan4' };
        const newState = { id: 'user4', guild: { id: 'guild4' }, channelId: null };
        await voiceStateUpdateHandler(oldState, newState, {
            db: mockDb,
            log: mockLog,
            timerFunction: mockTimerFunction,
            getCurrentTimestamp: mockGetCurrentTimestamp,
            messageService: mockMessageService
        });
        expect(mockLog.error).toHaveBeenCalledWith('Error handling voice leave event', expect.any(Error));
    });

    it('logs error if db query fails on join', async () => {
        mockDb.query.mockResolvedValueOnce([[]]);
        mockDb.query.mockRejectedValueOnce(new Error('fail'));
        const oldState = { id: 'user5', guild: { id: 'guild5' }, channelId: null };
        const newState = { id: 'user5', guild: { id: 'guild5' }, channelId: 'chan5' };
        await voiceStateUpdateHandler(oldState, newState, {
            db: mockDb,
            log: mockLog,
            timerFunction: mockTimerFunction,
            getCurrentTimestamp: mockGetCurrentTimestamp,
            messageService: mockMessageService
        });
        expect(mockLog.error).toHaveBeenCalledWith('Error handling voice session start event', expect.any(Error));
    });

    it('logs error if handler throws', async () => {
        // Simulate error outside inner try/catch by passing null log (should throw when trying to call injectedLog.debug)
        await voiceStateUpdateHandler({}, {}, {
            db: null,
            log: null, // This will cause a TypeError at injectedLog.debug
            timerFunction: mockTimerFunction,
            getCurrentTimestamp: mockGetCurrentTimestamp,
            messageService: mockMessageService
        }).catch(() => {}); // Ignore the thrown error for this test
        expect.assertions(1);
        try {
            await voiceStateUpdateHandler({}, {}, {
                db: null,
                log: null,
                timerFunction: mockTimerFunction,
                getCurrentTimestamp: mockGetCurrentTimestamp,
                messageService: mockMessageService
            });
        } catch (e) {
            expect(e).toBeInstanceOf(TypeError);
        }
    });
});

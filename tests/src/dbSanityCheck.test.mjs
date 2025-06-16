// Tests for dbSanityCheck.mjs
import { jest } from '@jest/globals';
import * as dbSanityCheck from '../../src/dbSanityCheck.mjs';

describe('dbSanityCheck', () => {
  it('should export a main function', () => {
    expect(typeof dbSanityCheck.main).toBe('function');
  });

  it('main should run without throwing (mocked)', async () => {
    const mockDb = {
      query: jest.fn()
        .mockResolvedValueOnce([[{ user_id: '1', guild_id: '2' }]]) // users
        .mockResolvedValueOnce([[{ total_seconds: 1000 }]]) // session sum
        .mockResolvedValueOnce([{}]) // insert/update
    };
    const mockLog = { info: jest.fn(), error: jest.fn() };
    await expect(dbSanityCheck.main({ db: mockDb, log: mockLog })).resolves.not.toThrow();
    expect(mockDb.query).toHaveBeenCalled();
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining('Updated user'));
    expect(mockLog.info).toHaveBeenCalledWith('Sanity check complete.');
  });
});

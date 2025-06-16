// Tests for utils.mjs
import * as utils from '../../src/utils.mjs';

describe('utils', () => {
  it('should export at least one function', () => {
    const exported = Object.values(utils).filter(v => typeof v === 'function');
    expect(exported.length).toBeGreaterThan(0);
  });

  it('formatTime should format seconds', () => {
    expect(utils.formatTime(3661)).toMatch(/1h 1m/);
    expect(utils.formatTime(59)).toMatch(/0m/);
  });

  it('getCurrentTimestamp should return a Discord timestamp string', () => {
    expect(utils.getCurrentTimestamp()).toMatch(/<t:\d+:R>/);
  });

  it('calculateLevel should return correct level and leveledUp', () => {
    const required = (lvl) => lvl * 100;
    const result = utils.calculateLevel(250, 0, required);
    expect(result.level).toBe(2);
    expect(result.leveledUp).toBe(true);
  });

  it('requiredSecondsForLevel should return a number', () => {
    expect(typeof utils.requiredSecondsForLevel(2)).toBe('number');
  });
});

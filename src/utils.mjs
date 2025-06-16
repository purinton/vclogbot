// Helper for formatting seconds as hours/minutes
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// Helper for Discord timestamp
export function getCurrentTimestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:R>`;
}

// Level calculation logic
export function calculateLevel(totalSeconds, lastLevel, requiredSecondsForLevel) {
  let level = lastLevel;
  let nextLevel = level + 1;
  let required = requiredSecondsForLevel(nextLevel);
  let leveledUp = false;
  while (totalSeconds >= required) {
    level = nextLevel;
    nextLevel++;
    required = requiredSecondsForLevel(nextLevel);
    leveledUp = true;
  }
  return { level, leveledUp };
}

// Triangular number formula for required seconds per level
export function requiredSecondsForLevel(level) {
  return Math.floor((level * (level + 1)) / 2) * 60;
}

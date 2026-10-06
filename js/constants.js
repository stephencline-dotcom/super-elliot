// Shared constants. Edit INTERVAL_DAYS to change how fast review spacing grows.
export const STORAGE_VERSION = 1;
export const INTERVAL_DAYS = [1, 2, 4, 7, 14, 30];
export const STAGES = ['try', 'try-again', 'guided-building', 'final-try'];
export const ATTEMPT_TYPES = ['first', 'retry'];
export const REVIEW_KINDS = ['first-exposure', 'same-session', 'same-day', 'later-session'];
export const OUTCOMES = ['independent', 'supported', 'moved-on'];

export const DEFAULT_SETTINGS = {
  narration: false,
  speechVolume: 1,
  speechRate: 0.9,
  effectsVolume: 0.6,
  muted: false,
  motion: 'system', // 'system' | 'reduced' | 'full'
  celebrations: true,
  sessionLength: 8,
};

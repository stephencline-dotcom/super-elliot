import { totalPoints } from './scoring.js';
import {
  DEFAULT_SETTINGS, INTERVAL_DAYS, ATTEMPT_TYPES, OUTCOMES, REVIEW_KINDS, STAGES, STORAGE_VERSION,
} from './constants.js';
import { isDateString } from './dates.js';

export const PROGRESS_KEY = 'spelling-ballpark:progress:v1';
export const BACKUP_KEY = 'spelling-ballpark:progress-backup-before-import:v1';
export const CORRUPT_KEY = 'spelling-ballpark:progress-unreadable:v1';
export const SETTINGS_KEY = 'spelling-ballpark:settings:v1';
const APP_ID = 'spelling-ballpark';
const WORD_RE = /^[a-z'-]{1,40}$/;
const MAX_ATTEMPTS = 50000;

export function emptyProgress(now = new Date()) {
  const t = now.toISOString();
  return {
    app: APP_ID,
    version: STORAGE_VERSION,
    createdAt: t,
    updatedAt: t,
    sessions: [],
    attempts: [],
    activities: [],
    words: {},
    points: { ledger: [] },
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v, max = 200) => typeof v === 'string' && v.length <= max;
const isBool = (v) => typeof v === 'boolean';
const lessonId = (v) => typeof v === 'string' && /^[a-z0-9-]{1,80}$/.test(v) ? v : null;
const lessonMeta = (v) => ({
  currentLessonId: lessonId(v.currentLessonId),
  originLessonId: lessonId(v.originLessonId),
  lessonContext: ['core', 'transfer', 'connected-review', 'extra-new', 'extra-review', 'quick-new', 'quick-review'].includes(v.lessonContext) ? v.lessonContext : null,
});

// Returns { ok, errors, data }. `data` is a sanitized copy containing only known fields.
export function validateProgress(input) {
  const errors = [];
  if (!isObj(input)) return { ok: false, errors: ['File is not a JSON object.'], data: null };
  if (input.app !== APP_ID) errors.push('This is not a Spelling Ballpark progress file.');
  if (input.version !== STORAGE_VERSION) errors.push(`Unsupported version (expected ${STORAGE_VERSION}).`);
  if (!Array.isArray(input.sessions)) errors.push('Missing sessions list.');
  if (!Array.isArray(input.attempts)) errors.push('Missing attempts list.');
  if (!isObj(input.words)) errors.push('Missing word records.');
  if (!isObj(input.points) || !Array.isArray(input.points.ledger)) errors.push('Missing points ledger.');
  if (errors.length) return { ok: false, errors, data: null };
  if (input.attempts.length > MAX_ATTEMPTS) return { ok: false, errors: ['Too many attempts.'], data: null };

  const data = emptyProgress();
  data.createdAt = isStr(input.createdAt, 40) ? input.createdAt : data.createdAt;
  data.updatedAt = isStr(input.updatedAt, 40) ? input.updatedAt : data.updatedAt;

  input.sessions.forEach((s, i) => {
    const ok = isObj(s) && isStr(s.id, 80) && isDateString(s.date) && isStr(s.startedAt, 40);
    if (!ok) return errors.push(`Session ${i + 1} is invalid.`);
    const results = Array.isArray(s.results) ? s.results : [];
    const cleanResults = results.filter(
      (r) => isObj(r) && WORD_RE.test(r.word) && OUTCOMES.includes(r.outcome) && REVIEW_KINDS.includes(r.reviewKind),
    ).map((r) => ({ word: r.word, outcome: r.outcome, reviewKind: r.reviewKind, ...lessonMeta(r) }));
    data.sessions.push({
      id: s.id, date: s.date, startedAt: s.startedAt,
      endedAt: isStr(s.endedAt, 40) ? s.endedAt : null,
      plannedWords: Number.isInteger(s.plannedWords) ? s.plannedWords : 0,
      completedWords: Number.isInteger(s.completedWords) ? s.completedWords : 0,
      results: cleanResults, lessonId: lessonId(s.lessonId), practiceMode: ['extra','quick'].includes(s.practiceMode) ? s.practiceMode : 'lesson',
    });
  });

  input.attempts.forEach((a, i) => {
    const ok = isObj(a) && isStr(a.id, 80) && WORD_RE.test(a.word) && isStr(a.typed, 60) && isDateString(a.date)
      && isStr(a.sessionId, 80) && STAGES.includes(a.stage) && isBool(a.correct) && isBool(a.hintUsed)
      && isBool(a.modelUsed) && ATTEMPT_TYPES.includes(a.attemptType) && REVIEW_KINDS.includes(a.reviewKind);
    if (!ok) return errors.push(`Attempt ${i + 1} is invalid.`);
    data.attempts.push({
      id: a.id, word: a.word, typed: a.typed, date: a.date, sessionId: a.sessionId, stage: a.stage,
      correct: a.correct, hintUsed: a.hintUsed, modelUsed: a.modelUsed, correctionShown: a.correctionShown === true,
      attemptType: a.attemptType, reviewKind: a.reviewKind,
      instructionShown: a.instructionShown === true, ...lessonMeta(a),
    });
  });

  if (input.activities !== undefined && (!Array.isArray(input.activities) || input.activities.length > MAX_ATTEMPTS)) {
    errors.push('Activity records are invalid or too numerous.');
  } else for (const [i, a] of (input.activities ?? []).entries()) {
    const checks = isObj(a) ? a.checks ?? [] : [];
    const ok = isObj(a) && isStr(a.id, 80) && isDateString(a.date) && isStr(a.sessionId, 80)
      && lessonId(a.lessonId) && ['build', 'sentence', 'sound-count', 'sound-map', 'sound-ending', 'sound-routine'].includes(a.kind) && WORD_RE.test(a.word)
      && isStr(a.prompt, 500) && isStr(a.typed, 500) && isBool(a.correct) && isBool(a.modelUsed)
      && ['first', 'retry', 'skipped'].includes(a.attemptType) && Array.isArray(checks) && checks.length <= 10
      && checks.every((c) => isObj(c) && WORD_RE.test(c.word) && isBool(c.correct));
    if (!ok) { errors.push(`Activity ${i + 1} is invalid.`); continue; }
    data.activities.push({ id: a.id, date: a.date, sessionId: a.sessionId, lessonId: a.lessonId,
      kind: a.kind, word: a.word, prompt: a.prompt, typed: a.typed, correct: a.correct,
      modelUsed: a.modelUsed, attemptType: a.attemptType,
      checks: checks.map((c) => ({ word: c.word, correct: c.correct, originLessonId: lessonId(c.originLessonId) })),
    });
  }

  for (const [word, r] of Object.entries(input.words)) {
    const ok = WORD_RE.test(word) && isObj(r) && Number.isInteger(r.intervalIndex)
      && r.intervalIndex >= -1 && r.intervalIndex < INTERVAL_DAYS.length && isDateString(r.dueDate)
      && OUTCOMES.includes(r.lastOutcome) && isDateString(r.lastPracticed) && isBool(r.needsInstruction)
      && Number.isInteger(r.difficultyCount) && r.difficultyCount >= 0;
    if (!ok) { errors.push(`Word record "${String(word).slice(0, 40)}" is invalid.`); continue; }
    data.words[word] = {
      intervalIndex: r.intervalIndex, dueDate: r.dueDate, lastOutcome: r.lastOutcome,
      lastPracticed: r.lastPracticed, needsInstruction: r.needsInstruction, difficultyCount: r.difficultyCount,
    };
  }

  input.points.ledger.forEach((e, i) => {
    const ok = isObj(e) && isStr(e.key, 120) && isStr(e.sessionId, 80) && WORD_RE.test(e.word)
      && isStr(e.kind, 40) && Number.isFinite(e.points) && e.points >= 0 && e.points <= 1000 && isDateString(e.date);
    if (!ok) return errors.push(`Points entry ${i + 1} is invalid.`);
    data.points.ledger.push({ key: e.key, sessionId: e.sessionId, word: e.word, kind: e.kind, points: e.points, date: e.date });
  });

  return { ok: errors.length === 0, errors: errors.slice(0, 5), data: errors.length ? null : data };
}

export function loadProgress(backend) {
  const raw = backend.getItem(PROGRESS_KEY);
  if (raw == null) return { progress: emptyProgress(), status: 'empty' };
  try {
    const v = validateProgress(JSON.parse(raw));
    if (v.ok) return { progress: v.data, status: 'loaded' };
  } catch { /* fall through */ }
  // Keep the unreadable text rather than overwriting it silently.
  try { backend.setItem(CORRUPT_KEY, raw); } catch { /* ignore */ }
  return { progress: emptyProgress(), status: 'unreadable' };
}

export function saveProgress(backend, progress) {
  progress.updatedAt = new Date().toISOString();
  try {
    backend.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export const exportProgress = (progress) => JSON.stringify(progress, null, 2);

export function parseImport(text) {
  try {
    return validateProgress(JSON.parse(text));
  } catch {
    return { ok: false, errors: ['File is not valid JSON.'], data: null };
  }
}

export function summarize(progress) {
  return {
    sessions: progress.sessions.length,
    attempts: progress.attempts.length,
    activities: (progress.activities ?? []).length,
    words: Object.keys(progress.words).length,
    points: totalPoints(progress.points.ledger),
  };
}

// Replaces progress after the UI has confirmed. The previous data is kept once as a backup.
export function applyImport(backend, currentProgress, imported) {
  try { backend.setItem(BACKUP_KEY, JSON.stringify(currentProgress)); } catch { return false; }
  return saveProgress(backend, imported);
}

export function resetProgress(backend) {
  backend.removeItem(PROGRESS_KEY);
  return emptyProgress();
}

const clamp = (v, lo, hi, fb) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fb);

export function normalizeSettings(s) {
  const d = DEFAULT_SETTINGS;
  const x = isObj(s) ? s : {};
  return {
    narration: typeof x.narration === 'boolean' ? x.narration : d.narration,
    speechVolume: clamp(x.speechVolume, 0, 1, d.speechVolume),
    speechRate: clamp(x.speechRate, 0.5, 1.2, d.speechRate),
    effectsVolume: clamp(x.effectsVolume, 0, 1, d.effectsVolume),
    muted: typeof x.muted === 'boolean' ? x.muted : d.muted,
    motion: ['system', 'reduced', 'full'].includes(x.motion) ? x.motion : d.motion,
    celebrations: typeof x.celebrations === 'boolean' ? x.celebrations : d.celebrations,
    sessionLength: [5, 8, 10, 15].includes(x.sessionLength) ? x.sessionLength : d.sessionLength,
  };
}

export function loadSettings(backend) {
  try { return normalizeSettings(JSON.parse(backend.getItem(SETTINGS_KEY))); } catch { return normalizeSettings(null); }
}

export function saveSettings(backend, settings) {
  try { backend.setItem(SETTINGS_KEY, JSON.stringify(settings)); return true; } catch { return false; }
}

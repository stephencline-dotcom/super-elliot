// EXTENSION POINT (not implemented): skill-level inference.
// The app tracks word-level evidence only. A future version could group evidence by skill
// (for example doubling, consonant + y, silent e) once there are enough varied attempts.
// Never infer a weakness from a single answer; require repeated evidence across sessions.
export function inferSkills(/* progress */) {
  return [];
}

export const SKILLS_STATUS = 'Skill-level analysis is a placeholder. Only word-level evidence is recorded for now.';

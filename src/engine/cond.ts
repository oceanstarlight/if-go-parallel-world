import type { Cond, LifeState, StatKey } from '../types';

export function matches(c: Cond | undefined, s: LifeState): boolean {
  if (!c) return true;
  if (c.minAge !== undefined && s.age < c.minAge) return false;
  if (c.maxAge !== undefined && s.age > c.maxAge) return false;
  if (c.houses && !c.houses.includes(s.houseId)) return false;
  if (c.notHouses && c.notHouses.includes(s.houseId)) return false;
  if (c.cheats && !c.cheats.includes(s.cheatId)) return false;
  if (c.jobs && !c.jobs.includes(s.jobId)) return false;
  if (c.notJobs && c.notJobs.includes(s.jobId)) return false;
  if (c.flags && !c.flags.every((f) => s.flags.includes(f))) return false;
  if (c.notFlags && c.notFlags.some((f) => s.flags.includes(f))) return false;
  if (c.stats) {
    for (const [k, v] of Object.entries(c.stats)) if (s.stats[k as StatKey] < v) return false;
  }
  if (c.maxStats) {
    for (const [k, v] of Object.entries(c.maxStats)) if (s.stats[k as StatKey] > v) return false;
  }
  if (c.karmaMin !== undefined && s.karma < c.karmaMin) return false;
  if (c.karmaMax !== undefined && s.karma > c.karmaMax) return false;
  if (c.hasRel && !c.hasRel.every((r) => s.rels[r])) return false;
  if (c.notRel && c.notRel.some((r) => s.rels[r])) return false;
  if (c.relMin) {
    for (const [k, v] of Object.entries(c.relMin)) {
      const rel = s.rels[k as keyof typeof s.rels];
      if (!rel || rel.affection < v) return false;
    }
  }
  if (c.relMax) {
    for (const [k, v] of Object.entries(c.relMax)) {
      const rel = s.rels[k as keyof typeof s.rels];
      if (!rel || rel.affection > v) return false;
    }
  }
  if (c.minJobRank !== undefined && s.jobRank < c.minJobRank) return false;
  if (c.maxJobRank !== undefined && s.jobRank > c.maxJobRank) return false;
  if (c.traits && !c.traits.every((t) => (s.traits ?? []).includes(t))) return false;
  if (c.notTraits && c.notTraits.some((t) => (s.traits ?? []).includes(t))) return false;
  if (c.goldMin !== undefined && (s.gold ?? 0) < c.goldMin) return false;
  if (c.goldMax !== undefined && (s.gold ?? 0) > c.goldMax) return false;
  if (c.owns && !c.owns.every((o) => (s.owned ?? []).includes(o))) return false;
  if (c.test && !c.test(s)) return false;
  return true;
}

import { getDb } from './db';

export interface ReputationBreakdown {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgSkillRating: number | null;
  volumeBonus: number;
  reputation: number;
}

/**
 * Recalculate an agent's reputation score from real execution data.
 *
 * Formula: reputation = success_rate * effective_rating * log2(total + 1)
 *
 * - success_rate: fraction of successful executions across all owned skills
 * - effective_rating: average of owned skills' avg_rating (default 3.0 if unrated)
 * - volume bonus: log2(total_executions + 1) rewards experience without unbounded growth
 */
export async function recalculateReputation(ownerId: string): Promise<number> {
  const db = getDb();

  const { data: skills } = await db.from('skills')
    .select('id, avg_rating')
    .eq('owner_id', ownerId);

  if (!skills?.length) {
    await db.from('agents').update({ reputation: 0 }).eq('id', ownerId);
    return 0;
  }

  const skillIds = skills.map((s: any) => s.id);

  const [{ count: total }, { count: successful }] = await Promise.all([
    db.from('executions')
      .select('*', { count: 'exact', head: true })
      .in('skill_id', skillIds),
    db.from('executions')
      .select('*', { count: 'exact', head: true })
      .in('skill_id', skillIds)
      .eq('status', 'success'),
  ]);

  const t = total || 0;
  const s = successful || 0;
  const successRate = t > 0 ? s / t : 0;

  const ratedSkills = skills.filter((sk: any) => sk.avg_rating > 0);
  const avgRating = ratedSkills.length > 0
    ? ratedSkills.reduce((sum: number, sk: any) => sum + sk.avg_rating, 0) / ratedSkills.length
    : 3.0;

  const volumeBonus = Math.log2(t + 1);
  const reputation = Math.round(successRate * avgRating * volumeBonus * 100) / 100;

  await db.from('agents').update({ reputation }).eq('id', ownerId);
  return reputation;
}

/**
 * Get detailed reputation breakdown for an agent profile.
 */
export async function getReputationBreakdown(ownerId: string): Promise<ReputationBreakdown> {
  const db = getDb();

  const { data: skills } = await db.from('skills')
    .select('id, avg_rating')
    .eq('owner_id', ownerId);

  const skillIds = skills?.map((s: any) => s.id) || [];

  let total = 0, successful = 0, failed = 0;

  if (skillIds.length > 0) {
    const [totalRes, successRes, failRes] = await Promise.all([
      db.from('executions')
        .select('*', { count: 'exact', head: true })
        .in('skill_id', skillIds),
      db.from('executions')
        .select('*', { count: 'exact', head: true })
        .in('skill_id', skillIds)
        .eq('status', 'success'),
      db.from('executions')
        .select('*', { count: 'exact', head: true })
        .in('skill_id', skillIds)
        .in('status', ['failed', 'timeout']),
    ]);
    total = totalRes.count || 0;
    successful = successRes.count || 0;
    failed = failRes.count || 0;
  }

  const successRate = total > 0
    ? Math.round((successful / total) * 10000) / 10000
    : 0;

  const ratedSkills = (skills || []).filter((sk: any) => sk.avg_rating > 0);
  const avgSkillRating = ratedSkills.length > 0
    ? Math.round(
        ratedSkills.reduce((sum: number, sk: any) => sum + sk.avg_rating, 0) / ratedSkills.length * 100
      ) / 100
    : null;

  const effectiveRating = avgSkillRating || 3.0;
  const volumeBonus = Math.round(Math.log2(total + 1) * 100) / 100;
  const reputation = Math.round(successRate * effectiveRating * volumeBonus * 100) / 100;

  return {
    totalExecutions: total,
    successfulExecutions: successful,
    failedExecutions: failed,
    successRate,
    avgSkillRating,
    volumeBonus,
    reputation,
  };
}

import { FastifyInstance } from 'fastify';
import { getDb } from '../db';
import { recalculateReputation } from '../reputation';

export async function skillRoutes(app: FastifyInstance) {
  app.post('/skills', async (request, reply) => {
    const {
      name, description, version,
      inputSchema, outputSchema, code, price,
      timeoutMs, maxMemoryMb,
    } = request.body as any;

    const ownerId = request.authAgent!.id;

    if (!name || !code) {
      return reply.status(400).send({ error: 'name and code are required' });
    }

    // Input length validation
    if (typeof name !== 'string' || name.length > 200) {
      return reply.status(400).send({ error: 'name must be a string of at most 200 characters' });
    }
    if (description && (typeof description !== 'string' || description.length > 2000)) {
      return reply.status(400).send({ error: 'description must be at most 2000 characters' });
    }
    if (typeof code !== 'string' || code.length > 50000) {
      return reply.status(400).send({ error: 'code must be at most 50000 characters' });
    }

    // Clamp sandbox limits
    const clampedTimeoutMs = Math.min(Math.max(Number(timeoutMs) || 5000, 100), 30000);
    const clampedMaxMemoryMb = Math.min(Math.max(Number(maxMemoryMb) || 64, 1), 256);

    const db = getDb();

    const { data, error } = await db.from('skills').insert({
      name,
      description: description || '',
      owner_id: ownerId,
      version: version || '1.0.0',
      input_schema: inputSchema || {},
      output_schema: outputSchema || {},
      code,
      price: price || 0,
      timeout_ms: clampedTimeoutMs,
      max_memory_mb: clampedMaxMemoryMb,
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(formatSkill(data));
  });

  app.get('/skills', async (request) => {
    const db = getDb();
    const { limit = '20', offset = '0', search } = request.query as any;

    // Clamp limit/offset
    const clampedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const clampedOffset = Math.max(Number(offset) || 0, 0);

    let query = db.from('skills').select('*').order('execution_count', { ascending: false })
      .range(clampedOffset, clampedOffset + clampedLimit - 1);

    if (search) {
      // Strip characters that could manipulate PostgREST filter syntax
      const sanitized = String(search).replace(/[,.():]/g, '');
      if (sanitized.length > 0) {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { data } = await query;
    return { skills: (data || []).map(formatSkill), count: (data || []).length };
  });

  app.get('/skills/:skillId', async (request, reply) => {
    const { skillId } = request.params as any;
    const db = getDb();

    const { data, error } = await db.from('skills').select('*').eq('id', skillId).single();
    if (error || !data) return reply.status(404).send({ error: 'Skill not found' });
    return formatSkill(data);
  });

  // Rate a skill (1-5) — caller must have executed it successfully
  app.post('/skills/:skillId/rate', async (request, reply) => {
    const { skillId } = request.params as any;
    const { rating } = request.body as any;
    const callerId = request.authAgent!.id;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return reply.status(400).send({ error: 'rating must be an integer between 1 and 5' });
    }

    const db = getDb();

    const { data: skill } = await db.from('skills').select('*').eq('id', skillId).single();
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    // Verify caller has executed this skill successfully
    const { count } = await db.from('executions')
      .select('*', { count: 'exact', head: true })
      .eq('skill_id', skillId)
      .eq('caller_id', callerId)
      .eq('status', 'success');

    if (!count || count === 0) {
      return reply.status(403).send({ error: 'You must successfully execute this skill before rating it' });
    }

    // Update avg_rating using exponential moving average (alpha=0.3)
    const alpha = 0.3;
    const newAvg = skill.avg_rating === 0
      ? rating
      : Math.round(((1 - alpha) * skill.avg_rating + alpha * rating) * 100) / 100;

    await db.from('skills').update({ avg_rating: newAvg }).eq('id', skillId);

    // Recalculate owner's reputation
    const newReputation = await recalculateReputation(skill.owner_id);

    return {
      skillId,
      rating,
      newAvgRating: newAvg,
      ownerReputation: newReputation,
    };
  });
}

function formatSkill(s: any) {
  return {
    id: s.id, name: s.name, description: s.description,
    ownerId: s.owner_id, version: s.version,
    inputSchema: s.input_schema, outputSchema: s.output_schema,
    code: s.code, price: s.price,
    executionCount: s.execution_count, avgRating: s.avg_rating,
    timeoutMs: s.timeout_ms, maxMemoryMb: s.max_memory_mb,
    createdAt: s.created_at, updatedAt: s.updated_at,
  };
}

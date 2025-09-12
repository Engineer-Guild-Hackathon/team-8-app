// app/api/graph/route.ts
import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const resourceKinds = new Set([
  'book',
  'article',
  'video',
  'course',
  'repo',
  'doc',
  'other',
] as const);
const asResourceType = (v: unknown) =>
  typeof v === 'string' && resourceKinds.has(v as any) ? (v as any) : 'other';
const toNum = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const isUUID = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const keyRaw = (sp.get('topicId') ?? sp.get('slug') ?? '').trim();
  if (!keyRaw)
    return NextResponse.json(
      { nodes: [], edges: [], items: [] },
      { status: 200 }
    );

  const supabase = await createClient();

  // 1) slug -> topic.id 解決（なければ null）
  let topicId: string | null = null;
  if (isUUID(keyRaw)) {
    topicId = keyRaw;
  } else {
    const { data: t, error: terr } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', keyRaw)
      .maybeSingle();
    if (terr)
      return NextResponse.json({ error: terr.message }, { status: 500 });
    topicId = t?.id ?? null;
  }

  let nodes: any[] = [];
  let edges: any[] = [];
  let via: 'edges' | 'url-fallback' | 'none' = 'none';

  // 2) topic エッジから辿る（最優先）
  let ids: string[] = [];
  if (topicId) {
    const { data: rel, error: relErr } = await supabase
      .from('edges')
      .select('to_id')
      .eq('from_type', 'topic')
      .eq('from_id', topicId)
      .eq('to_type', 'resource')
      .eq('is_active', true);

    if (relErr)
      return NextResponse.json({ error: relErr.message }, { status: 500 });
    ids = (rel ?? []).map((r: any) => String(r.to_id));
  }

  if (ids.length > 0) {
    via = 'edges';
    const { data: res, error: resErr } = await supabase
      .from('resources')
      .select(
        'id,title,type,difficulty,duration_min,cost_amount,cost_currency,url'
      )
      .in('id', ids);
    if (resErr)
      return NextResponse.json({ error: resErr.message }, { status: 500 });

    nodes = (res ?? []).map((n: any) => ({
      id: String(n.id),
      type: 'resource' as const,
      title: String(n.title ?? ''),
      resourceType: asResourceType(n.type),
      difficulty: toNum(n.difficulty),
      durationMin: toNum(n.duration_min),
      costAmount: toNum(n.cost_amount),
      costCurrency: n.cost_currency ?? undefined,
      url: n.url ?? undefined,
    }));

    const { data: eData, error: eErr } = await supabase
      .from('edges')
      .select('from_id,to_id,weight')
      .eq('from_type', 'resource')
      .eq('to_type', 'resource')
      .in('from_id', ids)
      .in('to_id', ids)
      .eq('is_active', true);

    if (eErr)
      return NextResponse.json({ error: eErr.message }, { status: 500 });

    edges = (eData ?? []).map((e: any) => ({
      source: String(e.from_id),
      target: String(e.to_id),
      weight: Number(e.weight) || 1,
    }));
  } else {
    // 3) フォールバック: URL パターンから拾う（/ai-ml/ や /basic-math/ を含む）
    const { data: res, error: resErr } = await supabase
      .from('resources')
      .select(
        'id,title,type,difficulty,duration_min,cost_amount,cost_currency,url'
      )
      .ilike('url', `%/${keyRaw}/%`);

    if (resErr)
      return NextResponse.json({ error: resErr.message }, { status: 500 });

    if ((res?.length ?? 0) > 0) {
      via = 'url-fallback';
      nodes = (res ?? []).map((n: any) => ({
        id: String(n.id),
        type: 'resource' as const,
        title: String(n.title ?? ''),
        resourceType: asResourceType(n.type),
        difficulty: toNum(n.difficulty),
        durationMin: toNum(n.duration_min),
        costAmount: toNum(n.cost_amount),
        costCurrency: n.cost_currency ?? undefined,
        url: n.url ?? undefined,
      }));

      // 簡易エッジ（タイトル昇順に直列）
      const sorted = [...nodes].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '')
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        edges.push({
          source: sorted[i].id,
          target: sorted[i + 1].id,
          weight: 1,
        });
      }
    }
  }

  return NextResponse.json(
    {
      nodes,
      edges,
      items: nodes, // MaterialList は nodes/items どちらでも拾える
      diag: {
        slugOrId: keyRaw,
        topicId: topicId ?? '',
        via,
        resourceIds: nodes.length,
        edges: edges.length,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

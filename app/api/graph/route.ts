import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// グラフのノード(教材など)
type GraphNode = {
  id: string;
  type: 'resource'; // 今回は教材(resource)のみ対象
  title: string;
  description?: string;
  resourceType?:
    | 'book'
    | 'article'
    | 'video'
    | 'course'
    | 'repo'
    | 'doc'
    | 'other';
  difficulty?: number; // 難易度(1=入門, 2=基礎)
  durationMin?: number; // 学習にかかる時間(分)
  costAmount?: number; // 金額
  costCurrency?: string; // 通貨(円/ドルなど)
  url?: string; // 教材リンク
};

// グラフのエッジ(学習順序)
type GraphEdge = {
  source: string; // 先行する教材ID
  target: string; // 後続の教材ID
  weight: number; // 推奨度(強さ)
};

// APIで返すペイロード
type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

// 許可される教材タイプ
const resourceKinds = new Set([
  'book',
  'article',
  'video',
  'course',
  'repo',
  'doc',
  'other',
] as const);

// 型安全にresourceTypeを変換する
function asResourceType(v: unknown): GraphNode['resourceType'] {
  return typeof v === 'string' && resourceKinds.has(v as any)
    ? (v as GraphNode['resourceType'])
    : 'other';
}

// 数値化できない値は0に寄せる
function toNumberOrZero(v: unknown): number {
  const num = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(num) ? num : 0;
}

// モック動作用のフラグ(trueならDBから取得, falseならサンプル固定値を返す)
const USE_DB = true;

// APIエンドポイント本体
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get('topicId');

  // topicIdが指定されていない場合は400エラー
  if (!topicId) {
    return NextResponse.json({ error: 'Missing topicId' }, { status: 400 });
  }

  // モックデータを返す場合
  if (!USE_DB) {
    const mock: GraphPayload = {
      nodes: [
        { id: 'r1', type: 'resource', title: 'HTML入門' },
        { id: 'r2', type: 'resource', title: 'CSS入門' },
        { id: 'r3', type: 'resource', title: 'JavaScript入門' },
      ],
      edges: [
        { source: 'r1', target: 'r2', weight: 3 },
        { source: 'r2', target: 'r3', weight: 5 },
      ],
    };
    return NextResponse.json(mock, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // DBからデータを取得
  const supabase = await createClient();

  const nodesQ = supabase
    .from('resources')
    .select(
      `
      id,
      title,
      type,
      difficulty,
      duration_min,
      cost_amount,
      cost_currency,
      url
    `
    )
    .eq('topic_id', topicId);

  const edgesQ = supabase
    .from('edges')
    .select(`from_resource_id, to_resource_id, weight`)
    .eq('topic_id', topicId);

  const [nodesRes, edgesRes] = await Promise.all([nodesQ, edgesQ]);

  if (nodesRes.error || edgesRes.error) {
    console.error('[/api/graph] query error', {
      nodesErr: nodesRes.error?.message,
      edgesErr: edgesRes.error?.message,
      topicId,
    });
  }
  if (nodesRes.error) {
    return NextResponse.json(
      { error: nodesRes.error.message },
      { status: 500 }
    );
  }
  if (edgesRes.error) {
    return NextResponse.json(
      { error: edgesRes.error.message },
      { status: 500 }
    );
  }

  const nodes = (nodesRes.data ?? []).map((n: any) => ({
    id: String(n.id),
    type: 'resource' as const,
    title: n.title as string,
    resourceType: asResourceType(n.type),
    difficulty: n.difficulty ?? undefined,
    durationMin: n.duration_min ?? undefined,
    costAmount: n.cost_amount ?? undefined,
    costCurrency: n.cost_currency ?? undefined,
    url: n.url ?? undefined,
  }));

  const edges = (edgesRes.data ?? []).map((e: any) => ({
    source: String(e.from_resource_id),
    target: String(e.to_resource_id),
    weight: toNumberOrZero(e.weight),
  }));

  return NextResponse.json(
    { nodes, edges },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

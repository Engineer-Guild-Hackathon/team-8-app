import { NextResponse } from 'next/server';

import {
  type GraphData,
  type GraphNode,
  type LearningConstraints,
  optimizeLearningPath,
} from '@/lib/graph-utils';
import { createClient } from '@/utils/supabase/server';

// タイプ
interface PlanRequest {
  topicId: string;
  maxDurationHours?: number;
  maxCostAmount?: number;
  maxDifficulty?: number;
  requiredNodes?: string[];
  excludedNodes?: string[];
}

interface PlanResponse {
  success: boolean;
  data?: {
    path: {
      nodes: GraphNode[];
      totalDuration: number; // 分
      totalCost: number; // 円
      averageDifficulty: number;
      isValid: boolean;
      violatedConstraints: string[];
    };
    summary: {
      totalHours: number;
      totalCostFormatted: string;
      nodeCount: number;
      difficultyLevel: string;
    };
    topicId: string;
  };
  error?: string;
  message?: string;
}

// 難易度ラベル
function getDifficultyLabel(avgDifficulty: number): string {
  if (avgDifficulty <= 1.5) return '入門レベル';
  if (avgDifficulty <= 2.5) return '初級レベル';
  if (avgDifficulty <= 3.5) return '中級レベル';
  if (avgDifficulty <= 4.5) return '上級レベル';
  return '専門レベル';
}

// グラフデータ取得（Supabase → 失敗時はサンプル）
async function fetchGraphData(topicId: string): Promise<GraphData> {
  console.log(`Starting fetchGraphData for topicId: ${topicId}`);
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  try {
    const supabase = await createClient();
    console.log('Supabase client created');

    // トピックIDでスラッグを取得
    console.log(`Querying topics table for slug: ${topicId}`);
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', topicId)
      .single();
    
    console.log('Topic query result:', { topic, topicError });
    
    if (topicError) {
      console.error('Topic not found:', topicError);
      return getSampleGraphData(topicId);
    }

    // トピックに関連するエッジを取得
    console.log(`Querying edges table for topic.id: ${topic.id}`);
    const { data: topicEdges, error: edgesError } = await supabase
      .from('edges')
      .select('to_id')
      .eq('from_type', 'topic')
      .eq('from_id', topic.id)
      .eq('to_type', 'resource')
      .eq('is_active', true);
    
    console.log('Topic edges query result:', { topicEdges, edgesError });
    
    if (edgesError) throw edgesError;
    if (!topicEdges || topicEdges.length === 0) {
      console.log('No edges found for topic');
      return getSampleGraphData(topicId);
    }

    // リソースIDを抽出
    const resourceIds = topicEdges.map(edge => edge.to_id);
    console.log(`Found ${resourceIds.length} resource IDs:`, resourceIds);

    // リソース詳細を取得
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('id, title, type, difficulty, duration_min, cost_amount, description')
      .in('id', resourceIds);
    
    console.log('Resources query result:', { resources, resourcesError });
    
    if (resourcesError) throw resourcesError;

    // リソース間の依存関係を取得
    const { data: dependencies, error: dependenciesError } = await supabase
      .from('edges')
      .select('from_id, to_id, weight')
      .eq('from_type', 'resource')
      .eq('to_type', 'resource')
      .eq('is_active', true)
      .in('from_id', resourceIds)
      .in('to_id', resourceIds);
    
    if (dependenciesError) throw dependenciesError;

    // GraphNodeの形式に変換
    const nodes: GraphNode[] = resources.map((r: any) => ({
      id: String(r.id),
      title: String(r.title || ''),
      difficulty: r.difficulty || 1,
      durationMin: r.duration_min || 60,
      costAmount: r.cost_amount || 0,
      resourceType: r.type || 'other',
    }));

    // Edgeの形式に変換
    const graphEdges = (dependencies || []).map((e: any) => ({
      source: String(e.from_id),
      target: String(e.to_id),
      weight: e.weight || 1,
    }));

    console.log(`Fetched ${nodes.length} resources and ${graphEdges.length} dependencies for topic: ${topicId}`);
    
    if (nodes.length === 0) {
      console.log('No resources found, using sample data');
      return getSampleGraphData(topicId);
    }

    return { nodes, edges: graphEdges };
  } catch (error) {
    console.error('Error fetching graph data:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return getSampleGraphData(topicId);
  }
}

// サンプル（フォールバック）
function getSampleGraphData(topicId: string): GraphData {
  const sampleData: { [key: string]: GraphData } = {
    'web-dev': {
      nodes: [
        {
          id: '1',
          title: 'HTML基礎',
          difficulty: 1,
          durationMin: 180,
          costAmount: 0,
          resourceType: 'tutorial',
        },
        {
          id: '2',
          title: 'CSS基礎',
          difficulty: 2,
          durationMin: 240,
          costAmount: 0,
          resourceType: 'tutorial',
        },
        {
          id: '3',
          title: 'JavaScript基礎',
          difficulty: 2,
          durationMin: 360,
          costAmount: 0,
          resourceType: 'course',
        },
        {
          id: '4',
          title: 'React入門',
          difficulty: 3,
          durationMin: 480,
          costAmount: 2000,
          resourceType: 'course',
        },
        {
          id: '5',
          title: 'Node.js基礎',
          difficulty: 3,
          durationMin: 360,
          costAmount: 1500,
          resourceType: 'course',
        },
        {
          id: '6',
          title: 'フルスタック開発',
          difficulty: 4,
          durationMin: 720,
          costAmount: 5000,
          resourceType: 'project',
        },
      ],
      edges: [
        { source: '1', target: '2', weight: 1 },
        { source: '1', target: '3', weight: 1 },
        { source: '2', target: '4', weight: 1 },
        { source: '3', target: '4', weight: 1 },
        { source: '3', target: '5', weight: 1 },
        { source: '4', target: '6', weight: 1 },
        { source: '5', target: '6', weight: 1 },
      ],
    },
    'ai-ml': {
      nodes: [
        {
          id: '101',
          title: 'Python基礎',
          difficulty: 1,
          durationMin: 300,
          costAmount: 0,
          resourceType: 'tutorial',
        },
        {
          id: '102',
          title: '数学基礎',
          difficulty: 2,
          durationMin: 480,
          costAmount: 0,
          resourceType: 'course',
        },
        {
          id: '103',
          title: 'NumPy/Pandas',
          difficulty: 2,
          durationMin: 360,
          costAmount: 1000,
          resourceType: 'course',
        },
        {
          id: '104',
          title: '機械学習入門',
          difficulty: 3,
          durationMin: 600,
          costAmount: 3000,
          resourceType: 'course',
        },
        {
          id: '105',
          title: 'ディープラーニング',
          difficulty: 4,
          durationMin: 720,
          costAmount: 5000,
          resourceType: 'course',
        },
        {
          id: '106',
          title: 'AIプロジェクト',
          difficulty: 5,
          durationMin: 900,
          costAmount: 8000,
          resourceType: 'project',
        },
      ],
      edges: [
        { source: '101', target: '103', weight: 1 },
        { source: '102', target: '104', weight: 1 },
        { source: '103', target: '104', weight: 1 },
        { source: '104', target: '105', weight: 1 },
        { source: '105', target: '106', weight: 1 },
      ],
    },
    'basic-math': {
      nodes: [
        {
          id: '201',
          title: '基礎計算',
          difficulty: 1,
          durationMin: 240,
          costAmount: 0,
          resourceType: 'tutorial',
        },
        {
          id: '202',
          title: '線形代数',
          difficulty: 3,
          durationMin: 480,
          costAmount: 2000,
          resourceType: 'course',
        },
        {
          id: '203',
          title: '微積分',
          difficulty: 3,
          durationMin: 600,
          costAmount: 2500,
          resourceType: 'course',
        },
        {
          id: '204',
          title: '統計学',
          difficulty: 2,
          durationMin: 360,
          costAmount: 1500,
          resourceType: 'course',
        },
        {
          id: '205',
          title: '離散数学',
          difficulty: 4,
          durationMin: 540,
          costAmount: 3000,
          resourceType: 'course',
        },
      ],
      edges: [
        { source: '201', target: '202', weight: 1 },
        { source: '201', target: '203', weight: 1 },
        { source: '201', target: '204', weight: 1 },
        { source: '202', target: '205', weight: 1 },
      ],
    },
  };

  return sampleData[topicId] || sampleData['web-dev'];
}

// POST: 制約を受け取り最適化
export async function POST(request: Request) {
  try {
    const body: PlanRequest = await request.json();
    const {
      topicId,
      maxDurationHours,
      maxCostAmount,
      maxDifficulty,
      requiredNodes,
      excludedNodes,
    } = body;

    if (!topicId || typeof topicId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid topicId',
          message: 'topicId is required and must be a string',
        } as PlanResponse,
        { status: 400 }
      );
    }

    const graphData = await fetchGraphData(topicId);
    if (graphData.nodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No resources found',
          message: `No learning resources found for topic: ${topicId}`,
        } as PlanResponse,
        { status: 404 }
      );
    }

    const constraints: LearningConstraints = {
      maxDurationHours,
      maxCostAmount,
      maxDifficulty,
      requiredNodes,
      excludedNodes,
    };

    const learningPath = optimizeLearningPath(graphData, constraints);

    const totalHours = learningPath.totalDuration / 60;
    const totalCostFormatted = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(learningPath.totalCost);

    const response: PlanResponse = {
      success: true,
      data: {
        path: learningPath,
        summary: {
          totalHours: Math.round(totalHours * 10) / 10,
          totalCostFormatted,
          nodeCount: learningPath.nodes.length,
          difficultyLevel: getDifficultyLabel(learningPath.averageDifficulty),
        },
        topicId,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate learning plan',
      } as PlanResponse,
      { status: 500 }
    );
  }
}

// GET: 簡易確認用
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId') || 'web-dev';

    const sampleConstraints: LearningConstraints = {
      maxDurationHours: 10,
      maxCostAmount: 5000,
      maxDifficulty: 3,
    };

    const graphData = await fetchGraphData(topicId);
    const learningPath = optimizeLearningPath(graphData, sampleConstraints);

    return NextResponse.json({
      message: 'Sample learning plan generated',
      topicId,
      constraints: sampleConstraints,
      result: {
        nodeCount: learningPath.nodes.length,
        totalHours: Math.round((learningPath.totalDuration / 60) * 10) / 10,
        totalCost: learningPath.totalCost,
        isValid: learningPath.isValid,
        violations: learningPath.violatedConstraints,
        nodes: learningPath.nodes.map((n) => ({ id: n.id, title: n.title })),
      },
    });
  } catch (error) {
    console.error('GET /api/plan error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sample plan' },
      { status: 500 }
    );
  }
}

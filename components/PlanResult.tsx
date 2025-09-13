'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlanNode {
  id: string;
  title: string;
  difficulty?: number;
  durationMin?: number;
  costAmount?: number;
  resourceType?: string;
}

interface PlanData {
  path: {
    nodes: PlanNode[];
    totalDuration: number;
    totalCost: number;
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
}

interface PlanResultProps {
  data: PlanData;
  onSave?: () => void;
  loading?: boolean;
}

// 難易度表示用のドット
const DifficultyDots = ({ difficulty }: { difficulty?: number }) => {
  if (!difficulty) return <span className="text-muted-foreground">-</span>;
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs">{difficulty}/5</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < difficulty ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// 教材種類アイコン
const getResourceIcon = (type?: string) => {
  switch (type) {
    case 'tutorial': return '📖';
    case 'course': return '🎓';
    case 'project': return '🔨';
    case 'video': return '🎥';
    case 'article': return '📄';
    default: return '📚';
  }
};

// 時間フォーマット
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
};

export const PlanResult = ({ data, onSave, loading = false }: PlanResultProps) => {
  const { path, summary } = data;

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✨ 生成された学習プラン
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.nodeCount}
              </div>
              <div className="text-xs text-muted-foreground">教材数</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.totalHours}h
              </div>
              <div className="text-xs text-muted-foreground">総学習時間</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {summary.totalCostFormatted}
              </div>
              <div className="text-xs text-muted-foreground">総費用</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {summary.difficultyLevel}
              </div>
              <div className="text-xs text-muted-foreground">平均難易度</div>
            </div>
          </div>

          {/* 制約違反の表示 */}
          {!path.isValid && path.violatedConstraints.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                ⚠️ 制約違反が検出されました
              </div>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                {path.violatedConstraints.map((violation, index) => (
                  <li key={index}>• {violation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 保存ボタン */}
          {onSave && (
            <div className="mt-4 text-center">
              <Button onClick={onSave} disabled={loading} className="px-8">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    保存中...
                  </div>
                ) : (
                  '💾 プランを保存'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 教材リスト */}
      <Card>
        <CardHeader>
          <CardTitle>📚 推奨学習順序</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {path.nodes.map((node, index) => (
              <div
                key={node.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                {/* 順序番号 */}
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* 教材情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getResourceIcon(node.resourceType)}</span>
                    <h3 className="font-medium truncate">{node.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>⏱️</span>
                      <span>{formatDuration(node.durationMin || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span>
                        {node.costAmount === 0 
                          ? '無料' 
                          : node.costAmount 
                            ? `¥${node.costAmount.toLocaleString()}`
                            : '-'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📊</span>
                      <DifficultyDots difficulty={node.difficulty} />
                    </div>
                  </div>
                </div>

                {/* 矢印（最後以外） */}
                {index < path.nodes.length - 1 && (
                  <div className="flex-shrink-0 text-muted-foreground">
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 学習のコツ */}
      <Card>
        <CardHeader>
          <CardTitle>💡 学習のポイント</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span>🎯</span>
            <div>
              <strong>順序を守る:</strong> 
              上記の順序は依存関係を考慮した最適な学習パスです。前の教材を理解してから次に進むことをお勧めします。
            </div>
          </div>
          <div className="flex gap-2">
            <span>⏰</span>
            <div>
              <strong>継続的な学習:</strong>
              総学習時間 {summary.totalHours}時間を週に{Math.ceil(summary.totalHours / 10)}時間程度のペースで進めると、
              約{Math.ceil(summary.totalHours / (summary.totalHours / 10))}週間で完了予定です。
            </div>
          </div>
          <div className="flex gap-2">
            <span>📈</span>
            <div>
              <strong>実践重視:</strong>
              プロジェクト形式の教材（🔨）では、手を動かして実際に作品を作ることで理解が深まります。
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
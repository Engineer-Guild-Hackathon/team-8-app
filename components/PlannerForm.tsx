'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface PlannerConstraints {
  topicId: string;
  maxDurationHours?: number;
  maxCostAmount?: number;
  maxDifficulty?: number;
}

interface PlannerFormProps {
  onSubmit: (constraints: PlannerConstraints) => void;
  loading?: boolean;
}

const topics = [
  { id: 'web-dev', label: 'Web開発', icon: '</>' },
  { id: 'ai-ml', label: 'AI・機械学習', icon: '⚡' },
  { id: 'basic-math', label: '基礎数学', icon: '📐' },
];

export const PlannerForm = ({ onSubmit, loading = false }: PlannerFormProps) => {
  const [constraints, setConstraints] = useState<PlannerConstraints>({
    topicId: 'web-dev',
    maxDurationHours: 20,
    maxCostAmount: 10000,
    maxDifficulty: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(constraints);
  };

  const updateConstraint = (key: keyof PlannerConstraints, value: string | number) => {
    setConstraints(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 学習プラン設定
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* トピック選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">学習分野</label>
            <div className="grid grid-cols-3 gap-3">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => updateConstraint('topicId', topic.id)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    constraints.topicId === topic.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  <div className="text-xl mb-1">{topic.icon}</div>
                  <div className="text-xs font-medium">{topic.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 制約設定 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 学習時間 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                ⏱️ 学習時間
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={constraints.maxDurationHours || ''}
                  onChange={(e) => updateConstraint('maxDurationHours', Number(e.target.value))}
                  placeholder="時間"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                  時間
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {constraints.maxDurationHours 
                  ? `約${Math.ceil(constraints.maxDurationHours / 7)}週間` 
                  : '制限なし'}
              </p>
            </div>

            {/* 予算 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                💰 予算
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100000"
                  step="1000"
                  value={constraints.maxCostAmount || ''}
                  onChange={(e) => updateConstraint('maxCostAmount', Number(e.target.value))}
                  placeholder="予算"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                  円
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {constraints.maxCostAmount 
                  ? `¥${constraints.maxCostAmount.toLocaleString()}まで`
                  : '制限なし'}
              </p>
            </div>

            {/* 難易度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                📊 最大難易度
              </label>
              <select
                value={constraints.maxDifficulty || ''}
                onChange={(e) => updateConstraint('maxDifficulty', Number(e.target.value))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">制限なし</option>
                <option value={1}>1 - 入門</option>
                <option value={2}>2 - 初級</option>
                <option value={3}>3 - 中級</option>
                <option value={4}>4 - 上級</option>
                <option value={5}>5 - 専門</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {constraints.maxDifficulty 
                  ? ['入門', '初級', '中級', '上級', '専門'][constraints.maxDifficulty - 1] + 'まで'
                  : 'すべてのレベル'}
              </p>
            </div>
          </div>

          {/* 生成ボタン */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                プランを生成中...
              </div>
            ) : (
              '🚀 学習プランを生成'
            )}
          </Button>

          {/* ヒント */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>ヒント:</strong> 制約を厳しくすると、最適化アルゴリズムがより効率的なプランを提案します。
              時間・予算に余裕がある場合は、より多くの教材が含まれます。
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
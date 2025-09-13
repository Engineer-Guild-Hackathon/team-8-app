'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlannerForm, type PlannerConstraints } from '@/components/PlannerForm';
import { PlanResult } from '@/components/PlanResult';

interface PlanData {
  path: {
    nodes: any[];
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

export default function PlannerPage() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // プラン生成
  const handleGeneratePlan = async (constraints: PlannerConstraints) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(constraints),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to generate plan');
      }

      setPlanData(result.data);
    } catch (err) {
      console.error('Plan generation failed:', err);
      setError(err instanceof Error ? err.message : '学習プランの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // プラン保存（将来実装予定）
  const handleSavePlan = async () => {
    if (!planData) return;
    
    setSaveLoading(true);
    try {
      // TODO: 将来のタスクで実装予定
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('プランの保存機能は今後実装予定です！');
    } catch (err) {
      console.error('Save failed:', err);
      setError('保存に失敗しました');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* パンくず */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          ホーム
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">プランナー</span>
      </nav>

      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          学習プランナー
        </h1>
        <p className="text-muted-foreground">
          学習分野・期間・予算を設定すると、最適化アルゴリズムが推奨順序で学習プランを自動生成します。
        </p>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-500">❌</span>
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                エラーが発生しました
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={`grid gap-8 ${planData ? 'lg:grid-cols-5' : ''}`}>
        {/* 入力フォーム */}
        <div className={planData ? 'lg:col-span-2' : ''}>
          <PlannerForm onSubmit={handleGeneratePlan} loading={loading} />
        </div>

        {/* 結果表示 */}
        {planData && (
          <div className="lg:col-span-3">
            <PlanResult 
              data={planData} 
              onSave={handleSavePlan}
              loading={saveLoading}
            />
          </div>
        )}
      </div>

      {/* 機能説明（結果がない場合のみ表示） */}
      {!planData && !loading && (
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 border rounded-lg">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">制約最適化</h3>
            <p className="text-sm text-muted-foreground">
              時間・予算・難易度の制約に基づいて、ナップサック問題のアルゴリズムで最適な教材セットを選定します。
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">依存関係解決</h3>
            <p className="text-sm text-muted-foreground">
              トポロジカルソートにより、教材間の前提条件を満たす正しい学習順序を自動決定します。
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">リアルタイム生成</h3>
            <p className="text-sm text-muted-foreground">
              制約を変更すると即座に最適化計算を実行し、新しい学習プランを提案します。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

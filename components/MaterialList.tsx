'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 教材ノードの型定義
type NodeRow = {
  id: string;
  title: string;
  resourceType?: string;
  difficulty?: number;
  durationMin?: number;
  costAmount?: number;
  url?: string;
};

export const MaterialList = ({ slug }: { slug: string }) => {
  const [rows, setRows] = useState<NodeRow[]>([]);
  const [q, setQ] = useState('');

  const sortOptions = [
    'おすすめ',
    '難易度低',
    '難易度高',
    '時間短',
    '時間長',
  ] as const;
  type SortBy = (typeof sortOptions)[number];
  const [sortBy, setSortBy] = useState<SortBy>('おすすめ');

  // データ取得
  useEffect(() => {
    let mounted = true;
    fetch(`/api/graph?slug=${encodeURIComponent(slug)}`) // ← slugに統一
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const arr = Array.isArray(data?.nodes)
          ? data.nodes
          : Array.isArray(data?.items)
            ? data.items
            : [];
        const mapped: NodeRow[] = arr.map((n: any) => ({
          id: String(n.id),
          title: String(n.title ?? ''),
          resourceType: n.resourceType ?? n.type ?? 'other',
          difficulty: n.difficulty ?? undefined,
          durationMin: n.durationMin ?? n.duration_min ?? undefined,
          costAmount: n.costAmount ?? n.cost_amount ?? undefined,
          url: n.url ?? undefined,
        }));
        setRows(mapped);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, [slug]);

  // 検索・並び替え
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = term
      ? rows.filter((r) => r.title.toLowerCase().includes(term))
      : [...rows];
    switch (sortBy) {
      case '難易度低':
        list.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
        break;
      case '難易度高':
        list.sort((a, b) => (b.difficulty ?? -1) - (a.difficulty ?? -1));
        break;
      case '時間短':
        list.sort(
          (a, b) => (a.durationMin ?? 99999) - (b.durationMin ?? 99999)
        );
        break;
      case '時間長':
        list.sort((a, b) => (b.durationMin ?? -1) - (a.durationMin ?? -1));
        break;
    }
    return list;
  }, [q, rows, sortBy]);

  return (
    <div className="space-y-4">
      {/* 検索・並び替え */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          type="text"
          placeholder="教材を検索..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:w-64"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">並び替え:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-1.5 border border-input bg-background rounded-md text-sm"
          >
            {sortOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* テーブル */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium">教材名</th>
                <th className="text-left p-4 font-medium">種類</th>
                <th className="text-left p-4 font-medium">難易度</th>
                <th className="text-left p-4 font-medium">時間</th>
                <th className="text-left p-4 font-medium">費用</th>
                <th className="text-left p-4 font-medium">リンク</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center p-8 text-muted-foreground"
                  >
                    {rows.length === 0
                      ? '教材を読み込み中...'
                      : '該当する教材が見つかりません'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    <td className="p-4 font-medium">{row.title}</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {row.resourceType || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      {row.difficulty ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{row.difficulty}/5</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < row.difficulty!
                                    ? 'bg-primary'
                                    : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.durationMin ? `${row.durationMin}分` : '-'}
                    </td>
                    <td className="p-4">
                      {row.costAmount !== undefined ? (
                        row.costAmount === 0 ? (
                          <span className="text-green-600 font-medium">
                            無料
                          </span>
                        ) : (
                          `¥${row.costAmount.toLocaleString()}`
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4">
                      {row.url ? (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            開く
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 件数サマリ */}
      <div className="text-sm text-muted-foreground text-center">
        {filtered.length} / {rows.length} 件の教材を表示
      </div>
    </div>
  );
};

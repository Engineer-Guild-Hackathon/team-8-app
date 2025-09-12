'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [sortBy, setSortBy] = useState<'おすすめ' | '難易度低' | '難易度高' | '時間短' | '時間長'>('おすすめ');

  useEffect(() => {
    let mounted = true;
    fetch(`/api/graph?topicId=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        const mapped: NodeRow[] = (data?.nodes ?? []).map((n: any) => ({
          id: n.id,
          title: n.title,
          resourceType: n.resourceType ?? 'other',
          difficulty: n.difficulty ?? undefined,
          durationMin: n.durationMin ?? undefined,
          costAmount: n.costAmount ?? undefined,
          url: n.url ?? undefined,
        }));
        setRows(mapped);
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, [slug]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = term ? rows.filter(r => r.title.toLowerCase().includes(term)) : rows.slice();
    switch (sortBy) {
      case '難易度低': list.sort((a,b)=>(a.difficulty??99)-(b.difficulty??99)); break;
      case '難易度高': list.sort((a,b)=>(b.difficulty??-1)-(a.difficulty??-1)); break;
      case '時間短':   list.sort((a,b)=>(a.durationMin??99999)-(b.durationMin??99999)); break;
      case '時間長':   list.sort((a,b)=>(b.durationMin??-1)-(a.durationMin??-1)); break;
      default: break;
    }
    return list;
  }, [q, rows, sortBy]);

  // 以下は既存のテーブルUIを流用（略）…: rows→filtered、検索/並び替えを上記に合わせる
};

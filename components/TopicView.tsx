'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { GraphView } from './GraphView';
import { MaterialList } from './MaterialList';

interface TopicViewProps {
  slug: string;
}

export const TopicView = ({ slug }: TopicViewProps) => {
  const [active, setActive] = useState<'list' | 'graph'>('list');

  return (
    <Tabs
      value={active}
      onValueChange={(v) => setActive(v as 'list' | 'graph')}
      className="space-y-6"
    >
      <div className="flex justify-end">
        <TabsList className="grid w-full max-w-[200px] grid-cols-2">
          <TabsTrigger value="list">リスト</TabsTrigger>
          <TabsTrigger value="graph">グラフ</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="list" className="mt-0">
        <MaterialList slug={slug} />
      </TabsContent>
      <TabsContent value="graph" className="mt-0">
        <GraphView slug={slug} />
      </TabsContent>
    </Tabs>
  );
};

'use client';

import { D3GraphCanvas } from './D3GraphCanvas';

export const GraphView = ({ slug }: { slug: string }) => {
  return (
    <div className="space-y-4">
      <D3GraphCanvas slug={slug} width={800} height={600} />
      <p className="text-center text-sm text-muted-foreground">
        学習順序が矢印で示されます。ノードをドラッグして配置を調整できます。
      </p>
    </div>
  );
};

'use client';

import { D3GraphCanvas } from './D3GraphCanvas';

export const GraphView = ({ slug }: { slug: string }) => {
  return <D3GraphCanvas slug={slug} width={800} height={600} />;
};

import Link from 'next/link';

import { cn } from '@/lib/utils';

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
  className?: string;
  separator?: string;
  'aria-label'?: string;
};

export default function Breadcrumbs({
  items,
  className,
  separator = '›',
  'aria-label': ariaLabel = 'Breadcrumb',
}: Props) {
  if (!items?.length) return null;

  return (
    <nav aria-label={ariaLabel} className={cn('text-sm mb-6', className)}>
      <ol className="flex items-center gap-2 text-muted-foreground">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
              {!isLast && <span aria-hidden>{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

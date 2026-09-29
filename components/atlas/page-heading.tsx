import type { ReactNode } from 'react';

export function PageHeading({
  eyebrow, title, titleId, children, aside,
}: { eyebrow: string; title: string; titleId?: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {aside}
    </div>
  );
}

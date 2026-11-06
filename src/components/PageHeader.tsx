import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions, meta }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-[34px]">{title}</h1>
        {subtitle ? <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        {meta ? <div className="text-right text-sm text-muted-foreground">{meta}</div> : null}
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

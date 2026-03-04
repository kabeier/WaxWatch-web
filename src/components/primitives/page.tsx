import { ReactNode } from "react";

type PageProps = {
  children: ReactNode;
};

type PageHeaderProps = {
  title: string;
  summary?: string;
  meta?: ReactNode;
};

type PageActionsProps = {
  children: ReactNode;
};

export function Page({ children }: PageProps) {
  return <section className="ww-page">{children}</section>;
}

export function PageHeader({ title, summary, meta }: PageHeaderProps) {
  return (
    <header className="ww-page-header">
      <h1>{title}</h1>
      {summary ? <p>{summary}</p> : null}
      {meta ? <div className="ww-page-meta">{meta}</div> : null}
    </header>
  );
}

export function PageActions({ children }: PageActionsProps) {
  return <div className="ww-page-actions">{children}</div>;
}

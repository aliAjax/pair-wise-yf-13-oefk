// 界面层通用小组件，业务组件复用

import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  extra,
  children,
}: {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          {subtitle ? <p className="kicker">{subtitle}</p> : null}
          <h2>{title}</h2>
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

type Tone = "ok" | "warn" | "bad" | "muted" | "info";

const TONE_CLASS: Record<Tone, string> = {
  ok: "tag-ok",
  warn: "tag-warn",
  bad: "tag-bad",
  muted: "tag-muted",
  info: "tag-info",
};

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`tag ${TONE_CLASS[tone]}`}>{children}</span>;
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="empty-hint">{children}</p>;
}

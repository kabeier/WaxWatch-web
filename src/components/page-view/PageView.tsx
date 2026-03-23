import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { WaveTrace } from "@/components/WaveTrace";
import { Card, CardHeader, SectionHeader } from "@/components/ui/primitives/base";

import styles from "./PageView.module.css";

type PageViewProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  centered?: boolean;
  compactWave?: boolean;
};

export function PageView({
  title,
  description,
  eyebrow,
  actions,
  meta,
  tabs,
  children,
  centered = false,
  compactWave = false,
}: PageViewProps) {
  return (
    <section
      className={[styles.page, centered ? styles.pageCentered : ""].filter(Boolean).join(" ")}
    >
      <Card className={styles.headerCard} padding="lg">
        <CardHeader>
          <SectionHeader
            title={title}
            description={description}
            eyebrow={eyebrow}
            actions={actions}
            align={centered ? "center" : "start"}
          />
        </CardHeader>
        {meta ? <div className={styles.headerMeta}>{meta}</div> : null}
        {tabs ? <div>{tabs}</div> : null}
        <div
          className={[styles.headerWave, compactWave ? styles.headerWaveCompact : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <WaveTrace variant="calm" ghosts={false} align="bottom" subdued />
        </div>
      </Card>
      {children}
    </section>
  );
}

type PageCardGroupProps = ComponentPropsWithoutRef<"section"> & {
  columns?: "one" | "two" | "three" | "sidebar";
};

export function PageCardGroup({ className, columns = "one", ...props }: PageCardGroupProps) {
  const columnClass = {
    one: "",
    two: styles.twoUp,
    three: styles.threeUp,
    sidebar: styles.twoColumn,
  }[columns];

  return (
    <section
      className={[styles.cardGroup, columnClass, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function EditorShell({ children }: { children: ReactNode }) {
  return (
    <Card className={styles.editorShell} padding="lg">
      {children}
    </Card>
  );
}

export function ActiveDivider() {
  return (
    <div className={styles.sectionWave}>
      <WaveTrace variant="active" ghosts={false} align="bottom" subdued />
    </div>
  );
}

export { styles as pageViewStyles };

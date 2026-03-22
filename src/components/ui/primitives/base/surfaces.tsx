import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { joinClassNames } from "./shared";

type CardProps = ComponentPropsWithoutRef<"section"> & {
  interactive?: boolean;
  selected?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

export function Card({
  children,
  className,
  interactive = false,
  selected = false,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <section
      className={joinClassNames(
        "ww-card-base",
        interactive && "ww-card-base--interactive",
        selected && "ww-card-base--selected",
        padding !== "md" && `ww-card-base--padding-${padding}`,
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={joinClassNames("ww-card-base__header", className)} {...props} />;
}

export function CardTitle({ children, className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2 className={joinClassNames("ww-card-base__title", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={joinClassNames("ww-card-base__description", className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={joinClassNames("ww-card-base__body", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={joinClassNames("ww-card-base__footer", className)} {...props} />;
}

type SectionHeaderProps = Omit<ComponentPropsWithoutRef<"header">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  align?: "start" | "center";
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  actions,
  align = "start",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <header
      className={joinClassNames("ww-section-header", `ww-section-header--${align}`, className)}
      {...props}
    >
      <div className="ww-section-header__copy">
        {eyebrow ? <p className="ww-section-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="ww-section-header__title">{title}</h1>
        {description ? <p className="ww-section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="ww-section-header__actions">{actions}</div> : null}
    </header>
  );
}

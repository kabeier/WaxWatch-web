import type { ComponentPropsWithoutRef, ReactNode } from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

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

type SectionHeaderProps = ComponentPropsWithoutRef<"header"> & {
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

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
};

export function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "ww-button",
        `ww-button--${variant}`,
        `ww-button--${size}`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type TextInputProps = ComponentPropsWithoutRef<"input"> & {
  error?: boolean;
};

export function TextInput({ className, error = false, type = "text", ...props }: TextInputProps) {
  return (
    <input
      type={type}
      className={joinClassNames("ww-input", error && "ww-input--error", className)}
      {...props}
    />
  );
}

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  error?: boolean;
};

export function Select({ className, error = false, children, ...props }: SelectProps) {
  return (
    <select
      className={joinClassNames("ww-input", "ww-select", error && "ww-input--error", className)}
      {...props}
    >
      {children}
    </select>
  );
}

type CheckboxRowProps = Omit<ComponentPropsWithoutRef<"label">, "children"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: ComponentPropsWithoutRef<"input">["onChange"];
  helperText?: ReactNode;
  errorText?: ReactNode;
  children: ReactNode;
};

export function CheckboxRow({
  children,
  className,
  helperText,
  errorText,
  checked,
  defaultChecked,
  disabled,
  name,
  onChange,
  value,
  ...props
}: CheckboxRowProps) {
  return (
    <label
      className={joinClassNames(
        "ww-checkbox-row",
        disabled && "ww-checkbox-row--disabled",
        Boolean(errorText) && "ww-checkbox-row--error",
        className,
      )}
      {...props}
    >
      <input
        className="ww-checkbox-row__control"
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        name={name}
        onChange={onChange}
        value={value}
      />
      <span className="ww-checkbox-row__copy">
        <span className="ww-checkbox-row__label">{children}</span>
        {helperText ? <span className="ww-checkbox-row__helper">{helperText}</span> : null}
        {errorText ? <span className="ww-checkbox-row__error">{errorText}</span> : null}
      </span>
    </label>
  );
}

type HelperTextProps = ComponentPropsWithoutRef<"p"> & {
  tone?: "default" | "error" | "success" | "warning";
};

export function HelperText({ className, tone = "default", ...props }: HelperTextProps) {
  return (
    <p
      className={joinClassNames("ww-helper-text", `ww-helper-text--${tone}`, className)}
      {...props}
    />
  );
}

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: "neutral" | "accent" | "success" | "warning" | "error";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={joinClassNames("ww-badge", `ww-badge--${tone}`, className)} {...props} />;
}

type ListProps = ComponentPropsWithoutRef<"div"> & {
  dense?: boolean;
};

export function ListContainer({ className, dense = false, ...props }: ListProps) {
  return (
    <div className={joinClassNames("ww-list", dense && "ww-list--dense", className)} {...props} />
  );
}

type ListRowProps = ComponentPropsWithoutRef<"div"> & {
  interactive?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

export function ListRow({
  className,
  interactive = false,
  leading,
  trailing,
  title,
  description,
  children,
  ...props
}: ListRowProps) {
  return (
    <div
      className={joinClassNames(
        "ww-list-row",
        interactive && "ww-list-row--interactive",
        className,
      )}
      {...props}
    >
      {leading ? <div className="ww-list-row__leading">{leading}</div> : null}
      <div className="ww-list-row__content">
        <div className="ww-list-row__title">{title}</div>
        {description ? <div className="ww-list-row__description">{description}</div> : null}
        {children}
      </div>
      {trailing ? <div className="ww-list-row__trailing">{trailing}</div> : null}
    </div>
  );
}

type PageTabsProps = ComponentPropsWithoutRef<"div"> & {
  label?: string;
};

export function PageTabs({ className, label = "Page tabs", ...props }: PageTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={joinClassNames("ww-page-tabs", className)}
      {...props}
    />
  );
}

type PageTabProps = ComponentPropsWithoutRef<"button"> & {
  active?: boolean;
};

export function PageTab({ className, active = false, type = "button", ...props }: PageTabProps) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      className={joinClassNames("ww-page-tab", active && "ww-page-tab--active", className)}
      {...props}
    />
  );
}

type BannerProps = ComponentPropsWithoutRef<"div"> & {
  tone?: "default" | "success" | "warning" | "error";
};

export function Banner({ className, tone = "default", ...props }: BannerProps) {
  return (
    <div className={joinClassNames("ww-banner", `ww-banner--${tone}`, className)} {...props} />
  );
}

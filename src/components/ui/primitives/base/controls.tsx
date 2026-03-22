import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { joinClassNames } from "./shared";

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

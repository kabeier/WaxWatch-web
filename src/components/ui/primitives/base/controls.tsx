import Link from "next/link";
import {
  forwardRef,
  useId,
  type ChangeEventHandler,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { joinClassNames } from "./shared";

function joinAriaIds(...ids: Array<string | null | undefined>) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  return uniqueIds.length > 0 ? uniqueIds.join(" ") : undefined;
}

function isAriaInvalidState(
  value: ComponentPropsWithoutRef<"input">["aria-invalid"],
): value is true | "true" | "grammar" | "spelling" {
  return value === true || value === "true" || value === "grammar" || value === "spelling";
}

function resolveAriaInvalidState({
  ariaInvalid,
  error,
  ariaErrorMessage,
}: {
  ariaInvalid: ComponentPropsWithoutRef<"input">["aria-invalid"];
  error: boolean;
  ariaErrorMessage?: string;
}) {
  if (ariaInvalid !== undefined) {
    return ariaInvalid;
  }

  if (error || Boolean(ariaErrorMessage)) {
    return true;
  }

  return undefined;
}

type ButtonVariants = {
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
};

function getButtonClassName({
  className,
  variant = "primary",
  size = "md",
}: {
  className?: string;
} & ButtonVariants) {
  return joinClassNames("ww-button", `ww-button--${variant}`, `ww-button--${size}`, className);
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & ButtonVariants;

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & ButtonVariants;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, type = "button", variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      type={type}
      className={getButtonClassName({ className, variant, size })}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return <Link className={getButtonClassName({ className, variant, size })} {...props} />;
}

type TextInputProps = ComponentPropsWithoutRef<"input"> & {
  error?: boolean;
  errorMessageId?: string;
};

export function TextInput({
  className,
  error = false,
  errorMessageId,
  type = "text",
  ...props
}: TextInputProps) {
  const {
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    "aria-errormessage": ariaErrorMessage,
    ...restProps
  } = props;
  const resolvedAriaInvalid = resolveAriaInvalidState({
    ariaInvalid,
    error,
    ariaErrorMessage,
  });
  const isInvalid = isAriaInvalidState(resolvedAriaInvalid);
  const resolvedErrorMessageId = ariaErrorMessage ?? errorMessageId;
  const describedByIds = joinAriaIds(
    ariaDescribedBy,
    isInvalid ? resolvedErrorMessageId : undefined,
  );
  const shouldSetAriaErrorMessage = isInvalid ? resolvedErrorMessageId : undefined;

  return (
    <input
      type={type}
      className={joinClassNames("ww-input", isInvalid && "ww-input--error", className)}
      aria-invalid={resolvedAriaInvalid}
      aria-describedby={describedByIds}
      aria-errormessage={shouldSetAriaErrorMessage}
      {...restProps}
    />
  );
}

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  error?: boolean;
  errorMessageId?: string;
};

export function Select({
  className,
  error = false,
  errorMessageId,
  children,
  ...props
}: SelectProps) {
  const {
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    "aria-errormessage": ariaErrorMessage,
    ...restProps
  } = props;
  const resolvedAriaInvalid = resolveAriaInvalidState({
    ariaInvalid,
    error,
    ariaErrorMessage,
  });
  const isInvalid = isAriaInvalidState(resolvedAriaInvalid);
  const resolvedErrorMessageId = ariaErrorMessage ?? errorMessageId;
  const describedByIds = joinAriaIds(
    ariaDescribedBy,
    isInvalid ? resolvedErrorMessageId : undefined,
  );
  const shouldSetAriaErrorMessage = isInvalid ? resolvedErrorMessageId : undefined;

  return (
    <select
      className={joinClassNames("ww-input", "ww-select", isInvalid && "ww-input--error", className)}
      aria-invalid={resolvedAriaInvalid}
      aria-describedby={describedByIds}
      aria-errormessage={shouldSetAriaErrorMessage}
      {...restProps}
    >
      {children}
    </select>
  );
}

type CheckboxRowProps = Omit<ComponentPropsWithoutRef<"label">, "children" | "onChange"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  helperText?: ReactNode;
  errorText?: ReactNode;
  error?: boolean;
  errorMessageId?: string;
  inputAriaInvalid?: ComponentPropsWithoutRef<"input">["aria-invalid"];
  inputAriaDescribedBy?: string;
  inputAriaErrorMessage?: string;
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
  error = false,
  errorMessageId,
  inputAriaInvalid,
  inputAriaDescribedBy,
  inputAriaErrorMessage,
  ...props
}: CheckboxRowProps) {
  const helperTextId = useId();
  const errorTextId = useId();
  const resolvedErrorMessageId =
    inputAriaErrorMessage ?? errorMessageId ?? (errorText ? errorTextId : undefined);
  const resolvedAriaInvalid = resolveAriaInvalidState({
    ariaInvalid: inputAriaInvalid,
    error: error || Boolean(errorText),
    ariaErrorMessage: inputAriaErrorMessage,
  });
  const isInvalid = isAriaInvalidState(resolvedAriaInvalid);
  const ariaDescribedBy = joinAriaIds(
    inputAriaDescribedBy,
    helperText ? helperTextId : null,
    isInvalid ? resolvedErrorMessageId : null,
  );

  return (
    <label
      className={joinClassNames(
        "ww-checkbox-row",
        disabled && "ww-checkbox-row--disabled",
        isInvalid && "ww-checkbox-row--error",
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
        aria-invalid={resolvedAriaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-errormessage={isInvalid ? resolvedErrorMessageId : undefined}
      />
      <span className="ww-checkbox-row__copy">
        <span className="ww-checkbox-row__label">{children}</span>
        {helperText ? (
          <span className="ww-checkbox-row__helper" id={helperTextId}>
            {helperText}
          </span>
        ) : null}
        {errorText ? (
          <span className="ww-checkbox-row__error" id={errorTextId}>
            {errorText}
          </span>
        ) : null}
      </span>
    </label>
  );
}

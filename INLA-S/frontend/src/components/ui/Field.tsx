import type { ReactNode } from "react";

type FieldOption = string | { value: string; label: string };

type FieldProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  error?: string;
  readOnly?: boolean;
  disabled?: boolean;
  type?: string;
  name?: string;
  autoComplete?: string;
  as?: "input" | "textarea" | "select";
  rows?: number;
  options?: FieldOption[];
  icon?: ReactNode;
  /** Hide the label until the control is hovered or focused. */
  labelOnHover?: boolean;
  /** Red asterisk inside the control, right-aligned. Hidden once the value is non-blank. */
  requiredInside?: boolean;
  /** Stretch a textarea to the height of its grid cell. */
  stretch?: boolean;
  trailing?: ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
};

function optionOf(option: FieldOption): { value: string; label: string } {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function Field({
  label,
  required,
  placeholder,
  value,
  error,
  readOnly,
  disabled,
  type = "text",
  name,
  autoComplete,
  as = "input",
  rows,
  options = [],
  icon,
  labelOnHover = false,
  requiredInside = false,
  stretch = false,
  trailing,
  onChange,
  onBlur,
}: FieldProps) {
  const control = [
    "w-full rounded-[4px] border-[1.05px] bg-white px-3 text-sm leading-[21px] text-[#111827] outline-none",
    "placeholder:text-[#9ca3af] transition-[border-color,box-shadow,background-color] duration-150",
    "hover:border-[#9ca3af]",
    "focus:border-[var(--color-action-primary)] focus:shadow-[0_0_0_3px_var(--color-input-ring)]",
    "disabled:cursor-not-allowed disabled:border-[#e5e7eb] disabled:bg-[#f9fafb] disabled:text-[#6b7280] disabled:hover:border-[#e5e7eb]",
  ].join(" ");
  const border = error
    ? "border-[var(--color-semantic-error)] hover:border-[var(--color-semantic-error)] focus:border-[var(--color-semantic-error)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
    : readOnly
      ? "cursor-default border-transparent bg-[#f9fafb] px-3 text-base font-medium text-[#111827] hover:border-transparent focus:border-transparent focus:shadow-none"
      : "border-[#d1d5db]";

  const blank = (value ?? "").trim() === "";
  const showAsterisk = Boolean(required && requiredInside && blank);
  const shared = {
    name,
    disabled,
    placeholder,
    autoComplete,
    "aria-label": labelOnHover ? label : undefined,
    "aria-required": required || undefined,
    "aria-invalid": error ? true : undefined,
    ...(onChange
      ? {
          value: value ?? "",
          onChange: (event: { target: { value: string } }) => onChange(event.target.value),
          onBlur,
        }
      : { defaultValue: as === "select" ? (value ?? "") : value }),
  };

  const pad = showAsterisk ? "pr-7" : "";
  const input = as === "textarea" ? (
    <textarea
      {...shared}
      rows={rows ?? 4}
      readOnly={readOnly}
      className={`${control} ${pad} ${stretch ? "h-full min-h-0 flex-1 resize-none py-1.5" : rows === 1 ? "h-10 min-h-10 resize-none py-2" : rows ? "h-auto py-1.5" : "h-24 py-2"} ${border}`}
    />
  ) : as === "select" ? (
    <select {...shared} className={`${control} h-10 ${border}`}>
      <option value="" disabled>
        {placeholder ?? "Chọn"}
      </option>
      {options.map((option) => {
        const choice = optionOf(option);
        return (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        );
      })}
    </select>
  ) : (
    <input type={type} {...shared} readOnly={readOnly} className={`${control} h-10 ${pad} ${border} ${trailing ? "pr-11" : ""}`} />
  );

  const adorned = showAsterisk || (trailing && as === "input") || labelOnHover;
  const controlBox = adorned ? (
    <span className={`relative min-w-0 flex-1 ${stretch ? "flex h-full min-h-0" : "block"}`}>
      {input}
      {showAsterisk ? (
        <span className={`pointer-events-none absolute right-2.5 font-semibold text-[var(--color-semantic-error)] ${as === "textarea" ? "top-2" : "top-1/2 -translate-y-1/2"}`} aria-hidden>
          *
        </span>
      ) : null}
      {trailing && as === "input" ? trailing : null}
      {labelOnHover ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 whitespace-nowrap rounded bg-[#111827] px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity group-hover/field:opacity-100 group-focus-within/field:opacity-100"
        >
          {label}
        </span>
      ) : null}
    </span>
  ) : (
    input
  );

  return (
    <label className={`flex w-full flex-col gap-1 ${stretch ? "h-full min-h-0 flex-1" : ""}`}>
      {labelOnHover ? <span className="print-only text-xs leading-4 font-semibold text-[var(--color-text-body)]">{label}</span> : null}
      {labelOnHover ? null : (
        <span className="text-sm leading-5 font-semibold text-[var(--color-text-body)]">
          {label}{" "}
          {required && !requiredInside ? <span className="text-[var(--color-semantic-error)]">(*)</span> : null}
        </span>
      )}
      <span className={`${labelOnHover ? "group/field " : ""}${icon ? `flex min-w-0 gap-2 ${stretch ? "h-full min-h-0 flex-1 items-stretch" : "items-center"}` : stretch ? "block h-full min-h-0 flex-1" : "block"}`}>
        {icon ? (
          <span className={`shrink-0 text-[#6b7280] ${stretch ? "self-center" : ""}`} aria-hidden>
            {icon}
          </span>
        ) : null}
        {controlBox}
      </span>
      {error ? (
        <span className="text-xs text-[var(--color-semantic-error)]">{error}</span>
      ) : null}
    </label>
  );
}

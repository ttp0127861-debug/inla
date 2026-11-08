import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

function foldVietnamese(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, (m) => (m === "đ" ? "d" : "D"))
    .toLowerCase();
}

function filterOptions(options: readonly string[], query: string): string[] {
  const q = foldVietnamese(query.trim());
  if (!q) return [...options];
  return options.filter((option) => foldVietnamese(option).includes(q));
}

type ComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  label?: string;
  labelOnHover?: boolean;
  required?: boolean;
  requiredInside?: boolean;
  icon?: ReactNode;
  allowCustom?: boolean;
  error?: string;
  onDraftChange?: (draft: string) => void;
};

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  id: idProp,
  ariaLabel,
  label,
  labelOnHover = false,
  required,
  requiredInside,
  icon,
  allowCustom = true,
  error,
  onDraftChange,
}: ComboboxProps) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listId = `${inputId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [draft, setDraft] = useState(value);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const filtered = useMemo(() => filterOptions(options, draft), [options, draft]);

  useEffect(() => {
    setHighlight(0);
  }, [draft, open]);

  const selectOption = (option: string) => {
    onChange(option);
    setDraft(option);
    setOpen(false);
  };

  const onInputChange = (next: string) => {
    setDraft(next);
    onDraftChange?.(next);
    if (allowCustom) onChange(next);
    setOpen(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setHighlight((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && open && filtered.length > 0) {
      event.preventDefault();
      selectOption(filtered[highlight] ?? filtered[0]);
    }
  };

  const border = error
    ? "border-[var(--color-semantic-error)] focus:border-[var(--color-semantic-error)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
    : "border-[#d1d5db] focus:border-[var(--color-action-primary)] focus:shadow-[0_0_0_3px_var(--color-input-ring)]";

  const blank = (value ?? "").trim() === "";
  const showAsterisk = Boolean(required && requiredInside && blank);
  const resolvedLabel = label ?? ariaLabel ?? placeholder ?? "";

  const inputEl = (
    <div ref={rootRef} className={`relative min-w-0 flex-1 ${labelOnHover ? "group/field" : ""}`}>
      {labelOnHover ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 whitespace-nowrap rounded bg-[#111827] px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity group-hover/field:opacity-100 group-focus-within/field:opacity-100"
        >
          {resolvedLabel}
        </span>
      ) : null}
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={labelOnHover ? resolvedLabel : ariaLabel ?? placeholder}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        placeholder={placeholder}
        value={draft}
        autoComplete="off"
        className={`h-10 w-full rounded-[4px] border-[1.05px] bg-white px-3 text-sm leading-[21px] text-[#111827] outline-none placeholder:text-[#9ca3af] hover:border-[#9ca3af] disabled:cursor-not-allowed disabled:border-[#e5e7eb] disabled:bg-[#f9fafb] disabled:text-[#6b7280] ${showAsterisk ? "pr-7" : ""} ${border}`}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => {
            setOpen(false);
            if (!allowCustom) {
              setDraft(value);
            }
          }, 150);
        }}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {showAsterisk ? (
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-semibold text-[var(--color-semantic-error)]" aria-hidden>
          *
        </span>
      ) : null}
      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-[4px] border border-[#d1d5db] bg-white py-1 shadow-[var(--shadow-card)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]" role="option" aria-selected={false}>
              Không tìm thấy
            </li>
          ) : (
            filtered.map((option, index) => (
              <li key={option} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  className={`w-full px-3 py-2 text-left text-sm ${
                    index === highlight ? "bg-[#eff6ff] text-[var(--color-action-primary)]" : "text-[#111827] hover:bg-[#f9fafb]"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlight(index)}
                >
                  {option}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {error ? <p className="mt-1 text-xs text-[var(--color-semantic-error)]">{error}</p> : null}
    </div>
  );

  return (
    <div className="w-full">
      {labelOnHover ? null : label ? (
        <span className="mb-1 block text-sm leading-5 font-semibold text-[var(--color-text-body)]">{label}</span>
      ) : null}
      <div className={`flex min-w-0 gap-2 ${icon ? "items-center" : ""}`}>
        {icon ? <span className="text-[#6b7280]" aria-hidden>{icon}</span> : null}
        {inputEl}
      </div>
    </div>
  );
}

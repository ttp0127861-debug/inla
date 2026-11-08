import { HoverTooltip } from "./HoverTooltip";

type AccountStatusIconProps = {
  enabled: boolean;
  cognitoStatusKey: string;
  enabledText: string;
  cognitoText: string;
};

function toneClass(enabled: boolean, cognitoStatusKey: string): string {
  if (!enabled) return "text-[#b91c1c]";
  if (cognitoStatusKey !== "CONFIRMED") return "text-[#c2410c]";
  return "text-[#047857]";
}

function StatusGlyph({ enabled, cognitoStatusKey }: { enabled: boolean; cognitoStatusKey: string }) {
  const className = `h-5 w-5 ${toneClass(enabled, cognitoStatusKey)}`;

  if (!enabled) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
      </svg>
    );
  }

  if (cognitoStatusKey !== "CONFIRMED") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <path d="M15 7a2 2 0 0 1 2 2m3 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5 11 15l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AccountStatusIcon({ enabled, enabledText, cognitoText, cognitoStatusKey }: AccountStatusIconProps) {
  const ariaLabel = cognitoText ? `${enabledText}. ${cognitoText}` : enabledText;
  const lines = cognitoText ? [enabledText, cognitoText] : [enabledText];

  return (
    <HoverTooltip title={ariaLabel} lines={lines}>
      <span
        tabIndex={0}
        role="img"
        aria-label={ariaLabel}
        title={ariaLabel}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)] focus-visible:ring-offset-1"
      >
        <StatusGlyph enabled={enabled} cognitoStatusKey={cognitoStatusKey} />
      </span>
    </HoverTooltip>
  );
}

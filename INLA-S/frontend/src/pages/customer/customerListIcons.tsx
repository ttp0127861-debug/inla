const iconClass = "h-[18px] w-[18px]";

export function IconView() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} aria-hidden>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconUnlink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} aria-hidden>
      <path d="M9 15 7.5 16.5A5 5 0 1 1 4.5 13.5L6 12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m15 9 1.5-1.5A5 5 0 1 1 19.5 10.5L18 12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 16 8-8M16 16l-8-8" strokeLinecap="round" />
    </svg>
  );
}

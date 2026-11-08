import type { ReactNode } from "react";

function CustomerFieldIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const customerFormIcons = {
  name: (
    <CustomerFieldIcon>
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-3" />
      <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
    </CustomerFieldIcon>
  ),
  shortName: (
    <CustomerFieldIcon>
      <path d="M4 7h16" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
    </CustomerFieldIcon>
  ),
  taxId: (
    <CustomerFieldIcon>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 3v4h4M9 13h6M9 17h4" />
    </CustomerFieldIcon>
  ),
  website: (
    <CustomerFieldIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </CustomerFieldIcon>
  ),
  phone: (
    <CustomerFieldIcon>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </CustomerFieldIcon>
  ),
  email: (
    <CustomerFieldIcon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </CustomerFieldIcon>
  ),
  province: (
    <CustomerFieldIcon>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </CustomerFieldIcon>
  ),
  address: (
    <CustomerFieldIcon>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </CustomerFieldIcon>
  ),
  notes: (
    <CustomerFieldIcon>
      <path d="M8 4h8v2H8z" />
      <path d="M8 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />
      <path d="M9 13h6M9 17h4" />
    </CustomerFieldIcon>
  ),
  person: (
    <CustomerFieldIcon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </CustomerFieldIcon>
  ),
  jobTitle: (
    <CustomerFieldIcon>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </CustomerFieldIcon>
  ),
  department: (
    <CustomerFieldIcon>
      <path d="M4 20V10l8-5 8 5v10" />
      <path d="M9 20v-6h6v6" />
    </CustomerFieldIcon>
  ),
  role: (
    <CustomerFieldIcon>
      <path d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.6L12 15.8 7.1 17.5 8 11.9 4 8l5.6-1.2L12 2z" />
    </CustomerFieldIcon>
  ),
  customerType: (
    <CustomerFieldIcon>
      <path d="M7 7h10v14H7z" />
      <path d="M9 3h6v4H9z" />
    </CustomerFieldIcon>
  ),
  status: (
    <CustomerFieldIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </CustomerFieldIcon>
  ),
  sales: (
    <CustomerFieldIcon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </CustomerFieldIcon>
  ),
};

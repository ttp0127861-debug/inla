export type AppNavigate = (to: string, options?: { replace?: boolean }) => void;

let navigateRef: AppNavigate | null = null;

export function registerAuthNavigate(navigate: AppNavigate): void {
  navigateRef = navigate;
}

export function authNavigate(to: string, replace = true): void {
  if (navigateRef) {
    navigateRef(to, { replace });
    return;
  }
  window.location.assign(to);
}
